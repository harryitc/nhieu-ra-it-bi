import { useEffect } from 'react'
import useGameStore from '../store/gameStore'

// Module-level socket – not stored in React state to avoid re-renders
let socket = null

/**
 * Send a message to the WebSocket server.
 * Safe to call even when socket is not yet open.
 */
export function sendToServer(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data))
  } else {
    console.warn('Socket not ready. Message dropped:', data.type)
  }
}

/** Deliberately close the socket (e.g. when leaving a room). */
export function closeSocket() {
  if (socket) {
    socket.close()
  }
}

/**
 * Initialise (or reinitialise) the WebSocket connection.
 * Idempotent – does nothing if already connected.
 */
export function initWebSocket() {
  if (socket && socket.readyState !== WebSocket.CLOSED) return

  let wsUrl
  if (import.meta.env.VITE_WS_URL) {
    // Explicit override: used when frontend (Vercel) is separate from backend (Render)
    wsUrl = import.meta.env.VITE_WS_URL
  } else if (import.meta.env.DEV) {
    // Local dev: route through Vite /ws proxy to avoid mixed-content issues
    wsUrl = `ws://${window.location.host}/ws`
  } else {
    // Same-origin prod (Render): WS on same host as page
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    wsUrl = `${protocol}//${window.location.host}/`
  }
  socket = new WebSocket(wsUrl)

  socket.onopen = () => {
    console.log('[WS] Connected to server.')
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      handleServerMessage(data)
    } catch (e) {
      console.error('[WS] Failed to parse message:', e)
    }
  }

  socket.onclose = () => {
    console.log('[WS] Disconnected.')
    socket = null

    const store = useGameStore.getState()

    if (store.deliberateLeave) {
      // Clean URL params
      const url = new URL(window.location.href)
      url.searchParams.delete('room')
      window.history.replaceState({}, '', url.toString())

      store.addToast('Bạn đã rời phòng chơi!', 'info')
      store.resetRoom()
      // Reconnect so the user can join/create again
      initWebSocket()
    } else {
      store.showModal({
        title: 'Mất Kết Nối',
        message: 'Mất kết nối tới máy chủ! Vui lòng bấm Xác Nhận để tải lại trang chủ.',
        icon: 'wifi_off',
        onConfirm: () => window.location.reload()
      })
    }
  }
}

// ── Server message dispatcher ──────────────────────────────────────────────
function handleServerMessage(msg) {
  const store = useGameStore.getState()

  switch (msg.type) {
    case 'ROOM_CREATED': {
      store.handleRoomCreated(msg)
      break
    }

    case 'ROOM_JOINED': {
      store.handleRoomJoined(msg)
      break
    }

    case 'ROOM_CONFIG_UPDATED': {
      store.handleRoomConfigUpdated(msg)
      break
    }

    case 'PLAYER_LIST_UPDATE': {
      store.handlePlayersUpdated(msg.players)
      break
    }

    case 'GAME_STARTED': {
      store.handleGameStarted(msg)
      break
    }

    case 'CHOICE_ACCEPTED': {
      store.handleChoiceAccepted(msg)
      break
    }

    case 'REVEAL_COUNTDOWN': {
      store.startCountdown()
      break
    }

    case 'REVEAL_RESULTS': {
      store.handleRevealResults(msg)
      break
    }

    case 'ROUND_RESET': {
      store.handleRoundReset(msg)
      break
    }

    case 'GO_TO_LOBBY': {
      store.handleGoToLobby()
      break
    }

    case 'CHAT_MESSAGE': {
      store.addChatMessage({
        type: msg.playerId === 'system' ? 'system' : 'chat',
        playerId: msg.playerId,
        playerName: msg.playerName,
        playerColor: msg.playerColor,
        message: msg.message,
        timestamp: msg.timestamp ?? Date.now()
      })
      if (msg.playerId === 'system') {
        store.addToast(msg.message, 'info')
      }
      break
    }

    case 'BROADCAST_REACTION': {
      // Dispatch a custom DOM event so PlayScreen/LobbyScreen can handle it
      window.dispatchEvent(
        new CustomEvent('game:reaction', { detail: msg })
      )
      break
    }

    case 'ERROR': {
      store.addToast(msg.message, 'error')
      break
    }

    default:
      console.warn('[WS] Unknown message type:', msg.type)
  }
}

// ── React hook ─────────────────────────────────────────────────────────────
export default function useWebSocket() {
  useEffect(() => {
    initWebSocket()
    // Cleanup: close socket when app unmounts (dev StrictMode double-mount safe)
    return () => {
      if (socket) {
        socket.onclose = null // prevent reconnect loop on dev unmount
        socket.close()
        socket = null
      }
    }
  }, [])
}
