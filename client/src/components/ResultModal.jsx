import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import useGameStore from '../store/gameStore'
import { sendToServer } from '../hooks/useWebSocket'
import sounds from '../utils/sounds'
import { HAND_SVGS } from '../utils/handSvgs'
import { ConfettiManager } from '../utils/confetti'

export default function ResultModal() {
  const { showResultOverlay, revealResults, roundNumber, roundType, players, myPlayer } = useGameStore(useShallow((s) => ({
    showResultOverlay: s.showResultOverlay,
    revealResults: s.revealResults,
    roundNumber: s.roundNumber,
    roundType: s.roundType,
    players: s.players,
    myPlayer: s.myPlayer
  })))
  const setShowResultOverlay = useGameStore((s) => s.setShowResultOverlay)

  const confettiRef = useRef(null)
  const confettiContainerRef = useRef(null)

  // Initialize confetti manager
  useEffect(() => {
    confettiRef.current = new ConfettiManager()
    return () => confettiRef.current?.stop()
  }, [])

  // Play sounds and confetti when overlay shows
  useEffect(() => {
    if (!showResultOverlay || !revealResults) return
    const { isTie, ultimateLoserId, loserIds } = revealResults

    if (isTie) {
      sounds.playTie()
    } else if (ultimateLoserId) {
      sounds.playLose()
      // Confetti explosion after short delay
      setTimeout(() => {
        if (confettiContainerRef.current && confettiRef.current) {
          confettiRef.current.createCanvas(confettiContainerRef.current)
          const rect = confettiContainerRef.current.getBoundingClientRect()
          confettiRef.current.spawnAround(rect.width / 2, rect.height / 2, 120)
        }
      }, 200)
    } else {
      sounds.playLose()
    }

    return () => {
      confettiRef.current?.stop()
    }
  }, [showResultOverlay, revealResults])

  if (!showResultOverlay || !revealResults) return null

  const { isTie, ultimateLoserId, loserIds = [], choices = {}, results = {} } = revealResults
  const isHost = myPlayer?.isHost ?? false

  const handlePlayAgain = () => {
    sounds.playClick()
    sendToServer({ type: 'PLAY_AGAIN' })
    setShowResultOverlay(false)
  }

  const handleBackToLobby = () => {
    sounds.playClick()
    sendToServer({ type: 'BACK_TO_LOBBY' })
    setShowResultOverlay(false)
  }

  const getUltimateLosersPlayer = () => {
    if (!ultimateLoserId) return null
    return players.find((p) => p.id === ultimateLoserId) ?? null
  }

  const ultimateLoser = getUltimateLosersPlayer()

  // Build summary list
  const activePlayers = players.filter((p) => !p.isSpectator)

  return (
    <div id="result-overlay" className="result-overlay active" ref={confettiContainerRef}>
      <div className="result-modal glass-card animate-slide-up">

        {isTie ? (
          <>
            <div className="result-icon result-icon-tie">
              <span className="material-symbols-rounded">handshake</span>
            </div>
            <h2 className="result-title result-title-tie">HÒA RỒI!</h2>
            <p className="result-subtitle">Không ai bị loại cả. Chơi lại ván này!</p>
          </>
        ) : ultimateLoser ? (
          <>
            <div className="result-icon result-icon-lose">
              <span className="material-symbols-rounded">skull</span>
            </div>
            <h2 className="result-title result-title-lose">TRẬN ĐẤU KẾT THÚC</h2>
            <p className="result-subtitle">
              <span style={{ color: ultimateLoser.color?.value ?? 'red', fontWeight: 700 }}>
                {ultimateLoser.name}
              </span>
              &nbsp;đã thua cuộc!
            </p>
          </>
        ) : (
          <>
            <div className="result-icon result-icon-round">
              <span className="material-symbols-rounded">sports_kabaddi</span>
            </div>
            <h2 className="result-title">Vòng {roundNumber} — Kết Quả</h2>
            {loserIds.length === 1 ? (
              <p className="result-subtitle">
                <span style={{ color: players.find((p) => p.id === loserIds[0])?.color?.value ?? 'inherit', fontWeight: 700 }}>
                  {players.find((p) => p.id === loserIds[0])?.name ?? '???'}
                </span>
                &nbsp;bị loại vòng này!
              </p>
            ) : (
              <p className="result-subtitle">
                {loserIds.map((id) => players.find((p) => p.id === id)?.name ?? '???').join(', ')} bị loại!
              </p>
            )}
          </>
        )}

        {/* Choices summary */}
        <div className="result-choices-summary">
          {activePlayers.map((p) => {
            const choice = choices[p.id]
            const status = results[p.id] // 'safe' | 'loser' | 'ultimate-loser' | etc.
            const isLoser = loserIds.includes(p.id) || p.id === ultimateLoserId
            return (
              <div
                key={p.id}
                className={`result-player-row ${isLoser ? 'result-player-loser' : 'result-player-safe'}`}
              >
                <span className="result-player-dot" style={{ background: p.color?.value ?? '#ccc' }} />
                <span className="result-player-name">{p.name}</span>
                {choice && (
                  <span
                    className="result-player-choice"
                    dangerouslySetInnerHTML={{ __html: HAND_SVGS[choice] ?? `<span>${choice}</span>` }}
                  />
                )}
                <span className={`result-player-status ${isLoser ? 'status-lose' : 'status-safe'}`}>
                  {isLoser
                    ? (p.id === ultimateLoserId ? '☠ Thua Cuộc' : '✗ Bị Loại')
                    : '✓ An Toàn'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Controls */}
        {isHost ? (
          <div className="result-host-controls">
            <button className="btn btn-secondary result-btn" onClick={handleBackToLobby}>
              <span className="material-symbols-rounded">meeting_room</span>
              Về Phòng Chờ
            </button>
            <button className="btn btn-primary btn-glow-effect result-btn" onClick={handlePlayAgain}>
              <span className="material-symbols-rounded">replay</span>
              {ultimateLoser ? 'Trận Mới' : 'Chơi Tiếp'}
            </button>
          </div>
        ) : (
          <div className="result-player-waiting">
            <div className="waiting-spinner" />
            <p>Đang đợi chủ phòng quyết định...</p>
          </div>
        )}

      </div>
    </div>
  )
}
