import unittest

from app.game import (
    Game,
    create_initial_board,
    get_move_target,
    has_winning_line,
)


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
        board = [
            ['blue', 'blue', 'blue', 'blue', None, None],
            [None, None, None, None, None, None],
            [None, None, None, None, None, None],
            [None, None, None, None, None, None],
            [None, None, None, None, None, None],
            [None, None, None, None, None, None],
        ]

        self.assertTrue(has_winning_line(board, 'blue'))

    def test_five_vertical_crabs_win(self):
        board = [
            ['red', None, None, None, None, None],
            ['red', None, None, None, None, None],
            ['red', None, None, None, None, None],
            ['red', None, None, None, None, None],
            ['red', None, None, None, None, None],
            [None, None, None, None, None, None],
        ]

        self.assertTrue(has_winning_line(board, 'red'))

    def test_interrupted_line_does_not_win(self):
        board = [
            ['blue', 'blue', None, 'blue', 'blue', None],
            [None, None, None, None, None, None],
            [None, None, None, None, None, None],
            [None, None, None, None, None, None],
            [None, None, None, None, None, None],
            [None, None, None, None, None, None],
        ]

        self.assertFalse(has_winning_line(board, 'blue'))


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

        self.assertIsNone(game.board[0][0])
        self.assertEqual(game.board[1][0], 'blue')
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
        game = Game(
            board=[
                ['blue', 'blue', 'blue', None, None, None],
                [None, None, None, 'blue', None, None],
                [None, None, None, None, None, None],
                [None, None, None, None, None, None],
                [None, None, None, None, None, None],
                [None, None, None, None, None, None],
            ],
            current_player='blue',
        )

        game.make_move(
            player_color='blue',
            row=1,
            column=3,
            direction='up',
        )

        self.assertEqual(game.winner, 'blue')

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


if __name__ == '__main__':
    unittest.main()