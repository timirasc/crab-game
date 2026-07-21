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