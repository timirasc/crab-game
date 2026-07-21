import {
  useCallback,
  useState,
} from 'react'
import './App.css'
import { INITIAL_BOARD } from './game/constants'
import { getAvailableMoves } from './game/gameLogic'
import Board from './components/Board/Board'
import { useGameSocket } from './hooks/useGameSocket'
import Lobby from './components/Lobby/Lobby'



const connectionLabels = {
  connecting: 'Подключение…',
  connected: 'Подключено',
  disconnected: 'Соединение закрыто',
  error: 'Ошибка соединения',
}

function App() {
  const [board, setBoard] = useState(INITIAL_BOARD)
  const [selectedCrab, setSelectedCrab] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [winner, setWinner] = useState(null)
  const [skippedPlayer, setSkippedPlayer] = useState(null)
  const [isDraw, setIsDraw] = useState(false)
  const [gamePhase, setGamePhase] = useState('lobby')
  const [roomCode, setRoomCode] = useState('')
  const [playerColor, setPlayerColor] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isMovePending, setIsMovePending] = useState(false)
  


  const handleServerMessage = useCallback((message) => {
    if (message.type === 'room_created') {
      setRoomCode(message.roomCode)
      setPlayerColor(message.color)
      setGamePhase('waiting')
      setErrorMessage('')
    }

    if (message.type === 'game_started') {
      setRoomCode(message.roomCode)
      setPlayerColor(message.color)
      setBoard(message.board)
      setCurrentPlayer(message.currentPlayer)
      setWinner(message.winner)
      setIsDraw(message.isDraw)
      setSkippedPlayer(null)
      setSelectedCrab(null)
      setIsMovePending(false)
      setGamePhase('playing')
      setErrorMessage('')
    }

    if (message.type === 'game_state') {
      setBoard(message.board)
      setCurrentPlayer(message.currentPlayer)
      setWinner(message.winner)
      setIsDraw(message.isDraw)
      setSkippedPlayer(message.skippedPlayer)
      setSelectedCrab(null)
      setIsMovePending(false)
      setErrorMessage('')
    }

    if (message.type === 'error') {
      setErrorMessage(message.message)
      setIsMovePending(false)
    }

    if (message.type === 'opponent_disconnected') {
      setGamePhase('lobby')
      setRoomCode('')
      setPlayerColor(null)
      setSelectedCrab(null)
      setIsMovePending(false)
      setErrorMessage('Соперник отключился')
    }
  }, [])

  const {
    connectionStatus,
    sendMessage,
  } = useGameSocket(handleServerMessage)


  const availableMoves = selectedCrab
  ? getAvailableMoves(
      board,
      selectedCrab.row,
      selectedCrab.column,
    )
  : []

  function handleCreateRoom() {
    setErrorMessage('')

    const wasSent = sendMessage({
      type: 'create_room',
    })

    if (!wasSent) {
      setErrorMessage('Нет соединения с сервером')
    }
  }

  function handleJoinRoom(code) {
    setErrorMessage('')

    const wasSent = sendMessage({
      type: 'join_room',
      roomCode: code,
    })

    if (!wasSent) {
      setErrorMessage('Нет соединения с сервером')
    }
  }

  function handleCrabClick(rowIndex, columnIndex, color) {
    if (
      winner ||
      isDraw ||
      isMovePending ||
      playerColor !== currentPlayer ||
      color !== playerColor
    ) {
      return
    }

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
  if (!selectedCrab || isMovePending) return

  const wasSent = sendMessage({
    type: 'move',
    row: selectedCrab.row,
    column: selectedCrab.column,
    direction: move.name,
  })

  if (wasSent) {
    setIsMovePending(true)
    setErrorMessage('')
  } else {
    setErrorMessage('Нет соединения с сервером')
  }
}




  if (gamePhase !== 'playing') {
    return (
      <main className="game">
        <h1>Crab Game</h1>

        <p className={`connection connection--${connectionStatus}`}>
          {connectionLabels[connectionStatus]}
        </p>

        <Lobby
          connectionStatus={connectionStatus}
          gamePhase={gamePhase}
          roomCode={roomCode}
          errorMessage={errorMessage}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      </main>
    )
  }

  return (
    <main className="game">
      <h1>Crab Game</h1>
      <p>
        Ваш цвет: {playerColor === 'blue' ? 'синий' : 'красный'}
      </p>
      <p className={`connection connection--${connectionStatus}`}>
        {connectionLabels[connectionStatus]}
      </p>
      <p className="current-player">
        {winner
          ? `Победили ${winner === 'blue' ? 'синие' : 'красные'}!`
          : isDraw
            ? 'Ничья!'
            : `Ход: ${
                currentPlayer === 'blue' ? 'синих' : 'красных'
              }`}
      </p>
      {errorMessage && (
        <p className="lobby-error">{errorMessage}</p>
      )}
      {skippedPlayer && !winner && (
        <p className="skip-message">
          {skippedPlayer === 'blue' ? 'Синие' : 'Красные'} не могут
          сделать ход и пропускают его
        </p>
      )}
      

      <Board
        board={board}
        currentPlayer={currentPlayer}
        selectedCrab={selectedCrab}
        availableMoves={availableMoves}
        isGameOver={
          winner !== null ||
          isDraw ||
          isMovePending ||
          playerColor !== currentPlayer
        }
        onCrabClick={handleCrabClick}
        onMove={handleMove}
      />
    </main>
  )
}

export default App