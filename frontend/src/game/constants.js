export const BOARD_SIZE = 6

export const INITIAL_BOARD = [
  [
    {
      id: 'blue-1',
      color: 'blue',
    },
    null,
    {
      id: 'red-1',
      color: 'red',
    },
    {
      id: 'blue-2',
      color: 'blue',
    },
    null,
    {
      id: 'red-2',
      color: 'red',
    },
  ],
  [
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  [
    {
      id: 'red-3',
      color: 'red',
    },
    null,
    null,
    null,
    null,
    {
      id: 'blue-3',
      color: 'blue',
    },
  ],
  [
    {
      id: 'blue-4',
      color: 'blue',
    },
    null,
    null,
    null,
    null,
    {
      id: 'red-4',
      color: 'red',
    },
  ],
  [
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  [
    {
      id: 'red-5',
      color: 'red',
    },
    null,
    {
      id: 'blue-5',
      color: 'blue',
    },
    {
      id: 'red-6',
      color: 'red',
    },
    null,
    {
      id: 'blue-6',
      color: 'blue',
    },
  ],
]

export const DIRECTIONS = [
  {
    name: 'up',
    rowStep: -1,
    columnStep: 0,
  },
  {
    name: 'right',
    rowStep: 0,
    columnStep: 1,
  },
  {
    name: 'down',
    rowStep: 1,
    columnStep: 0,
  },
  {
    name: 'left',
    rowStep: 0,
    columnStep: -1,
  },
]