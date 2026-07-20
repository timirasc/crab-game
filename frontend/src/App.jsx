import { useState } from 'react'
import './App.css'

const initialBoard = [
  ['blue', null, 'red', 'blue', null, 'red'],
  [null, null, null, null, null, null],
  ['red', null, null, null, null, 'blue'],
  ['blue', null, null, null, null, 'red'],
  [null, null, null, null, null, null],
  ['red', null, 'blue', 'red', null, 'blue'],
]

const directions = [
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

function isInsideBoard(row, column) {
  return row >= 0 && row < 6 && column >= 0 && column < 6
}

function getAvailableMoves(board, startRow, startColumn) {
  return directions
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

function hasWinningLine(board, color) {
  for (let row = 0; row < 6; row += 1) {
    let consecutiveCrabs = 0

    for (let column = 0; column < 6; column += 1) {
      if (board[row][column] === color) {
        consecutiveCrabs += 1

        if (consecutiveCrabs >= 4) return true
      } else {
        consecutiveCrabs = 0
      }
    }
  }

  for (let column = 0; column < 6; column += 1) {
    let consecutiveCrabs = 0

    for (let row = 0; row < 6; row += 1) {
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

function getRandomPlayer() {
  return Math.random() < 0.5 ? 'blue' : 'red'
}

function hasAnyAvailableMove(board, color) {
  return board.some((row, rowIndex) =>
    row.some(
      (cell, columnIndex) =>
        cell === color &&
        getAvailableMoves(board, rowIndex, columnIndex).length > 0,
    ),
  )
}

function App() {
  const [board, setBoard] = useState(initialBoard)
  const [selectedCrab, setSelectedCrab] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(getRandomPlayer)
  const [winner, setWinner] = useState(null)
  const [skippedPlayer, setSkippedPlayer] = useState(null)
  const [consecutiveMoves, setConsecutiveMoves] = useState({
    player: null,
    count: 0,
  })
  const [isDraw, setIsDraw] = useState(false)

  const availableMoves = selectedCrab
  ? getAvailableMoves(
      board,
      selectedCrab.row,
      selectedCrab.column,
    )
  : []

  function handleCrabClick(rowIndex, columnIndex, color) {
    if (winner || isDraw || color !== currentPlayer) return
    if (winner || color !== currentPlayer) return
    if (color !== currentPlayer) return

    const isAlreadySelected =
      selectedCrab?.row === rowIndex &&
      selectedCrab?.column === columnIndex

    if (isAlreadySelected) {
      setSelectedCrab(null)
      return
    }

    setSelectedCrab({
      row: rowIndex,
      column: columnIndex,
    })
  }
  function handleMove(move) {
    if (!selectedCrab) return

    const movingCrab =
      board[selectedCrab.row][selectedCrab.column]

    const nextBoard = board.map((row) => [...row])

    nextBoard[selectedCrab.row][selectedCrab.column] = null
    nextBoard[move.target.row][move.target.column] = movingCrab

    setBoard(nextBoard)
    setSelectedCrab(null)

    if (hasWinningLine(nextBoard, movingCrab)) {
      setWinner(movingCrab)
      setSkippedPlayer(null)
      return
    }

    const nextConsecutiveMoves = {
      player: movingCrab,
      count:
        consecutiveMoves.player === movingCrab
          ? consecutiveMoves.count + 1
          : 1,
    }

    setConsecutiveMoves(nextConsecutiveMoves)

    if (nextConsecutiveMoves.count >= 5) {
      setIsDraw(true)
      setSkippedPlayer(null)
      return
    }

    const nextPlayer = movingCrab === 'blue' ? 'red' : 'blue'

    if (hasAnyAvailableMove(nextBoard, nextPlayer)) {
      setCurrentPlayer(nextPlayer)
      setSkippedPlayer(null)
    } else {
      setCurrentPlayer(movingCrab)
      setSkippedPlayer(nextPlayer)
    }
  }

  function handleRestart() {
    setBoard(initialBoard)
    setSelectedCrab(null)
    setWinner(null)
    setCurrentPlayer(getRandomPlayer())
    setSkippedPlayer(null)
    setConsecutiveMoves({
      player: null,
      count: 0,
    })
    setIsDraw(false)
  }

  return (
    <main className="game">
      <h1>Crab Game</h1>
      <p className="current-player">
        {winner
          ? `Победили ${winner === 'blue' ? 'синие' : 'красные'}!`
          : isDraw
            ? 'Ничья!'
            : `Ход: ${
                currentPlayer === 'blue' ? 'синих' : 'красных'
              }`}
      </p>
      {skippedPlayer && !winner && (
        <p className="skip-message">
          {skippedPlayer === 'blue' ? 'Синие' : 'Красные'} не могут
          сделать ход и пропускают его
        </p>
      )}
      <button
        className="restart-button"
        type="button"
        onClick={handleRestart}
      >
        Начать заново
      </button>

      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const isSelected =
              selectedCrab?.row === rowIndex &&
              selectedCrab?.column === columnIndex

            return (
              <div className="cell" key={`${rowIndex}-${columnIndex}`}>
                {cell && (
                  <button
                    className={`crab crab--${cell} ${
                      isSelected ? 'crab--selected' : ''
                    }`}
                    type="button"
                    disabled={
                      winner !== null ||
                      isDraw ||
                      cell !== currentPlayer
                    }
                    aria-label={`${cell} crab`}
                    onClick={() =>
                      handleCrabClick(rowIndex, columnIndex, cell)
                    }
                  />
                )}

                {isSelected &&
                  availableMoves.map((move) => (
                    <button
                      className={`move-arrow move-arrow--${move.name}`}
                      type="button"
                      key={move.name}
                      aria-label={`Move ${move.name}`}
                      onClick={() => handleMove(move)}
                      disabled={winner !== null || cell !== currentPlayer}
                    >
                      {move.symbol}
                    </button>
                  ))}
              </div>
            )
          }),
        )}
      </div>
    </main>
  )
}

export default App