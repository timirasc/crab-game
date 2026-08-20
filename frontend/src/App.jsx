import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import './App.css'
import { INITIAL_BOARD } from './game/constants'
import { getAvailableMoves } from './game/gameLogic'
import Board from './components/Board/Board'
import { useGameSocket } from './hooks/useGameSocket'
import Lobby from './components/Lobby/Lobby'
import NicknameForm from './components/NicknameForm/NicknameForm'
import { isValidAvatarId } from './data/avatars'
import Avatar from './components/Avatar/Avatar'
import MainMenu from './components/MainMenu/MainMenu'
import { getAvatar } from './data/avatars'



const PROFILE_STORAGE_KEY = 'crab-game-profile'

function getStoredProfile() {
  try {
    const savedProfile = localStorage.getItem(
      PROFILE_STORAGE_KEY,
    )

    if (!savedProfile) return null

    const profile = JSON.parse(savedProfile)
    const nickname = profile?.nickname?.trim()
    const avatarId = profile?.avatarId

    if (
      typeof nickname !== 'string' ||
      nickname.length < 2 ||
      nickname.length > 10 ||
      !isValidAvatarId(avatarId)
    ) {
      return null
    }

    return {
      nickname,
      avatarId,
    }
  } catch {
    return null
  }
}

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
  const [gamePhase, setGamePhase] = useState('menu')
  const [roomCode, setRoomCode] = useState('')
  const [playerColor, setPlayerColor] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isMovePending, setIsMovePending] = useState(false)
  const [profile, setProfile] = useState(getStoredProfile)
  const [players, setPlayers] = useState({
    blue: null,
    red: null,
  })
  const [isLeavingRoom, setIsLeavingRoom] = useState(false)
  const [notification, setNotification] = useState('')
  const [isLobbyRequestPending, setIsLobbyRequestPending] = useState(false)
  

  useEffect(() => {
    if (!notification) return undefined

    const timeoutId = setTimeout(() => {
      setNotification('')
    }, 3000)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [notification])
  
  const handleServerMessage = useCallback((message) => {
    if (message.type === 'room_left') {
      setGamePhase('menu')
      setRoomCode('')
      setPlayerColor(null)
      setPlayers({
        blue: null,
        red: null,
      })
      setSelectedCrab(null)
      setIsLeavingRoom(false)
      setErrorMessage('')
    }

    if (message.type === 'room_created') {
      setIsLobbyRequestPending(false)
      setRoomCode(message.roomCode)
      setPlayerColor(message.color)
      setGamePhase('waiting')
      setErrorMessage('')
    }

    if (message.type === 'game_started') {
      setIsLobbyRequestPending(false)
      setRoomCode(message.roomCode)
      setPlayerColor(message.color)
      setPlayers(message.players)
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
      setIsLobbyRequestPending(false)
      setErrorMessage(message.message)
      setIsMovePending(false)
      setIsLeavingRoom(false)
    }

    if (
      message.type === 'opponent_left' ||
      message.type === 'opponent_disconnected'
    ) {
      setGamePhase('menu')
      setRoomCode('')
      setPlayerColor(null)
      setPlayers({
        blue: null,
        red: null,
      })
      setSelectedCrab(null)
      setIsMovePending(false)
      setIsLeavingRoom(false)
      setErrorMessage('')
      setNotification('Соперник покинул комнату')
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

  function handleProfileSubmit(newProfile) {
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(newProfile),
    )

    localStorage.removeItem('crab-game-nickname')
    setProfile(newProfile)
  }

  function handleCreateRoom() {
    if (isLobbyRequestPending) return

    setErrorMessage('')

    const wasSent = sendMessage({
      type: 'create_room',
      nickname: profile.nickname,
      avatarId: profile.avatarId,
    })

    if (!wasSent) {
      setErrorMessage('Нет соединения с сервером')
    }
  }

  function handleJoinRoom(code) {
    if (isLobbyRequestPending) return

    setErrorMessage('')

    const wasSent = sendMessage({
      type: 'join_room',
      roomCode: code,
      nickname: profile.nickname,
      avatarId: profile.avatarId,
    })

    if (!wasSent) {
      setErrorMessage('Нет соединения с сервером')
    }
  }

  function handleCrabClick(rowIndex, columnIndex, crab) {
    if (
      winner ||
      isDraw ||
      isMovePending ||
      playerColor !== currentPlayer ||
      crab.color !== playerColor
    ) {
      return
    }

    const isAlreadySelected =
      selectedCrab?.id === crab.id

    if (isAlreadySelected) {
      setSelectedCrab(null)
      return
    }

    setSelectedCrab({
      id: crab.id,
      row: rowIndex,
      column: columnIndex,
    })
  }

  async function handleCopyRoomCode() {
    if (!roomCode) return

    try {
      await navigator.clipboard.writeText(roomCode)
      setNotification('Код комнаты скопирован')
    } catch {
      setNotification('Не удалось скопировать код комнаты')
    }
  }

  function handleLeaveRoom() {
    if (isLeavingRoom) return

    const wasSent = sendMessage({
      type: 'leave_room',
    })

    if (wasSent) {
      setIsLeavingRoom(true)
      setErrorMessage('')
    } else {
      setErrorMessage('Нет соединения с сервером')
    }
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


  if (!profile) {
    return (
      <main className="game">

        <NicknameForm
          onSubmit={handleProfileSubmit}
        />
      </main>
    )
  }

  if (gamePhase === 'menu') {
  const avatar = getAvatar(profile.avatarId)
  return (
      <main className="game-menu unselectable">
        <div className="menu-side-wrapper">
          <img className='crab-game-logo' src="/images/Crab-game-logo.png" alt="Crab game" />

          <div className="menu-profile-card">
            <img src={avatar.src} alt={avatar.label} className='player__avatar'/>

            <div className="player__nickname">
              <p>{profile.nickname}</p>
              <img className='profile-divider-line' src="/images/ui/line-profile.png" alt="" />
            </div>
          </div>
        </div>

        <MainMenu
          onPvpClick={() => {
            setErrorMessage('')
            setGamePhase('lobby')
          }}
        />

        {notification && (
          <div
            className="notification"
            role="status"
            aria-live="polite"
          >
            {notification}
          </div>
        )}
      </main>
    )
  }

  if (gamePhase !== 'playing') {
    return (
      <main className="game">

        {/* <p className={`connection connection--${connectionStatus}`}>
          {connectionLabels[connectionStatus]}
        </p> */}

        <Lobby
          connectionStatus={connectionStatus}
          gamePhase={gamePhase}
          roomCode={roomCode}
          errorMessage={errorMessage}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          setGamePhase={setGamePhase}
          setErrorMessage={setErrorMessage}
          onLeaveRoom={handleLeaveRoom}
          onCopyRoomCode={handleCopyRoomCode}
          isLeavingRoom={isLeavingRoom}
          notification={notification}
          isLobbyRequestPending={isLobbyRequestPending}
        />
      </main>
    )
  }

  return (
    <main className="game">
      <div className="players">
        <div
          className={`player player--blue ${
            currentPlayer === 'blue' ? 'player--active' : ''
          }`}
        >
          <Avatar
            avatarId={players.blue?.avatarId}
            className="player__avatar"
          />

          <span className="player__nickname">
            {players.blue?.nickname}
          </span>

          {playerColor === 'blue' && (
            <span className="player__you">Вы</span>
          )}
        </div>

        <div
          className={`player player--red ${
            currentPlayer === 'red' ? 'player--active' : ''
          }`}
        >
        <Avatar
          avatarId={players.red?.avatarId}
          className="player__avatar"
        />
        <span className="player__nickname">
          {players.red?.nickname}
        </span>

        {playerColor === 'red' && (
          <span className="player__you">Вы</span>
        )}
      </div>
    </div>
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