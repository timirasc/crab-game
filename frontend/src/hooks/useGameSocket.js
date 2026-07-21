import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

const WEBSOCKET_URL = 'ws://127.0.0.1:8000/ws'

export function useGameSocket(onMessage) {
  const socketRef = useRef(null)
  const [connectionStatus, setConnectionStatus] =
    useState('connecting')

  useEffect(() => {
    let isActive = true
    const socket = new WebSocket(WEBSOCKET_URL)

    socketRef.current = socket

    function handleOpen() {
      if (!isActive) return
      setConnectionStatus('connected')
    }

    function handleMessage(event) {
      if (!isActive) return

      const message = JSON.parse(event.data)
      onMessage(message)
    }

    function handleClose() {
      if (!isActive) return
      setConnectionStatus('disconnected')
    }

    function handleError() {
      if (!isActive) return
      setConnectionStatus('error')
    }

    socket.addEventListener('open', handleOpen)
    socket.addEventListener('message', handleMessage)
    socket.addEventListener('close', handleClose)
    socket.addEventListener('error', handleError)

    return () => {
      isActive = false

      socket.removeEventListener('open', handleOpen)
      socket.removeEventListener('message', handleMessage)
      socket.removeEventListener('close', handleClose)
      socket.removeEventListener('error', handleError)

      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }

      if (socket.readyState === WebSocket.CONNECTING) {
        socket.addEventListener(
          'open',
          () => socket.close(),
          { once: true },
        )
      }

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [onMessage])

  const sendMessage = useCallback((message) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return false
    }

    socketRef.current.send(JSON.stringify(message))
    return true
  }, [])

  return {
    connectionStatus,
    sendMessage,
  }
}