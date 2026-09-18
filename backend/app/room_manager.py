import asyncio
import secrets
import string
import time
from dataclasses import dataclass, field

from fastapi import WebSocket, WebSocketDisconnect

from app.game import Game


ROOM_CODE_LENGTH = 6
ROOM_CODE_ALPHABET = string.ascii_uppercase + string.digits

@dataclass
class Room:
    code: str
    blue_player: WebSocket | None
    blue_nickname: str
    blue_avatar_id: str
    red_player: WebSocket | None = None
    red_nickname: str | None = None
    red_avatar_id: str | None = None
    game: Game = field(default_factory=Game)
    tokens: dict[str, str] = field(default_factory=lambda: {
        color: secrets.token_urlsafe(32) for color in ('blue', 'red')
    })
    deadlines: dict[str, float] = field(default_factory=dict)
    timers: dict[str, asyncio.TimerHandle] = field(default_factory=dict)
    ended_reason: str | None = None
    cleanup_timer: asyncio.TimerHandle | None = None


class RoomManager:
    def __init__(self, reconnect_seconds=60):
        self.rooms: dict[str, Room] = {}
        self.reconnect_seconds = reconnect_seconds

    def snapshot(self, room, color=None, message_type='match_status'):
        now = time.monotonic()
        message = {
            'type': message_type,
            'roomCode': room.code,
            'players': {
                side: {
                    'nickname': getattr(room, f'{side}_nickname'),
                    'avatarId': getattr(room, f'{side}_avatar_id'),
                } for side in ('blue', 'red')
            },
            **room.game.to_message(),
            'paused': bool(room.deadlines) and room.ended_reason is None,
            'reconnectRemainingMs': {
                side: max(0, round((deadline - now) * 1000))
                for side, deadline in room.deadlines.items()
            },
            'endedReason': room.ended_reason,
        }
        if color is not None:
            message['color'] = color
            message['sessionToken'] = room.tokens[color]
        return message

    def _delete_room(self, room):
        self.rooms.pop(room.code, None)
        for timer in room.timers.values():
            timer.cancel()
        room.timers.clear()
        if room.cleanup_timer:
            room.cleanup_timer.cancel()

    def _finish(self, room, winner, reason):
        room.ended_reason = reason
        room.game.winner = winner
        room.game.is_draw = winner is None
        for timer in room.timers.values():
            timer.cancel()
        room.timers.clear()
        room.deadlines.clear()
        # Keep the result briefly so a late returning player can see it.
        room.cleanup_timer = asyncio.get_running_loop().call_later(
            300, self._delete_room, room,
        )

    async def expire(self, room):
        if room.ended_reason or self.rooms.get(room.code) is not room:
            return
        if not any(end <= time.monotonic() for end in room.deadlines.values()):
            return
        if room.game.current_player is None:
            self._delete_room(room)
            return
        connected = [side for side in ('blue', 'red')
                     if getattr(room, f'{side}_player') is not None]
        winner = connected[0] if len(connected) == 1 else None
        self._finish(room, winner, 'reconnect_timeout')
        await self.broadcast(room, self.snapshot(room))
        if not connected:
            self._delete_room(room)

    async def resume(self, websocket, room_code, token):
        if self.find_player(websocket):
            raise ValueError('Соединение уже находится в комнате')
        room = self.rooms.get(room_code) if isinstance(room_code, str) else None
        if room is None or not isinstance(token, str):
            raise ValueError('Матч больше недоступен')
        color = next((side for side in ('blue', 'red')
                      if secrets.compare_digest(room.tokens[side], token)), None)
        if color is None or (color == 'red' and room.red_nickname is None):
            raise ValueError('Недействительная сессия')
        await self.expire(room)
        if self.rooms.get(room.code) is not room:
            raise ValueError('Время переподключения истекло')
        previous = getattr(room, f'{color}_player')
        setattr(room, f'{color}_player', websocket)
        room.deadlines.pop(color, None)
        timer = room.timers.pop(color, None)
        if timer:
            timer.cancel()
        # The old socket's finally must not disconnect the replacement.
        if previous is not None and previous is not websocket:
            try:
                await previous.close(code=4001)
            except (RuntimeError, OSError):
                pass
        await websocket.send_json(self.snapshot(room, color, 'session_resumed'))
        await self.broadcast(room, self.snapshot(room))

    async def make_move(self, websocket, row, column, direction):
        player = self.find_player(websocket)
        if player is None:
            raise ValueError('Игрок не находится в комнате')
        room, color = player
        await self.expire(room)
        if room.ended_reason:
            raise ValueError('Матч завершён')
        if room.deadlines:
            raise ValueError('Матч приостановлен: ожидаем переподключения')
        skipped = room.game.make_move(color, row, column, direction)
        if room.game.winner or room.game.is_draw:
            self._finish(room, room.game.winner, 'normal')
        await self.broadcast(room, {
            **self.snapshot(room, message_type='game_state'),
            'skippedPlayer': skipped,
        })

    def create_room(
        self,
        websocket: WebSocket,
        nickname: str,
        avatar_id: str,
    ) -> Room:
        room_code = self._generate_room_code()

        room = Room(
            code=room_code,
            blue_player=websocket,
            blue_nickname=nickname,
            blue_avatar_id=avatar_id,
        )

        self.rooms[room_code] = room
        return room

    async def leave_room(
        self,
        websocket: WebSocket,
    ) -> bool:
        player = self.find_player(websocket)

        if player is None:
            return False

        room, player_color = player

        opponent = (
            room.red_player
            if player_color == 'blue'
            else room.blue_player
        )

        if room.game.current_player is not None:
            setattr(room, f'{player_color}_player', None)
            if room.ended_reason is None:
                self._finish(room, 'red' if player_color == 'blue' else 'blue', 'opponent_left')
            await self.broadcast(room, self.snapshot(room))
            if room.blue_player is None and room.red_player is None:
                self._delete_room(room)
            return True

        self._delete_room(room)

        if opponent is not None:
            await self._send_safely(
                opponent,
                {
                    'type': 'opponent_left',
                },
            )

        return True

    async def _send_safely(
        self,
        websocket: WebSocket,
        message: dict,
    ) -> bool:
        try:
            await websocket.send_json(message)
            return True
        except (WebSocketDisconnect, RuntimeError, OSError):
            return False

    def join_room(
        self,
        room_code: str,
        websocket: WebSocket,
        nickname: str,
        avatar_id: str,
    ) -> Room:
        normalized_code = room_code.strip().upper()
        room = self.rooms.get(normalized_code)

        if room is None:
            raise ValueError('Комната не найдена')

        if room.red_nickname is not None or room.ended_reason:
            raise ValueError('Комната уже заполнена')

        if room.blue_player is None:
            raise ValueError('Создатель комнаты переподключается')

        room.red_player = websocket
        room.red_nickname = nickname
        room.red_avatar_id = avatar_id
        room.game.start()

        return room

    def find_player(
        self,
        websocket: WebSocket,
    ) -> tuple[Room, str] | None:
        for room in self.rooms.values():
            if websocket is room.blue_player:
                return room, 'blue'

            if websocket is room.red_player:
                return room, 'red'

        return None

    async def broadcast(
        self,
        room: Room,
        message: dict,
    ):
        if room.blue_player is not None:
            await self._send_safely(room.blue_player, message)

        if room.red_player is not None:
            await self._send_safely(
                room.red_player,
                message,
            )

    async def remove_player(
        self,
        websocket: WebSocket,
    ):
        player = self.find_player(websocket)
        if player is None:
            return
        room, color = player
        setattr(room, f'{color}_player', None)
        if room.ended_reason:
            return
        room.deadlines[color] = time.monotonic() + self.reconnect_seconds
        room.timers[color] = asyncio.get_running_loop().call_later(
            self.reconnect_seconds, lambda: asyncio.create_task(self.expire(room)),
        )
        await self.broadcast(room, self.snapshot(room))

    def _generate_room_code(self) -> str:
        while True:
            code = ''.join(
                secrets.choice(ROOM_CODE_ALPHABET)
                for _ in range(ROOM_CODE_LENGTH)
            )

            if code not in self.rooms:
                return code
