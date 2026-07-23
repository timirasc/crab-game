import { useState } from 'react'

const MIN_NICKNAME_LENGTH = 2
const MAX_NICKNAME_LENGTH = 20

function NicknameForm({ onSubmit }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const nickname = value.trim()

    if (nickname.length < MIN_NICKNAME_LENGTH) {
      setError('Никнейм должен содержать минимум 2 символа')
      return
    }

    if (nickname.length > MAX_NICKNAME_LENGTH) {
      setError('Никнейм должен содержать максимум 20 символов')
      return
    }

    onSubmit(nickname)
  }

  return (
    <section className="nickname-form">
      <h2>Введите никнейм</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          minLength={MIN_NICKNAME_LENGTH}
          maxLength={MAX_NICKNAME_LENGTH}
          placeholder="Ваш никнейм"
          aria-label="Ваш никнейм"
          autoFocus
          onChange={(event) => {
            setValue(event.target.value)
            setError('')
          }}
        />

        <button type="submit">
          Продолжить
        </button>
      </form>

      {error && (
        <p className="nickname-form__error">
          {error}
        </p>
      )}
    </section>
  )
}

export default NicknameForm