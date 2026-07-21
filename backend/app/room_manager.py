import secrets
import string
from dataclasses import dataclass, field

from fastapi import WebSocket

from app.game import Game


ROOM_CODE_LENGTH = 6
ROOM_CODE_ALPHABET = string.ascii_uppercase + string.digits


@dataclass
class Room:
    code: str
    blue_player: WebSocket
    red_player: WebSocket | None = None
    game: Game = field(default_factory=Game)


class RoomManager:
    def __init__(self):
        self.rooms: dict[str, Room] = {}

    def create_room(self, websocket: WebSocket) -> Room:
        room_code = self._generate_room_code()

        room = Room(
            code=room_code,
            blue_player=websocket,
        )

        self.rooms[room_code] = room
        return room

    def join_room(
        self,
        room_code: str,
        websocket: WebSocket,
    ) -> Room:
        normalized_code = room_code.strip().upper()
        room = self.rooms.get(normalized_code)

        if room is None:
            raise ValueError('Комната не найдена')

        if room.red_player is not None:
            raise ValueError('Комната уже заполнена')

        room.red_player = websocket
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
        await room.blue_player.send_json(message)

        if room.red_player is not None:
            await room.red_player.send_json(message)

    async def remove_player(self, websocket: WebSocket):
        player = self.find_player(websocket)

        if player is None:
            return

        room, player_color = player
        opponent = (
            room.red_player
            if player_color == 'blue'
            else room.blue_player
        )

        del self.rooms[room.code]

        if opponent is not None:
            await opponent.send_json(
                {
                    'type': 'opponent_disconnected',
                }
            )

    def _generate_room_code(self) -> str:
        while True:
            code = ''.join(
                secrets.choice(ROOM_CODE_ALPHABET)
                for _ in range(ROOM_CODE_LENGTH)
            )

            if code not in self.rooms:
                return code