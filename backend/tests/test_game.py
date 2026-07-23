import unittest

from app.game import (
    Game,
    create_crab,
    create_initial_board,
    get_move_target,
    has_winning_line,
)


def create_empty_board():
    return [
        [None, None, None, None, None, None]
        for _ in range(6)
    ]


class MoveTargetTests(unittest.TestCase):
    def test_crab_stops_before_another_crab(self):
        board = create_initial_board()

        target = get_move_target(
            board,
            start_row=0,
            start_column=0,
            direction='right',
        )

        self.assertEqual(target, (0, 1))

    def test_crab_cannot_move_outside_board(self):
        board = create_initial_board()

        target = get_move_target(
            board,
            start_row=0,
            start_column=0,
            direction='up',
        )

        self.assertIsNone(target)

    def test_unknown_direction_is_not_available(self):
        board = create_initial_board()

        target = get_move_target(
            board,
            start_row=0,
            start_column=0,
            direction='diagonal',
        )

        self.assertIsNone(target)


class WinningLineTests(unittest.TestCase):
    def test_four_horizontal_crabs_win(self):
        board = create_empty_board()

        board[0][0] = create_crab('blue-1', 'blue')
        board[0][1] = create_crab('blue-2', 'blue')
        board[0][2] = create_crab('blue-3', 'blue')
        board[0][3] = create_crab('blue-4', 'blue')

        self.assertTrue(
            has_winning_line(board, 'blue')
        )

    def test_five_vertical_crabs_win(self):
        board = create_empty_board()

        for row in range(5):
            board[row][0] = create_crab(
                f'red-{row + 1}',
                'red',
            )

        self.assertTrue(
            has_winning_line(board, 'red')
        )

    def test_interrupted_line_does_not_win(self):
        board = create_empty_board()

        board[0][0] = create_crab('blue-1', 'blue')
        board[0][1] = create_crab('blue-2', 'blue')
        board[0][3] = create_crab('blue-3', 'blue')
        board[0][4] = create_crab('blue-4', 'blue')

        self.assertFalse(
            has_winning_line(board, 'blue')
        )


class GameTests(unittest.TestCase):
    def test_move_updates_board_and_changes_player(self):
        game = Game()
        game.current_player = 'blue'

        game.make_move(
            player_color='blue',
            row=0,
            column=0,
            direction='down',
        )

        moved_crab = game.board[1][0]

        self.assertIsNone(game.board[0][0])
        self.assertIsNotNone(moved_crab)
        self.assertEqual(moved_crab['id'], 'blue-1')
        self.assertEqual(moved_crab['color'], 'blue')
        self.assertEqual(game.current_player, 'red')

    def test_player_cannot_move_during_opponent_turn(self):
        game = Game()
        game.current_player = 'red'

        with self.assertRaisesRegex(
            ValueError,
            'Сейчас ход другого игрока',
        ):
            game.make_move(
                player_color='blue',
                row=0,
                column=0,
                direction='right',
            )

    def test_winning_move_sets_winner(self):
        board = create_empty_board()

        board[0][0] = create_crab('blue-1', 'blue')
        board[0][1] = create_crab('blue-2', 'blue')
        board[0][2] = create_crab('blue-3', 'blue')
        board[1][3] = create_crab('blue-4', 'blue')

        game = Game(
            board=board,
            current_player='blue',
        )

        game.make_move(
            player_color='blue',
            row=1,
            column=3,
            direction='up',
        )

        self.assertEqual(game.winner, 'blue')
        self.assertEqual(
            game.board[0][3]['id'],
            'blue-4',
        )

    def test_fifth_consecutive_move_causes_draw(self):
        game = Game(
            current_player='blue',
            consecutive_player='blue',
            consecutive_moves=4,
        )

        game.make_move(
            player_color='blue',
            row=0,
            column=0,
            direction='down',
        )

        self.assertTrue(game.is_draw)

    def test_crab_keeps_id_after_move(self):
        game = Game()
        game.current_player = 'blue'

        original_crab = game.board[0][0]

        game.make_move(
            player_color='blue',
            row=0,
            column=0,
            direction='down',
        )

        moved_crab = game.board[1][0]

        self.assertIs(moved_crab, original_crab)
        self.assertEqual(moved_crab['id'], 'blue-1')


if __name__ == '__main__':
    unittest.main()