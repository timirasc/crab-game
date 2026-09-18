import asyncio
import time
import unittest

from fastapi.testclient import TestClient

from app.main import app, room_manager
from app.room_manager import RoomManager


class Socket:
    def __init__(self):
        self.messages = []

    async def send_json(self, message):
        self.messages.append(message)

    async def close(self, code=1000):
        pass


class ReconnectTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.manager = RoomManager(reconnect_seconds=60)
        self.blue, self.red = Socket(), Socket()
        self.room = self.manager.create_room(self.blue, 'Blue', 'turtle')
        self.manager.join_room(self.room.code, self.red, 'Red', 'robot')

    def tearDown(self):
        self.manager._delete_room(self.room)

    async def test_disconnect_pauses_and_resume_preserves_game(self):
        before = self.room.game.to_message()
        await self.manager.remove_player(self.blue)
        self.assertTrue(self.red.messages[-1]['paused'])
        remaining = self.red.messages[-1]['reconnectRemainingMs']['blue']
        self.assertGreater(remaining, 59000)
        self.assertLessEqual(remaining, 60000)
        with self.assertRaisesRegex(ValueError, 'приостановлен'):
            await self.manager.make_move(self.red, 0, 0, 'down')
        with self.assertRaisesRegex(ValueError, 'заполнена'):
            self.manager.join_room(self.room.code, Socket(), 'Intruder', 'robot')
        new_socket = Socket()
        await self.manager.resume(new_socket, self.room.code, self.room.tokens['blue'])
        self.assertEqual(self.room.game.to_message(), before)
        self.assertFalse(self.room.deadlines)
        self.assertFalse(self.red.messages[-1]['paused'])
        self.assertIs(self.room.blue_player, new_socket)
        await self.manager.remove_player(self.blue)
        self.assertIs(self.room.blue_player, new_socket)

    async def test_invalid_token_cannot_resume(self):
        await self.manager.remove_player(self.blue)
        with self.assertRaisesRegex(ValueError, 'сессия'):
            await self.manager.resume(Socket(), self.room.code, 'invalid')
        self.assertIsNone(self.room.blue_player)

    async def test_deadline_is_enforced_even_before_timer_callback(self):
        await self.manager.remove_player(self.blue)
        self.room.deadlines['blue'] = time.monotonic() - 1
        late = Socket()
        await self.manager.resume(late, self.room.code, self.room.tokens['blue'])
        self.assertEqual(self.room.game.winner, 'red')
        self.assertEqual(late.messages[0]['endedReason'], 'reconnect_timeout')
        with self.assertRaisesRegex(ValueError, 'завершён'):
            await self.manager.make_move(self.red, 0, 2, 'down')

    async def test_both_disconnected_close_without_winner(self):
        await self.manager.remove_player(self.blue)
        await self.manager.remove_player(self.red)
        self.room.deadlines['blue'] = time.monotonic() - 1
        await self.manager.expire(self.room)
        self.assertIsNone(self.room.game.winner)
        self.assertTrue(self.room.game.is_draw)
        self.assertNotIn(self.room.code, self.manager.rooms)

    async def test_repeated_disconnect_does_not_extend_deadline(self):
        await self.manager.remove_player(self.blue)
        deadline = self.room.deadlines['blue']
        await self.manager.remove_player(self.blue)
        self.assertEqual(self.room.deadlines['blue'], deadline)

    async def test_one_returns_but_game_waits_for_other(self):
        await self.manager.remove_player(self.blue)
        await self.manager.remove_player(self.red)
        returned = Socket()
        await self.manager.resume(returned, self.room.code, self.room.tokens['blue'])
        self.assertTrue(returned.messages[-1]['paused'])
        self.assertEqual(set(self.room.deadlines), {'red'})
        self.room.deadlines['red'] = time.monotonic() - 1
        await self.manager.expire(self.room)
        self.assertEqual(self.room.game.winner, 'blue')

    async def test_successful_resume_cancels_timeout(self):
        self.manager.reconnect_seconds = 0.03
        await self.manager.remove_player(self.blue)
        await self.manager.resume(Socket(), self.room.code, self.room.tokens['blue'])
        await asyncio.sleep(0.06)
        self.assertIsNone(self.room.ended_reason)
        self.assertFalse(self.room.timers)

    async def test_timer_awards_win_without_new_messages(self):
        self.manager.reconnect_seconds = 0.02
        await self.manager.remove_player(self.blue)
        await asyncio.sleep(0.06)
        self.assertEqual(self.room.game.winner, 'red')
        self.assertEqual(self.red.messages[-1]['endedReason'], 'reconnect_timeout')

    async def test_resumed_player_can_play_and_new_disconnect_gets_timer(self):
        self.room.game.current_player = 'blue'
        await self.manager.remove_player(self.blue)
        socket = Socket()
        await self.manager.resume(socket, self.room.code, self.room.tokens['blue'])
        await self.manager.make_move(socket, 0, 0, 'right')
        self.assertEqual(self.room.game.board[0][1]['id'], 'blue-1')
        await self.manager.remove_player(socket)
        self.assertIn('blue', self.room.deadlines)


class WebSocketReconnectTests(unittest.TestCase):
    def test_two_clients_resume_and_reject_paused_move(self):
        with TestClient(app) as client:
            with client.websocket_connect('/ws') as red:
                red.receive_json()
                with client.websocket_connect('/ws') as blue:
                    blue.receive_json()
                    blue.send_json({'type': 'create_room', 'nickname': 'Blue', 'avatarId': 'turtle'})
                    created = blue.receive_json()
                    red.send_json({'type': 'join_room', 'roomCode': created['roomCode'],
                                   'nickname': 'Red', 'avatarId': 'robot'})
                    blue.receive_json()
                    initial = red.receive_json()
                paused = red.receive_json()
                self.assertTrue(paused['paused'])
                red.send_json({'type': 'move', 'row': 0, 'column': 2, 'direction': 'down'})
                self.assertEqual(red.receive_json()['type'], 'error')
                red.send_json({'type': 'ping'})
                self.assertEqual(red.receive_json()['type'], 'pong')
                with client.websocket_connect('/ws') as blue2:
                    blue2.receive_json()
                    blue2.send_json({'type': 'resume_session', 'roomCode': created['roomCode'],
                                     'sessionToken': created['sessionToken']})
                    resumed = blue2.receive_json()
                    self.assertEqual(resumed['type'], 'session_resumed')
                    self.assertEqual(resumed['board'], initial['board'])
                    self.assertEqual(resumed['currentPlayer'], initial['currentPlayer'])
                    self.assertFalse(red.receive_json()['paused'])
                    blue2.receive_json()
                    blue2.send_json({'type': 'leave_room'})
                    self.assertEqual(blue2.receive_json()['type'], 'room_left')
                    final = red.receive_json()
                    self.assertEqual(final['winner'], 'red')
                    red.send_json({'type': 'leave_room'})
                    self.assertEqual(red.receive_json()['type'], 'room_left')
            self.assertFalse(room_manager.rooms)
