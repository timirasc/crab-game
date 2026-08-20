import { useState } from 'react'

function Lobby({
  connectionStatus,
  gamePhase,
  roomCode,
  errorMessage,
  onCreateRoom,
  onJoinRoom,
  setGamePhase,
  setErrorMessage,
  onLeaveRoom,
  isLeavingRoom
}) {
  const [roomCodeInput, setRoomCodeInput] = useState('')

  const isConnected = connectionStatus === 'connected'

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedCode = roomCodeInput.trim().toUpperCase()

    if (normalizedCode) {
      onJoinRoom(normalizedCode)
    }
  }

  if (gamePhase === 'waiting') {
    return (
      <section className="lobby">
        <h2>Ожидаем соперника</h2>
        <p>Код комнаты:</p>
        <strong className="room-code">{roomCode}</strong>
        <p>Нажмите на код для копирования. Передайте его второму игроку</p>
        <button
          className="back-to-menu"
          type="button"
          disabled={isLeavingRoom}
          onClick={onLeaveRoom}
        >
          {isLeavingRoom
            ? 'Выход...'
            : 'В меню'}
        </button>
      </section>
      
    )
  }

  return (
    <section className="lobby">
      <button
        className="lobby-button create-room"
        type="button"
        disabled={!isConnected}
        onClick={onCreateRoom}
      >
        Создать комнату
      </button>

      <span>или</span>

      <form className="join-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={roomCodeInput}
          maxLength={6}
          placeholder="Код комнаты"
          aria-label="Код комнаты"
          spellCheck="false"
          onChange={(event) =>
            setRoomCodeInput(event.target.value.toUpperCase())
          }
        />

        <button
          className="lobby-button"
          type="submit"
          disabled={!isConnected || !roomCodeInput.trim()}
        >
          .
        </button>

        
      </form>
      {errorMessage && (
        <p className="lobby-error">{errorMessage}</p>
      )}
      <button
        className="back-to-menu"
        type="button"
        onClick={() => {
          setErrorMessage('')
          setGamePhase('menu')
        }}
      >
        Назад
      </button>

    </section>
  )
}

export default Lobby