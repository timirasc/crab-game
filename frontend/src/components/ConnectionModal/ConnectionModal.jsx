import { useEffect, useRef, useState } from 'react'
import './ConnectionModal.css'

export default function ConnectionModal({ offline, deadline, result, onExit }) {
  const dialogRef = useRef(null)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => { clearInterval(timer); dialog.close() }
  }, [])

  const seconds = deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000))
  return (
    <dialog ref={dialogRef} className="connection-modal" onCancel={(event) => event.preventDefault()}
      aria-labelledby="connection-title" aria-describedby="connection-description">
      <h2 id="connection-title">{result?.title || (offline ? 'Соединение потеряно' : 'Соперник потерял соединение')}</h2>
      <p id="connection-description">
        {result?.description || (offline
          ? 'Переподключаемся автоматически. Матч приостановлен.'
          : seconds === 0 ? 'Ожидаем решения сервера…' : 'Ожидаем переподключения соперника.')}
      </p>
      {!result && !offline && seconds !== null && (
        <p className="connection-modal__timer" aria-label={`Осталось ${seconds} секунд`}>{seconds} сек.</p>
      )}
      {!result && offline && <p>Сервер даёт 60 секунд с момента обнаружения обрыва.</p>}
      {result && <button type="button" onClick={onExit}>В главное меню</button>}
    </dialog>
  )
}
