import unittest

from app.room_manager import RoomManager


class FakeWebSocket:
    def __init__(self):
        self.messages = []

    async def send_json(self, message):
        self.messages.append(message)


class RoomManagerTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.manager = RoomManager()
        self.blue_socket = FakeWebSocket()
        self.red_socket = FakeWebSocket()

    def test_create_room_adds_room(self):
        room = self.manager.create_room(
            self.blue_socket,
            'Blue',
            'turtle',
        )

        self.assertEqual(len(room.code), 6)
        self.assertIn(room.code, self.manager.rooms)
        self.assertIs(room.blue_player, self.blue_socket)
        self.assertEqual(room.blue_nickname, 'Blue')
        self.assertEqual(room.blue_avatar_id, 'turtle')
        self.assertIsNone(room.red_player)

    def test_join_room_adds_red_player(self):
        room = self.manager.create_room(
            self.blue_socket,
            'Blue',
            'turtle',
        )

        joined_room = self.manager.join_room(
            f'  {room.code.lower()}  ',
            self.red_socket,
            'Red',
            'robot',
        )

        self.assertIs(joined_room, room)
        self.assertIs(room.red_player, self.red_socket)
        self.assertEqual(room.red_nickname, 'Red')
        self.assertEqual(room.red_avatar_id, 'robot')

    def test_cannot_join_full_room(self):
        room = self.manager.create_room(
            self.blue_socket,
            'Blue',
            'turtle',
        )

        self.manager.join_room(
            room.code,
            self.red_socket,
            'Red',
            'robot',
        )

        third_socket = FakeWebSocket()

        with self.assertRaisesRegex(
            ValueError,
            'Комната уже заполнена',
        ):
            self.manager.join_room(
                room.code,
                third_socket,
                'Third',
                'shark',
            )

    def test_find_player_returns_room_and_color(self):
        room = self.manager.create_room(
            self.blue_socket,
            'Blue',
            'turtle',
        )

        self.manager.join_room(
            room.code,
            self.red_socket,
            'Red',
            'robot',
        )

        blue_result = self.manager.find_player(
            self.blue_socket,
        )
        red_result = self.manager.find_player(
            self.red_socket,
        )

        self.assertEqual(blue_result, (room, 'blue'))
        self.assertEqual(red_result, (room, 'red'))

    async def test_leave_room_removes_room_and_notifies_opponent(
        self,
    ):
        room = self.manager.create_room(
            self.blue_socket,
            'Blue',
            'turtle',
        )

        self.manager.join_room(
            room.code,
            self.red_socket,
            'Red',
            'robot',
        )

        was_removed = await self.manager.leave_room(
            self.blue_socket,
        )

        self.assertTrue(was_removed)
        self.assertNotIn(room.code, self.manager.rooms)
        self.assertEqual(
            self.red_socket.messages,
            [{'type': 'opponent_left'}],
        )

    async def test_unknown_player_cannot_leave_room(self):
        unknown_socket = FakeWebSocket()

        was_removed = await self.manager.leave_room(
            unknown_socket,
        )

        self.assertFalse(was_removed)
        self.assertEqual(self.manager.rooms, {})


if __name__ == '__main__':
    unittest.main()