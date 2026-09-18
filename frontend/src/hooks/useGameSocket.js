import { useCallback, useEffect, useRef, useState } from 'react'

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://127.0.0.1:8000/ws'
const SESSION_KEY = 'crab-game-session'

function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY))
    return typeof value?.roomCode === 'string' && typeof value?.sessionToken === 'string'
      ? value : null
  } catch { return null }
}

export function useGameSocket(onMessage) {
  const socketRef = useRef(null)
  const sessionRef = useRef(readSession())
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  const forgetSession = useCallback(() => {
    sessionRef.current = null
    try { sessionStorage.removeItem(SESSION_KEY) } catch { /* memory fallback */ }
  }, [])

  useEffect(() => {
    let active = true
    let retryTimer
    let heartbeat
    let openTimer
    let attempt = 0

    function connect() {
      if (!active) return
      const socket = new WebSocket(WEBSOCKET_URL)
      socketRef.current = socket
      let retired = false
      let lastReceived = Date.now()
      let resumeStarted = null
      const isCurrent = () => active && !retired && socketRef.current === socket

      function disconnected() {
        if (!isCurrent()) return
        retired = true
        clearInterval(heartbeat)
        clearTimeout(openTimer)
        setConnectionStatus('disconnected')
        onMessage({ type: 'connection_lost' })
        socket.close()
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempt++, 5000))
      }

      openTimer = setTimeout(disconnected, 10000)
      socket.onopen = () => {
        if (!isCurrent()) { socket.close(); return }
        clearTimeout(openTimer)
        lastReceived = Date.now()
        if (sessionRef.current) {
          setConnectionStatus('resuming')
          resumeStarted = Date.now()
          socket.send(JSON.stringify({ type: 'resume_session', ...sessionRef.current }))
        } else {
          attempt = 0
          setConnectionStatus('connected')
        }
        socket.send(JSON.stringify({ type: 'ping' }))
        heartbeat = setInterval(() => {
          if (!isCurrent()) return
          if (Date.now() - lastReceived > 15000 ||
              (resumeStarted && Date.now() - resumeStarted > 10000)) {
            disconnected()
          } else if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }))
          }
        }, 5000)
      }

      socket.onmessage = (event) => {
        if (!isCurrent()) return
        let message
        try { message = JSON.parse(event.data) } catch { return }
        lastReceived = Date.now()
        if (message.type === 'pong') return
        if (message.sessionToken) {
          sessionRef.current = { roomCode: message.roomCode, sessionToken: message.sessionToken }
          try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionRef.current)) } catch { /* memory fallback */ }
        }
        if (message.type === 'session_resumed' || message.type === 'resume_rejected') {
          resumeStarted = null
          attempt = 0
          setConnectionStatus('connected')
        }
        if (['room_left', 'resume_rejected', 'opponent_left'].includes(message.type)) forgetSession()
        onMessage(message)
      }
      socket.onclose = disconnected
      socket.onerror = disconnected
    }

    function handleOffline() {
      setConnectionStatus('disconnected')
      onMessage({ type: 'connection_lost' })
      socketRef.current?.close()
    }
    connect()
    window.addEventListener('offline', handleOffline)
    return () => {
      active = false
      clearTimeout(retryTimer)
      clearTimeout(openTimer)
      clearInterval(heartbeat)
      window.removeEventListener('offline', handleOffline)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [onMessage, forgetSession])

  const sendMessage = useCallback((message) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false
    try {
      socketRef.current.send(JSON.stringify(message))
      return true
    } catch { return false }
  }, [])

  return { connectionStatus, sendMessage, forgetSession }
}
