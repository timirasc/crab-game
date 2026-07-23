import { useState } from 'react'

import Avatar from '../Avatar/Avatar'
import {
  AVATARS,
  DEFAULT_AVATAR_ID,
} from '../../data/avatars'


const MIN_NICKNAME_LENGTH = 2
const MAX_NICKNAME_LENGTH = 15

function NicknameForm({ onSubmit }) {
  const [nickname, setNickname] = useState('')
  const [selectedAvatarId, setSelectedAvatarId] =
    useState(DEFAULT_AVATAR_ID)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedNickname = nickname.trim()

    if (
      normalizedNickname.length <
      MIN_NICKNAME_LENGTH
    ) {
      setError(
        'Никнейм должен содержать минимум 2 символа',
      )
      return
    }

    if (
      normalizedNickname.length >
      MAX_NICKNAME_LENGTH
    ) {
      setError(
        'Никнейм должен содержать максимум 20 символов',
      )
      return
    }

    onSubmit({
      nickname: normalizedNickname,
      avatarId: selectedAvatarId,
    })
  }

  return (
    <section className="nickname-form">
      <h2>
        Для начала игры введите ник и выберите аватар
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="profile-preview">
          <Avatar
            avatarId={selectedAvatarId}
            className="profile-preview__avatar"
          />
        <div className='profile-input-wrapper'>
            <input
                type="text"
                value={nickname}
                minLength={MIN_NICKNAME_LENGTH}
                maxLength={MAX_NICKNAME_LENGTH}
                placeholder="Введите ник"
                aria-label="Ваш никнейм"
                autoFocus
                onChange={(event) => {
                setNickname(event.target.value)
                setError('')
                }}
            />
            <img className='profile-divider-line' src="../../public/images/line-profile.png" alt="divider-line" />
        </div>
          
        </div>

        <div
          className="avatar-options"
          role="group"
          aria-label="Выберите аватар"
        >
          {AVATARS.map((avatar) => {
            const isSelected =
              avatar.id === selectedAvatarId

            return (
              <button
                className={`avatar-option ${
                  isSelected
                    ? 'avatar-option--selected'
                    : ''
                }`}
                type="button"
                key={avatar.id}
                aria-label={avatar.label}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelectedAvatarId(avatar.id)
                }
              >
                <Avatar avatarId={avatar.id} />
              </button>
            )
          })}
        </div>

        {error && (
          <p className="nickname-form__error">
            {error}
          </p>
        )}

        <button
          className="nickname-form__submit"
          type="submit"
        >
          Продолжить
        </button>
      </form>
    </section>
  )
}

export default NicknameForm