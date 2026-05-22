import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { computeHistoryEntry } from '../utils/historyUtils'

const useGameStore = create(
  persist(
    (set, get) => ({
      // ── PERSISTENT (survives page reload) ──────────────────────────────
      soundEnabled: true,
      savedPlayerName: '',

      // ── SCREEN ─────────────────────────────────────────────────────────
      // 'welcome' | 'lobby' | 'play'
      currentScreen: 'welcome',

      // ── ROOM ───────────────────────────────────────────────────────────
      roomCode: null,
      myPlayer: null, // { id, name, color, isHost, isSpectator, isSafe }
      players: [],    // sanitized player array from server

      // ── CONFIG ─────────────────────────────────────────────────────────
      currentMode: 'oan-tu-ti',
      maxChanges: 0,

      // ── ROUND ──────────────────────────────────────────────────────────
      roundNumber: 1,
      roundType: 'oan-tu-ti', // 'oan-tu-ti' by default
      myChoice: null,
      choiceChanges: 0,
      isCountingDown: false,

      // ── REVEAL ─────────────────────────────────────────────────────────
      // null until REVEAL_RESULTS arrives; cleared on round reset
      revealResults: null,
      showResultOverlay: false,
      // ── TIMERS ─────────────────────────────────────────────────────────────
      selectionTimeLeft: null,   // 30s countdown for picking a choice
      autoRevealTimeLeft: null,  // 5s countdown before auto-reveal
      // ── CHAT ───────────────────────────────────────────────────────────
      chatMessages: [],
      chatExpanded: false,
      unreadMessages: 0,

      // ── HISTORY (in-memory; also persisted to localStorage by roomCode) ─
      matchHistory: [],
      playerStats: {},
      historyExpanded: true,

      // ── UI ─────────────────────────────────────────────────────────────
      toasts: [],
      modal: null, // { title, message, icon, onConfirm, showCancel, onCancel }
      deliberateLeave: false,

      // ══════════════════════════════════════════════════════════════════
      // ACTIONS
      // ══════════════════════════════════════════════════════════════════

      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setSavedPlayerName: (v) => set({ savedPlayerName: v }),

      // ── Room lifecycle ──────────────────────────────────────────────────
      handleRoomCreated: (msg) => {
        const roomCode = msg.roomCode
        const history = safeParseLS(`matchHistory_${roomCode}`, [])
        const stats = safeParseLS(`playerStats_${roomCode}`, {})
        set({
          roomCode,
          myPlayer: msg.player,
          currentMode: msg.gameMode ?? 'oan-tu-ti',
          maxChanges: msg.maxChanges ?? 0,
          roundNumber: msg.roundNumber ?? 1,
          roundType: msg.roundType ?? 'nhieu-ra-it-bi',
          matchHistory: history,
          playerStats: stats,
          chatMessages: [{ type: 'system', message: 'Chào mừng đến với phòng chơi trực tuyến!' }],
          currentScreen: 'lobby'
        })
      },

      handleRoomJoined: (msg) => {
        const roomCode = msg.roomCode
        const history = safeParseLS(`matchHistory_${roomCode}`, [])
        const stats = safeParseLS(`playerStats_${roomCode}`, {})
        const isInGame = msg.gameState === 'playing' || msg.gameState === 'revealed'
        set({
          roomCode,
          myPlayer: msg.player,
          currentMode: msg.gameMode,
          maxChanges: msg.maxChanges ?? 0,
          roundNumber: msg.roundNumber ?? 1,
          roundType: msg.roundType ?? 'nhieu-ra-it-bi',
          matchHistory: history,
          playerStats: stats,
          chatMessages: [{ type: 'system', message: 'Chào mừng đến với phòng chơi trực tuyến!' }],
          currentScreen: isInGame ? 'play' : 'lobby'
        })
      },

      handleRoomConfigUpdated: (msg) => {
        set({ currentMode: msg.gameMode, maxChanges: msg.maxChanges })
      },

      handlePlayersUpdated: (players) => {
        const myId = get().myPlayer?.id
        if (!myId) { set({ players }); return }
        const me = players.find((p) => p.id === myId)
        if (me) {
          set((s) => ({
            players,
            myPlayer: {
              ...s.myPlayer,
              isHost: me.isHost,
              isSpectator: me.isSpectator ?? false,
              isSafe: me.isSafe ?? false
            }
          }))
        } else {
          set({ players })
        }
      },

      handleGameStarted: (msg) => {
        set({
          currentScreen: 'play',
          currentMode: msg.gameMode ?? get().currentMode,
          roundNumber: msg.roundNumber ?? 1,
          roundType: msg.roundType ?? 'nhieu-ra-it-bi',
          myChoice: null,
          choiceChanges: 0,
          isCountingDown: false,
          revealResults: null,
          showResultOverlay: false,
          selectionTimeLeft: msg.selectionTimeLeft ?? null,
          autoRevealTimeLeft: null
        })
      },

      handleChoiceAccepted: (msg) => {
        set({ myChoice: msg.choice, choiceChanges: msg.choiceChanges ?? 0 })
      },

      startCountdown: () => set({ isCountingDown: true }),

      setSelectionTimeLeft: (v) => set({ selectionTimeLeft: v }),
      setAutoRevealTimeLeft: (v) => set({ autoRevealTimeLeft: v }),

      handleRevealResults: (msg) => {
        // Record history
        const { entry, updatedStats } = computeHistoryEntry(
          msg.isTie,
          msg.results,
          msg.ultimateLoserId,
          msg.roundNumber,
          msg.roundType,
          get().playerStats
        )
        const updatedHistory = [...get().matchHistory, entry]
        const roomCode = get().roomCode
        if (roomCode) {
          safeSetLS(`matchHistory_${roomCode}`, updatedHistory)
          safeSetLS(`playerStats_${roomCode}`, updatedStats)
        }

        // Build choices map and loserIds list from results array
        const choices = {}
        const loserIds = []
        if (msg.results) {
          msg.results.forEach((r) => {
            if (r.choice) choices[r.id] = r.choice
            if (r.status === 'loser') loserIds.push(r.id)
          })
        }

        set({
          matchHistory: updatedHistory,
          playerStats: updatedStats,
          isCountingDown: false,
          revealResults: {
            isTie: msg.isTie,
            results: msg.results,
            choices,
            loserIds,
            ultimateLoserId: msg.ultimateLoserId,
            roundNumber: msg.roundNumber,
            roundType: msg.roundType
          }
        })
      },

      setShowResultOverlay: (v) => set({ showResultOverlay: v }),

      handleRoundReset: (msg) => {
        set({
          roundNumber: msg.roundNumber ?? get().roundNumber + 1,
          roundType: msg.roundType ?? 'oan-tu-ti',
          myChoice: null,
          choiceChanges: 0,
          isCountingDown: false,
          revealResults: null,
          showResultOverlay: false,
          selectionTimeLeft: null,
          autoRevealTimeLeft: null
        })
      },

      handleGoToLobby: () => {
        set({
          currentScreen: 'lobby',
          myChoice: null,
          isCountingDown: false,
          revealResults: null,
          showResultOverlay: false
        })
      },

      // ── Chat ─────────────────────────────────────────────────────────────
      addChatMessage: (msg) => {
        set((s) => ({
          chatMessages: [...s.chatMessages, msg],
          unreadMessages: s.chatExpanded ? 0 : s.unreadMessages + 1
        }))
      },

      setChatExpanded: (v) => {
        set({ chatExpanded: v, unreadMessages: v ? 0 : get().unreadMessages })
      },

      setHistoryExpanded: (v) => {
        set({ historyExpanded: v })
      },

      // ── Leave room ───────────────────────────────────────────────────────
      setDeliberateLeave: (v) => set({ deliberateLeave: v }),

      resetRoom: () => {
        set({
          roomCode: null,
          myPlayer: null,
          players: [],
          myChoice: null,
          choiceChanges: 0,
          isCountingDown: false,
          revealResults: null,
          showResultOverlay: false,
          selectionTimeLeft: null,
          autoRevealTimeLeft: null,
          roundNumber: 1,
          roundType: 'oan-tu-ti',
          unreadMessages: 0,
          chatMessages: [],
          chatExpanded: false,
          deliberateLeave: false,
          matchHistory: [],
          playerStats: {},
          currentScreen: 'welcome'
        })
      },

      // ── Toasts ───────────────────────────────────────────────────────────
      addToast: (message, type = 'info') => {
        const id = Date.now() + Math.random()
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
        }, 3500)
      },

      // ── Modal ────────────────────────────────────────────────────────────
      showModal: (modal) => set({ modal }),
      hideModal: () => set({ modal: null })
    }),
    {
      name: 'nhieu-ra-it-bi-persist',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        savedPlayerName: state.savedPlayerName
      })
    }
  )
)

// ── Helpers ────────────────────────────────────────────────────────────────
function safeParseLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSetLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded – silently ignore
  }
}

export default useGameStore
