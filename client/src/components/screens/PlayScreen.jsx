import { useEffect, useRef, useState, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import useGameStore from '../../store/gameStore'
import { sendToServer } from '../../hooks/useWebSocket'
import sounds from '../../utils/sounds'
import { HAND_SVGS } from '../../utils/handSvgs'
import { ConfettiManager } from '../../utils/confetti'
import ChoiceBar from './ChoiceBar'
import { MODE_TITLES } from '../../utils/helpers'
const COUNTDOWN_STEPS = [
  { text: 'BA', pitch: 220 },
  { text: 'HAI', pitch: 262 },
  { text: 'MỘT', pitch: 330 },
  { text: 'LẬT TAY!', pitch: 440 }
]

export default function PlayScreen() {
  const {
    players, myPlayer, roundNumber, roundType, isCountingDown,
    revealResults, myChoice, currentMode, selectionTimeLeft, autoRevealTimeLeft,
    roomCode, showModal, setDeliberateLeave
  } = useGameStore(useShallow((s) => ({
    players: s.players,
    myPlayer: s.myPlayer,
    roundNumber: s.roundNumber,
    roundType: s.roundType,
    isCountingDown: s.isCountingDown,
    revealResults: s.revealResults,
    myChoice: s.myChoice,
    currentMode: s.currentMode,
    selectionTimeLeft: s.selectionTimeLeft,
    autoRevealTimeLeft: s.autoRevealTimeLeft,
    roomCode: s.roomCode,
    showModal: s.showModal,
    setDeliberateLeave: s.setDeliberateLeave
  })))
  const setShowResultOverlay = useGameStore((s) => s.setShowResultOverlay)

  const [countdownText, setCountdownText] = useState('')
  const [flippedCards, setFlippedCards] = useState({}) // playerId → true after flip
  const [glowIds, setGlowIds] = useState({}) // playerId → 'safe' | 'loser'
  const tableRef = useRef(null)
  const confettiRef = useRef(new ConfettiManager())
  const countdownTimerRef = useRef(null)

  // Attach confetti canvas to table
  useEffect(() => {
    if (tableRef.current) {
      confettiRef.current.createCanvas(tableRef.current)
    }
    return () => confettiRef.current.stop()
  }, [])

  // Countdown animation
  useEffect(() => {
    if (!isCountingDown) {
      setCountdownText('')
      clearTimeout(countdownTimerRef.current)
      return
    }

    let step = 0
    const playStep = () => {
      if (step >= COUNTDOWN_STEPS.length) {
        setCountdownText('')
        return
      }
      const { text, pitch } = COUNTDOWN_STEPS[step]
      setCountdownText(text)
      sounds.playCountdown(pitch)
      step++
      countdownTimerRef.current = setTimeout(playStep, 900)
    }
    playStep()

    return () => clearTimeout(countdownTimerRef.current)
  }, [isCountingDown])

  // Reveal animation: flip cards, then show status glows, then open overlay
  useEffect(() => {
    if (!revealResults) return

    sounds.playFlip()

    // Flip all cards at once
    const allIds = {}
    players.forEach((p) => { allIds[p.id] = true })
    setFlippedCards(allIds)

    // After cards flip, show status glows
    const glowTimer = setTimeout(() => {
      const glows = {}
      players.forEach((p) => {
        if (revealResults.loserIds?.includes(p.id) || p.id === revealResults.ultimateLoserId) {
          glows[p.id] = 'loser'
        } else if (!p.isSpectator) {
          glows[p.id] = 'safe'
        }
      })
      setGlowIds(glows)

      // Confetti for winners if there's an ultimate loser
      if (revealResults.ultimateLoserId && tableRef.current) {
        const winners = players.filter(
          (p) => !revealResults.loserIds?.includes(p.id) && p.id !== revealResults.ultimateLoserId && !p.isSpectator
        )
        winners.forEach((_, i) => {
          setTimeout(() => {
            if (tableRef.current) {
              const rect = tableRef.current.getBoundingClientRect()
              confettiRef.current.spawnAround(
                Math.random() * rect.width,
                Math.random() * rect.height,
                20
              )
            }
          }, i * 150)
        })
      }
    }, 800)

    // Show result overlay
    const overlayTimer = setTimeout(() => {
      setShowResultOverlay(true)
    }, 2000)

    return () => {
      clearTimeout(glowTimer)
      clearTimeout(overlayTimer)
    }
  }, [revealResults]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset flipped/glow state on new round
  useEffect(() => {
    if (!revealResults) {
      setFlippedCards({})
      setGlowIds({})
    }
  }, [revealResults])

  // Emoji reaction animation handler
  useEffect(() => {
    const handler = (e) => {
      const { emoji, playerName } = e.detail
      spawnFloatingEmoji(emoji, playerName)
    }
    window.addEventListener('game:reaction', handler)
    return () => window.removeEventListener('game:reaction', handler)
  }, [])

  const handleReveal = () => {
    sounds.playClick()
    sendToServer({ type: 'TRIGGER_REVEAL' })
  }

  const handleLeave = useCallback(() => {
    sounds.playClick()
    showModal({
      title: 'Rời Phòng Chơi',
      message: 'Bạn có chắc chắn muốn rời khỏi trận đấu đang diễn ra?',
      icon: 'logout',
      showCancel: true,
      onConfirm: () => {
        setDeliberateLeave(true)
        if (roomCode) {
          localStorage.removeItem(`matchHistory_${roomCode}`)
          localStorage.removeItem(`playerStats_${roomCode}`)
        }
        closeSocket()
      }
    })
  }, [showModal, roomCode, setDeliberateLeave])

  const isHost = myPlayer?.isHost ?? false
  const activePlayers = players.filter((p) => !p.isSpectator)
  const allChosen = activePlayers
    .filter((p) => !p.isSafe)
    .every((p) => p.hasChosen)
  const canReveal = isHost && allChosen && !revealResults && !isCountingDown

  return (
    <section id="play-screen" className="screen active">
      <header className="game-header">
        <div className="game-info-left">
          <div className="game-mode-indicator">
            <span className="material-symbols-rounded">sports_kabaddi</span>
            <span className="mode-text">{MODE_TITLES[currentMode] || 'Trận đấu'}</span>
          </div>
          <div className="game-round-badge">
            Vòng {roundNumber}
          </div>
          {myPlayer?.isSpectator && (
            <span className="spectator-badge">
              <span className="material-symbols-rounded">visibility</span> Khán giả
            </span>
          )}
        </div>

        <div className="game-info-right">
          {roomCode && (
            <div className="game-room-indicator" title="Bấm để sao chép mã phòng">
              Mã phòng: <strong className="room-code-tag">{roomCode}</strong>
            </div>
          )}
          <button 
            className="btn btn-secondary btn-icon-only btn-leave-game"
            onClick={handleLeave}
            title="Rời phòng chơi"
          >
            <span className="material-symbols-rounded">logout</span>
          </button>
        </div>
      </header>

      <div className="game-table" ref={tableRef} id="game-table">
        <PlayerCircle
          players={players}
          myId={myPlayer?.id}
          revealResults={revealResults}
          flippedCards={flippedCards}
          glowIds={glowIds}
          roundType={roundType}
        />

        {countdownText && (
          <div className="countdown-display" id="countdown-display">
            {countdownText}
          </div>
        )}

        {/* Selection timer — only visible in last 10s */}
        {!isCountingDown && !revealResults && selectionTimeLeft !== null && selectionTimeLeft <= 10 && selectionTimeLeft > 0 && (
          <div className="selection-timer-urgent">
            <span className="material-symbols-rounded">timer</span>
            <span>Tự động chọn sau <strong>{selectionTimeLeft}s</strong>!</span>
          </div>
        )}

        {/* Auto-reveal countdown bar */}
        {!isCountingDown && !revealResults && autoRevealTimeLeft !== null && (
          <div className="auto-reveal-bar">
            <span className="material-symbols-rounded">visibility</span>
            <span>Tự động lật tay sau <strong>{autoRevealTimeLeft}s</strong>...</span>
            <div
              className="auto-reveal-progress"
              style={{ width: `${(autoRevealTimeLeft / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Host reveal button */}
        {isHost && !revealResults && (
          <div className="host-reveal-area">
            <button
              className={`btn btn-primary btn-glow-effect reveal-btn ${canReveal ? '' : 'disabled'}`}
              id="btn-trigger-reveal"
              disabled={!canReveal}
              onClick={handleReveal}
            >
              <span className="material-symbols-rounded">visibility</span>
              LẬT TAY!
            </button>
          </div>
        )}
      </div>

      <ChoiceBar />
    </section>
  )
}

// Player circle layout using CSS positioning
function PlayerCircle({ players, myId, revealResults, flippedCards, glowIds, roundType }) {
  const count = players.length
  if (count === 0) return null

  return (
    <div className="players-circle" id="players-circle">
      {players.map((p, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2
        const cx = 50 + 40 * Math.cos(angle)
        const cy = 50 + 40 * Math.sin(angle)

        const choice = revealResults?.choices?.[p.id] ?? null
        const isFlipped = Boolean(flippedCards[p.id])
        const glow = glowIds[p.id] // 'safe' | 'loser' | undefined

        return (
          <PlayerNode
            key={p.id}
            player={p}
            isMe={p.id === myId}
            cx={cx}
            cy={cy}
            choice={choice}
            isFlipped={isFlipped}
            glow={glow}
            roundType={roundType}
          />
        )
      })}
    </div>
  )
}

function PlayerNode({ player, isMe, cx, cy, choice, isFlipped, glow, roundType }) {
  const { name, color, hasChosen, isSafe, isSpectator } = player

  const nodeClass = [
    'player-node',
    isMe ? 'is-me' : '',
    isSafe ? 'is-safe' : '',
    isSpectator ? 'is-spectator' : '',
    glow === 'safe' ? 'glow-safe' : '',
    glow === 'loser' ? 'glow-loser' : ''
  ].filter(Boolean).join(' ')

  return (
    <div
      className={nodeClass}
      style={{ left: `${cx}%`, top: `${cy}%`, '--player-color': color?.value ?? '#ccc' }}
    >
      <div className="player-avatar" style={{ borderColor: color?.value ?? '#ccc', boxShadow: glow ? undefined : `0 0 0 2px ${color?.value ?? '#ccc'}40` }}>
        {isSpectator ? (
          <span className="material-symbols-rounded spectator-icon">visibility</span>
        ) : (
          <PlayerHandCard
            choice={choice}
            hasChosen={hasChosen}
            isFlipped={isFlipped}
            isSafe={isSafe}
            roundType={roundType}
          />
        )}
      </div>
      <div className="player-label">
        <span className="player-name-tag" style={{ color: color?.value ?? '#ccc' }}>
          {name}
          {isSafe && <span className="safe-badge-inline"> ✓</span>}
        </span>
      </div>
    </div>
  )
}

function PlayerHandCard({ choice, hasChosen, isFlipped, isSafe, roundType }) {
  if (isSafe) {
    return (
      <div className="hand-card hand-safe">
        <span className="material-symbols-rounded">shield</span>
      </div>
    )
  }
  if (isFlipped && choice) {
    return (
      <div className="hand-card hand-revealed">
        <span
          className="hand-svg-wrapper"
          dangerouslySetInnerHTML={{ __html: HAND_SVGS[choice] ?? `<span>${choice}</span>` }}
        />
      </div>
    )
  }
  if (hasChosen) {
    return (
      <div className="hand-card hand-chosen">
        <span
          className="hand-svg-wrapper"
          dangerouslySetInnerHTML={{ __html: HAND_SVGS['ẩn'] ?? '' }}
        />
      </div>
    )
  }
  return (
    <div className="hand-card hand-empty">
      <span className="material-symbols-rounded hand-empty-icon">pan_tool_alt</span>
    </div>
  )
}

// Utility: spawn floating emoji DOM element (imperative, outside React tree)
let emojiContainer = null
function spawnFloatingEmoji(emoji, playerName) {
  if (!emojiContainer) {
    emojiContainer = document.getElementById('emoji-floating-container')
    if (!emojiContainer) {
      emojiContainer = document.createElement('div')
      emojiContainer.id = 'emoji-floating-container'
      emojiContainer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1000;overflow:hidden;'
      document.body.appendChild(emojiContainer)
    }
  }

  const el = document.createElement('div')
  el.className = 'floating-emoji'
  el.style.left = `${10 + Math.random() * 80}%`
  el.style.bottom = '10%'
  el.innerHTML = `<span class="emoji-icon">${emoji}</span><span class="emoji-sender">${playerName}</span>`
  emojiContainer.appendChild(el)

  setTimeout(() => el.remove(), 2800)
}
