import { useState } from 'react'
import './App.css'
import { INITIAL_BOARD } from './game/constants'
import {
  getAvailableMoves,
  getRandomPlayer,
  hasAnyAvailableMove,
  hasWinningLine,
} from './game/gameLogic'
import Board from './components/Board/Board'

function App() {
  const [board, setBoard] = useState(INITIAL_BOARD)
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
    setBoard(INITIAL_BOARD)
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

      <Board
        board={board}
        currentPlayer={currentPlayer}
        selectedCrab={selectedCrab}
        availableMoves={availableMoves}
        isGameOver={winner !== null || isDraw}
        onCrabClick={handleCrabClick}
        onMove={handleMove}
      />
    </main>
  )
}

export default App