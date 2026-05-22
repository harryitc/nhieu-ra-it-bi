import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import useGameStore from '../store/gameStore'
import { sendToServer } from '../hooks/useWebSocket'
import sounds from '../utils/sounds'
import { HAND_SVGS } from '../utils/handSvgs'
import { ConfettiManager } from '../utils/confetti'

const CHOICE_LABEL = { kéo: 'Kéo', búa: 'Búa', bao: 'Bao', sấp: 'Sấp', ngửa: 'Ngửa' }

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

  useEffect(() => {
    confettiRef.current = new ConfettiManager()
    return () => confettiRef.current?.stop()
  }, [])

  useEffect(() => {
    if (!showResultOverlay || !revealResults) return
    const { isTie, ultimateLoserId } = revealResults
    if (isTie) {
      sounds.playTie()
    } else {
      sounds.playLose()
      if (ultimateLoserId) {
        setTimeout(() => {
          if (confettiContainerRef.current && confettiRef.current) {
            confettiRef.current.createCanvas(confettiContainerRef.current)
            const rect = confettiContainerRef.current.getBoundingClientRect()
            confettiRef.current.spawnAround(rect.width / 2, rect.height / 2, 120)
          }
        }, 200)
      }
    }
    return () => confettiRef.current?.stop()
  }, [showResultOverlay, revealResults])

  if (!showResultOverlay || !revealResults) return null

  const { isTie, ultimateLoserId, loserIds = [], choices = {} } = revealResults
  const isHost = myPlayer?.isHost ?? false
  const activePlayers = players.filter((p) => !p.isSpectator)
  const spectators = players.filter((p) => p.isSpectator)

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

  // Determine header content
  let headerIcon, headerTitle, headerClass
  if (isTie) {
    headerIcon = 'handshake'
    headerTitle = 'HÒA RỒI!'
    headerClass = 'rm-header-tie'
  } else if (ultimateLoserId) {
    headerIcon = 'emoji_events'
    headerTitle = 'TRẬN ĐẤU KẾT THÚC'
    headerClass = 'rm-header-end'
  } else {
    headerIcon = 'sports_kabaddi'
    headerTitle = `VÒNG ${roundNumber} — KẾT QUẢ`
    headerClass = 'rm-header-round'
  }

  return (
    <div id="result-overlay" className="result-overlay active" ref={confettiContainerRef}>
      <div className="rm-modal glass-card animate-slide-up">

        {/* ── Header ── */}
        <div className={`rm-header ${headerClass}`}>
          <span className="material-symbols-rounded rm-header-icon">{headerIcon}</span>
          <h2 className="rm-header-title">{headerTitle}</h2>
          {isTie && <p className="rm-header-sub">Không ai bị loại — chơi lại ván này!</p>}
          {!isTie && ultimateLoserId && (() => {
            const ul = players.find((p) => p.id === ultimateLoserId)
            return ul ? (
              <p className="rm-header-sub">
                <span style={{ color: ul.color?.value ?? '#ff3131', fontWeight: 700 }}>{ul.name}</span>
                &nbsp;đã thua cuộc!
              </p>
            ) : null
          })()}
          {!isTie && !ultimateLoserId && loserIds.length > 0 && (
            <p className="rm-header-sub">
              {loserIds.length === 1
                ? <><span style={{ color: players.find((p) => p.id === loserIds[0])?.color?.value ?? 'inherit', fontWeight: 700 }}>{players.find((p) => p.id === loserIds[0])?.name ?? '???'}</span>&nbsp;bị loại vòng này!</>
                : <>{loserIds.map((id) => players.find((p) => p.id === id)?.name ?? '???').join(', ')} bị loại!</>
              }
            </p>
          )}
        </div>

        {/* ── Scoreboard ── */}
        <div className="rm-scoreboard">
          {activePlayers.map((p) => {
            const choice = choices[p.id]
            const isUltimate = p.id === ultimateLoserId
            const isLoser = loserIds.includes(p.id) || isUltimate
            const rowClass = isTie ? 'rm-row-tie' : isUltimate ? 'rm-row-ultimate' : isLoser ? 'rm-row-loser' : 'rm-row-safe'

            return (
              <div key={p.id} className={`rm-row ${rowClass}`}>
                {/* Color dot + name */}
                <div className="rm-row-player">
                  <span className="rm-dot" style={{ background: p.color?.value ?? '#ccc' }} />
                  <span className="rm-name">{p.name}</span>
                </div>

                {/* Hand SVG */}
                <div className="rm-hand">
                  {choice
                    ? <span className="rm-hand-svg" dangerouslySetInnerHTML={{ __html: HAND_SVGS[choice] ?? '' }} />
                    : <span className="rm-hand-unknown">?</span>
                  }
                  {choice && <span className="rm-choice-label">{CHOICE_LABEL[choice] ?? choice}</span>}
                </div>

                {/* Status badge */}
                <div className="rm-badge-wrap">
                  {isTie ? (
                    <span className="rm-badge rm-badge-tie">≡ Hòa</span>
                  ) : isUltimate ? (
                    <span className="rm-badge rm-badge-ultimate">☠ Thua Cuộc</span>
                  ) : isLoser ? (
                    <span className="rm-badge rm-badge-loser">✗ Bị Loại</span>
                  ) : (
                    <span className="rm-badge rm-badge-safe">✓ An Toàn</span>
                  )}
                </div>
              </div>
            )
          })}

          {spectators.length > 0 && (
            <div className="rm-spectators">
              <span className="material-symbols-rounded">visibility</span>
              Khán giả: {spectators.map((p) => p.name).join(', ')}
            </div>
          )}
        </div>

        {/* ── Controls ── */}
        {isHost ? (
          <div className="rm-controls">
            <button className="btn btn-secondary rm-btn" onClick={handleBackToLobby}>
              <span className="material-symbols-rounded">meeting_room</span>
              Về Phòng Chờ
            </button>
            <button className="btn btn-primary btn-glow-effect rm-btn" onClick={handlePlayAgain}>
              <span className="material-symbols-rounded">replay</span>
              {ultimateLoserId ? 'Trận Mới' : 'Chơi Tiếp'}
            </button>
          </div>
        ) : (
          <div className="rm-waiting">
            <div className="waiting-spinner" />
            <p>Đang đợi chủ phòng quyết định...</p>
          </div>
        )}

      </div>
    </div>
  )
}
