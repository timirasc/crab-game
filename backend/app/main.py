import asyncio
from json import JSONDecodeError

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.room_manager import RoomManager


app = FastAPI(title='Crab Game API')
room_manager = RoomManager()
ALLOWED_AVATAR_IDS = {
    'turtle',
    'mermaid',
    'shark',
    'octopus',
    'seagull',
    'robot',
}


def validate_nickname(value) -> str:
    if not isinstance(value, str):
        raise ValueError('Никнейм не указан')

    nickname = value.strip()

    if len(nickname) < 2:
        raise ValueError(
            'Никнейм должен содержать минимум 2 символа'
        )

    if len(nickname) > 10:
        raise ValueError(
            'Никнейм должен содержать максимум 10 символов'
        )

    if not nickname.isprintable():
        raise ValueError(
            'Никнейм содержит недопустимые символы'
        )

    return nickname


def validate_avatar_id(value) -> str:
    if not isinstance(value, str):
        raise ValueError('Аватар не выбран')

    if value not in ALLOWED_AVATAR_IDS:
        raise ValueError('Выбран неизвестный аватар')

    return value


async def send_error(
    websocket: WebSocket,
    message: str,
):
    await websocket.send_json(
        {
            'type': 'error',
            'message': message,
        }
    )


@app.get('/health')
async def health_check():
    return {'status': 'ok'}


@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    await websocket.send_json(
        {
            'type': 'connected',
        }
    )

    try:
        while True:
            try:
                message = await asyncio.wait_for(websocket.receive_json(), timeout=20)
            except JSONDecodeError:
                await send_error(websocket, 'Некорректный JSON')
                continue

            if not isinstance(message, dict):
                await send_error(
                    websocket,
                    'Сообщение должно быть JSON-объектом',
                )
                continue

            message_type = message.get('type')

            if not isinstance(message_type, str):
                await send_error(
                    websocket,
                    'Тип сообщения не указан',
                )
                continue

            if message_type == 'ping':
                await websocket.send_json({'type': 'pong'})
                continue

            if message_type == 'resume_session':
                try:
                    await room_manager.resume(
                        websocket, message.get('roomCode'), message.get('sessionToken'),
                    )
                except ValueError as error:
                    await websocket.send_json({'type': 'resume_rejected', 'message': str(error)})
                continue

            if message_type == 'create_room':
                if room_manager.find_player(websocket):
                    await send_error(
                        websocket,
                        'Игрок уже находится в комнате',
                    )
                    continue

                try:
                    nickname = validate_nickname(
                        message.get('nickname')
                    )
                    avatar_id = validate_avatar_id(
                        message.get('avatarId')
                    )
                except ValueError as error:
                    await send_error(websocket, str(error))
                    continue

                room = room_manager.create_room(
                    websocket,
                    nickname,
                    avatar_id,
                )

                await websocket.send_json(
                    {
                        'type': 'room_created',
                        'roomCode': room.code,
                        'color': 'blue',
                        'sessionToken': room.tokens['blue'],
                    }
                )

            elif message_type == 'join_room':
                if room_manager.find_player(websocket):
                    await send_error(
                        websocket,
                        'Игрок уже находится в комнате',
                    )
                    continue

                room_code = message.get('roomCode')

                if not isinstance(room_code, str):
                    await send_error(
                        websocket,
                        'Некорректный код комнаты',
                    )
                    continue

                try:
                    nickname = validate_nickname(
                        message.get('nickname')
                    )
                    avatar_id = validate_avatar_id(
                        message.get('avatarId')
                    )
                    room = room_manager.join_room(
                        room_code,
                        websocket,
                        nickname,
                        avatar_id,
                    )
                except ValueError as error:
                    await send_error(websocket, str(error))
                    continue

                await room.blue_player.send_json(
                    room_manager.snapshot(room, 'blue', 'game_started')
                )

                await room.red_player.send_json(
                    room_manager.snapshot(room, 'red', 'game_started')
                )

            elif message_type == 'leave_room':
                room_was_removed = await room_manager.leave_room(
                    websocket
                )

                if not room_was_removed:
                    await send_error(
                        websocket,
                        'Игрок не находится в комнате',
                    )
                    continue

                await websocket.send_json(
                    {
                        'type': 'room_left',
                    }
                )

            elif message_type == 'move':
                player = room_manager.find_player(websocket)

                if player is None:
                    await send_error(
                        websocket,
                        'Игрок не находится в комнате',
                    )
                    continue

                room, player_color = player

                row = message.get('row')
                column = message.get('column')
                direction = message.get('direction')

                if (
                    type(row) is not int
                    or type(column) is not int
                    or not isinstance(direction, str)
                ):
                    await send_error(
                        websocket,
                        'Некорректные данные хода',
                    )
                    continue

                try:
                    await room_manager.make_move(websocket, row, column, direction)
                except ValueError as error:
                    await send_error(websocket, str(error))
                    continue


            else:
                await send_error(
                    websocket,
                    'Неизвестный тип сообщения',
                )

    except (WebSocketDisconnect, asyncio.TimeoutError, OSError):
        pass
    finally:
        await room_manager.remove_player(websocket)
        try:
            await websocket.close()
        except (RuntimeError, OSError):
            pass
