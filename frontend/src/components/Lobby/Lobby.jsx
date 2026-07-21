import { useState } from 'react'

function Lobby({
  connectionStatus,
  gamePhase,
  roomCode,
  errorMessage,
  onCreateRoom,
  onJoinRoom,
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
        <p>Передай этот код второму игроку</p>
      </section>
    )
  }

  return (
    <section className="lobby">
      <button
        className="lobby-button"
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
          onChange={(event) =>
            setRoomCodeInput(event.target.value.toUpperCase())
          }
        />

        <button
          className="lobby-button"
          type="submit"
          disabled={!isConnected || !roomCodeInput.trim()}
        >
          Войти
        </button>
      </form>

      {errorMessage && (
        <p className="lobby-error">{errorMessage}</p>
      )}
    </section>
  )
}

export default Lobby