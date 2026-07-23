import secrets
from dataclasses import dataclass, field


BOARD_SIZE = 6
WINNING_LINE_LENGTH = 4

Crab = dict[str, str]
Board = list[list[Crab | None]]

DIRECTIONS = {
    'up': (-1, 0),
    'right': (0, 1),
    'down': (1, 0),
    'left': (0, -1),
}


def create_crab(crab_id: str, color: str) -> Crab:
    return {
        'id': crab_id,
        'color': color,
    }


def create_initial_board() -> Board:
    return [
        [
            create_crab('blue-1', 'blue'),
            None,
            create_crab('red-1', 'red'),
            create_crab('blue-2', 'blue'),
            None,
            create_crab('red-2', 'red'),
        ],
        [
            None,
            None,
            None,
            None,
            None,
            None,
        ],
        [
            create_crab('red-3', 'red'),
            None,
            None,
            None,
            None,
            create_crab('blue-3', 'blue'),
        ],
        [
            create_crab('blue-4', 'blue'),
            None,
            None,
            None,
            None,
            create_crab('red-4', 'red'),
        ],
        [
            None,
            None,
            None,
            None,
            None,
            None,
        ],
        [
            create_crab('red-5', 'red'),
            None,
            create_crab('blue-5', 'blue'),
            create_crab('red-6', 'red'),
            None,
            create_crab('blue-6', 'blue'),
        ],
    ]


def is_inside_board(row: int, column: int) -> bool:
    return (
        0 <= row < BOARD_SIZE
        and 0 <= column < BOARD_SIZE
    )


def get_move_target(
    board: Board,
    start_row: int,
    start_column: int,
    direction: str,
) -> tuple[int, int] | None:
    steps = DIRECTIONS.get(direction)

    if steps is None:
        return None

    row_step, column_step = steps
    row = start_row + row_step
    column = start_column + column_step
    target = None

    while (
        is_inside_board(row, column)
        and board[row][column] is None
    ):
        target = (row, column)
        row += row_step
        column += column_step

    return target


def has_winning_line(
    board: Board,
    color: str,
) -> bool:
    for row in range(BOARD_SIZE):
        consecutive_crabs = 0

        for column in range(BOARD_SIZE):
            crab = board[row][column]

            if (
                crab is not None
                and crab['color'] == color
            ):
                consecutive_crabs += 1

                if consecutive_crabs >= WINNING_LINE_LENGTH:
                    return True
            else:
                consecutive_crabs = 0

    for column in range(BOARD_SIZE):
        consecutive_crabs = 0

        for row in range(BOARD_SIZE):
            crab = board[row][column]

            if (
                crab is not None
                and crab['color'] == color
            ):
                consecutive_crabs += 1

                if consecutive_crabs >= WINNING_LINE_LENGTH:
                    return True
            else:
                consecutive_crabs = 0

    return False


def has_any_available_move(
    board: Board,
    color: str,
) -> bool:
    for row in range(BOARD_SIZE):
        for column in range(BOARD_SIZE):
            crab = board[row][column]

            if (
                crab is None
                or crab['color'] != color
            ):
                continue

            for direction in DIRECTIONS:
                target = get_move_target(
                    board,
                    row,
                    column,
                    direction,
                )

                if target is not None:
                    return True

    return False


@dataclass
class Game:
    board: Board = field(
        default_factory=create_initial_board
    )
    current_player: str | None = None
    winner: str | None = None
    is_draw: bool = False
    consecutive_player: str | None = None
    consecutive_moves: int = 0

    def start(self):
        self.current_player = secrets.choice(
            ('blue', 'red')
        )

    def make_move(
        self,
        player_color: str,
        row: int,
        column: int,
        direction: str,
    ) -> str | None:
        if self.current_player is None:
            raise ValueError('Игра ещё не началась')

        if self.winner is not None or self.is_draw:
            raise ValueError('Игра уже завершена')

        if player_color != self.current_player:
            raise ValueError('Сейчас ход другого игрока')

        if not is_inside_board(row, column):
            raise ValueError('Клетка находится вне поля')

        crab = self.board[row][column]

        if (
            crab is None
            or crab['color'] != player_color
        ):
            raise ValueError('Нельзя переместить этого краба')

        target = get_move_target(
            self.board,
            row,
            column,
            direction,
        )

        if target is None:
            raise ValueError(
                'Краб не может идти в эту сторону'
            )

        target_row, target_column = target

        self.board[row][column] = None
        self.board[target_row][target_column] = crab

        if has_winning_line(self.board, player_color):
            self.winner = player_color
            return None

        if self.consecutive_player == player_color:
            self.consecutive_moves += 1
        else:
            self.consecutive_player = player_color
            self.consecutive_moves = 1

        if self.consecutive_moves >= 5:
            self.is_draw = True
            return None

        next_player = (
            'red' if player_color == 'blue' else 'blue'
        )

        if has_any_available_move(
            self.board,
            next_player,
        ):
            self.current_player = next_player
            return None

        self.current_player = player_color
        return next_player

    def to_message(self) -> dict:
        return {
            'board': self.board,
            'currentPlayer': self.current_player,
            'winner': self.winner,
            'isDraw': self.is_draw,
        }