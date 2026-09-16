import { getAvatar } from '../../data/avatars'

function Avatar({
  avatarId,
  className = '',
}) {
  const avatar = getAvatar(avatarId)

  if (!avatar) return null

  return (
    <img
      className={`avatar ${className}`}
      src={avatar.src}
      alt={avatar.label}
      draggable="false"
    />
  )
}

export default Avatar