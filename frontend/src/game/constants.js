export const BOARD_SIZE = 6

export const INITIAL_BOARD = [
  ['blue', null, 'red', 'blue', null, 'red'],
  [null, null, null, null, null, null],
  ['red', null, null, null, null, 'blue'],
  ['blue', null, null, null, null, 'red'],
  [null, null, null, null, null, null],
  ['red', null, 'blue', 'red', null, 'blue'],
]

export const DIRECTIONS = [
  {
    name: 'up',
    rowStep: -1,
    columnStep: 0,
    symbol: '↑',
  },
  {
    name: 'right',
    rowStep: 0,
    columnStep: 1,
    symbol: '→',
  },
  {
    name: 'down',
    rowStep: 1,
    columnStep: 0,
    symbol: '↓',
  },
  {
    name: 'left',
    rowStep: 0,
    columnStep: -1,
    symbol: '←',
  },
]