export const AVATARS = [
  {
    id: 'turtle',
    label: 'Черепаха',
    src: '/images/avatars/turtle/portrait.png',
  },
  {
    id: 'mermaid',
    label: 'Русалка',
    src: '/images/avatars/mermaid/portrait.png',
  },
  {
    id: 'shark',
    label: 'Акула',
    src: '/images/avatars/shark/portrait.png',
  },
  {
    id: 'octopus',
    label: 'Осьминог',
    src: '/images/avatars/octopus/portrait.png',
  },
  {
    id: 'seagull',
    label: 'Чайка',
    src: '/images/avatars/seagull/portrait.png',
  },
  {
    id: 'robot',
    label: 'Робот',
    src: '/images/avatars/robot/portrait.png',
  },
]

export const DEFAULT_AVATAR_ID = AVATARS[0].id

export function isValidAvatarId(avatarId) {
  return AVATARS.some((avatar) => avatar.id === avatarId)
}

export function getAvatar(avatarId) {
  return AVATARS.find((avatar) => avatar.id === avatarId)
}