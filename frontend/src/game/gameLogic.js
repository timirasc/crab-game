import {
  BOARD_SIZE,
  DIRECTIONS,
} from './constants'

function isInsideBoard(row, column) {
  return (
    row >= 0 &&
    row < BOARD_SIZE &&
    column >= 0 &&
    column < BOARD_SIZE
  )
}

export function getAvailableMoves(
  board,
  startRow,
  startColumn,
) {
  return DIRECTIONS
    .map((direction) => {
      let row = startRow + direction.rowStep
      let column = startColumn + direction.columnStep
      let target = null

      while (
        isInsideBoard(row, column) &&
        board[row][column] === null
      ) {
        target = { row, column }
        row += direction.rowStep
        column += direction.columnStep
      }

      if (!target) return null

      return {
        ...direction,
        target,
      }
    })
    .filter((move) => move !== null)
}

export function hasAnyAvailableMove(board, color) {
  return board.some((row, rowIndex) =>
    row.some(
      (cell, columnIndex) =>
        cell === color &&
        getAvailableMoves(board, rowIndex, columnIndex).length > 0,
    ),
  )
}

export function hasWinningLine(board, color) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let consecutiveCrabs = 0

    for (
      let column = 0;
      column < BOARD_SIZE;
      column += 1
    ) {
      if (board[row][column] === color) {
        consecutiveCrabs += 1

        if (consecutiveCrabs >= 4) return true
      } else {
        consecutiveCrabs = 0
      }
    }
  }

  for (
    let column = 0;
    column < BOARD_SIZE;
    column += 1
  ) {
    let consecutiveCrabs = 0

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (board[row][column] === color) {
        consecutiveCrabs += 1

        if (consecutiveCrabs >= 4) return true
      } else {
        consecutiveCrabs = 0
      }
    }
  }

  return false
}

export function getRandomPlayer() {
  return Math.random() < 0.5 ? 'blue' : 'red'
}