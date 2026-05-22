import { useState } from 'react'
import sounds from '../utils/sounds'
import { useShallow } from 'zustand/react/shallow'
import useGameStore from '../store/gameStore'
import { escapeHtml } from '../utils/helpers'

export default function HistoryPanel() {
  const { matchHistory, playerStats, roomCode, historyExpanded } = useGameStore(useShallow((s) => ({
    matchHistory: s.matchHistory,
    playerStats: s.playerStats,
    roomCode: s.roomCode,
    historyExpanded: s.historyExpanded
  })))
  const setHistoryExpanded = useGameStore((s) => s.setHistoryExpanded)
  const [showModal, setShowModal] = useState(false)

  if (!roomCode) return null

  const recentRounds = matchHistory.slice(-4)

  const openModal = () => {
    sounds.playClick()
    setShowModal(true)
  }
  const closeModal = () => {
    sounds.playClick()
    setShowModal(false)
  }

  return (
    <>
      <div id="app-history-wrapper" className={`history-wrapper ${historyExpanded ? 'expanded' : 'collapsed'}`}>
        <button
          id="history-toggle-btn"
          className="history-toggle-btn"
          title="Xem lịch sử trận đấu"
          onClick={() => {
            sounds.playClick()
            setHistoryExpanded(true)
          }}
        >
          <span className="material-symbols-rounded">history</span>
        </button>

        <div className="history-panel glass-card">
          <div className="history-header">
            <span className="material-symbols-rounded">history</span>
            <h3>Lịch Sử Vòng</h3>
            <button
              className="history-expand-icon-btn"
              title="Xem Chi Tiết Bảng Điểm"
              onClick={openModal}
              style={{ marginRight: 4 }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>analytics</span>
            </button>
            <button
              className="history-close-icon-btn"
              title="Đóng"
              onClick={() => {
                sounds.playClick()
                setHistoryExpanded(false)
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>

          <div className="history-messages" id="history-messages-container">
            {recentRounds.length === 0 ? (
              <div className="history-system-message">Chưa có lịch sử vòng đấu.</div>
            ) : (
              recentRounds.map((round, idx) => (
                <HistoryRow key={idx} round={round} playerStats={playerStats} onClick={openModal} />
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <HistoryDetailModal
          matchHistory={matchHistory}
          playerStats={playerStats}
          onClose={closeModal}
        />
      )}
    </>
  )
}

function HistoryRow({ round, playerStats, onClick }) {
  let text = ''
  if (round.isTie) {
    text = `Vòng ${round.roundNumber}: Kết quả Hòa! 🤝`
  } else if (round.ultimateLoserId) {
    const loserName = playerStats[round.ultimateLoserId]?.name ?? 'Người chơi'
    text = `Vòng ${round.roundNumber}: Chung cuộc! 💥 ${loserName} thua cuộc!`
  } else {
    const safeCount = round.details.filter((d) => !d.isSpectator && d.choice != null && d.status === 'safe').length
    const lostCount = round.details.filter((d) => !d.isSpectator && d.choice != null && d.status === 'loser').length
    text = `Vòng ${round.roundNumber}: ${safeCount} An Toàn, ${lostCount} Bị Chọn`
  }

  return (
    <div className="history-msg-row" onClick={onClick}>
      <div className="history-msg-bubble">
        <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold', marginRight: 5 }}>[{round.time}]</span>
        <span>{text}</span>
      </div>
    </div>
  )
}

function HistoryDetailModal({ matchHistory, playerStats, onClose }) {
  const [activeTab, setActiveTab] = useState('stats')

  const sortedStats = Object.values(playerStats).sort((a, b) => {
    if (a.tournamentsLost !== b.tournamentsLost) return a.tournamentsLost - b.tournamentsLost
    if (a.roundsSafe !== b.roundsSafe) return b.roundsSafe - a.roundsSafe
    return b.roundsPlayed - a.roundsPlayed
  })

  return (
    <div className="modal-overlay" id="history-detail-modal" style={{ display: 'flex', zIndex: 1100 }}>
      <div
        className="glass-card history-modal-content animate-zoom-in"
        style={{
          width: '90%', maxWidth: 600, maxHeight: '80vh', display: 'flex',
          flexDirection: 'column', overflow: 'hidden', padding: 25,
          borderRadius: 20, background: 'rgba(15, 16, 28, 0.75)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 15, marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 28, color: 'var(--neon-blue)', textShadow: '0 0 10px var(--neon-blue-glow)' }}>history</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'white' }}>CHI TIẾT LỊCH SỬ TRẬN ĐẤU</h2>
          </div>
          <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 24 }}>close</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <button
            className={`btn btn-tab ${activeTab === 'stats' ? 'active' : ''}`}
            style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setActiveTab('stats'); sounds.playClick() }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16, marginRight: 5, verticalAlign: 'middle' }}>analytics</span>
            BẢNG ĐIỂM TỔNG HỢP
          </button>
          <button
            className={`btn btn-tab ${activeTab === 'log' ? 'active' : ''}`}
            style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setActiveTab('log'); sounds.playClick() }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16, marginRight: 5, verticalAlign: 'middle' }}>receipt_long</span>
            NHẬT KÝ CHI TIẾT
          </button>
        </div>

        {/* Body */}
        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: 5, marginBottom: 10 }}>
          {activeTab === 'stats' && <StatsTab sortedStats={sortedStats} />}
          {activeTab === 'log' && <LogTab matchHistory={matchHistory} playerStats={playerStats} />}
        </div>
      </div>
    </div>
  )
}

function StatsTab({ sortedStats }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <th style={{ padding: '10px 5px', fontWeight: 600, color: 'var(--text-muted)' }}>Người Chơi</th>
            <th style={{ padding: '10px 5px', fontWeight: 600, textAlign: 'center', color: '#10b981' }}>An Toàn</th>
            <th style={{ padding: '10px 5px', fontWeight: 600, textAlign: 'center', color: '#ef4444' }}>Bị Chọn</th>
            <th style={{ padding: '10px 5px', fontWeight: 600, textAlign: 'center', color: '#f43f5e' }}>Thua Chung Cuộc</th>
            <th style={{ padding: '10px 5px', fontWeight: 600, textAlign: 'center', color: 'var(--neon-blue)' }}>Tỉ Lệ Thắng</th>
          </tr>
        </thead>
        <tbody>
          {sortedStats.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)' }}>
                Chưa có thống kê người chơi.
              </td>
            </tr>
          ) : (
            sortedStats.map((stat) => {
              const winRate = stat.roundsPlayed > 0 ? Math.round((stat.roundsSafe / stat.roundsPlayed) * 100) : 0
              return (
                <tr key={stat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: stat.color.value, boxShadow: `0 0 8px ${stat.color.value}` }} />
                    <span style={{ color: stat.color.value, fontWeight: 600 }}>{escapeHtml(stat.name)}</span>
                  </td>
                  <td style={{ padding: '12px 5px', textAlign: 'center', fontWeight: 500, color: '#10b981' }}>{stat.roundsSafe}</td>
                  <td style={{ padding: '12px 5px', textAlign: 'center', fontWeight: 500, color: '#ef4444' }}>{stat.roundsLost}</td>
                  <td style={{ padding: '12px 5px', textAlign: 'center', fontWeight: 'bold', color: '#f43f5e' }}>{stat.tournamentsLost}</td>
                  <td style={{ padding: '12px 5px', textAlign: 'center', fontWeight: 'bold', color: 'var(--neon-blue)', textShadow: '0 0 5px rgba(0,240,255,0.3)' }}>{winRate}%</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function LogTab({ matchHistory, playerStats }) {
  if (matchHistory.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 25, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
        Chưa có nhật ký vòng đấu nào. Chơi một ván để bắt đầu ghi nhận!
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      {[...matchHistory].reverse().map((round, idx) => {
        let headerStyle = ''
        let titleText = ''
        if (round.isTie) {
          titleText = `Vòng ${round.roundNumber} - HÒA 🤝`
          headerStyle = 'color: #eab308; text-shadow: 0 0 5px rgba(234,179,8,0.3);'
        } else if (round.ultimateLoserId) {
          const loserName = playerStats[round.ultimateLoserId]?.name ?? 'Người chơi'
          titleText = `Vòng ${round.roundNumber} - KẾT THÚC 👑 (Thua: ${loserName})`
          headerStyle = 'color: #ef4444; text-shadow: 0 0 5px rgba(239,68,68,0.3);'
        } else {
          titleText = `Vòng ${round.roundNumber} - TIẾP TỤC ⚔️`
          headerStyle = 'color: var(--neon-blue); text-shadow: 0 0 5px var(--neon-blue-glow);'
        }
        const modeName = round.roundType === 'oan-tu-ti' ? 'Oẳn Tù Tì' : 'Nhiều Ra Ít Bị'

        return (
          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 15px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13, ...styleStringToObj(headerStyle) }}>{titleText}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{modeName} @ {round.time}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {round.details.filter((d) => !d.isSpectator && d.choice != null).map((det) => {
                const statusMap = {
                  safe: { text: 'An Toàn', style: 'background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);' },
                  loser: { text: 'Bị Chọn', style: 'background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);' }
                }
                const { text: statusText, style: statusStyle } = statusMap[det.status] ?? {
                  text: 'Hòa', style: 'background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.1);'
                }
                const choiceStr = det.choice.charAt(0).toUpperCase() + det.choice.slice(1)
                return (
                  <div key={det.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 0', borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: det.color.value }} />
                      <span style={{ color: 'rgba(255,255,255,0.85)' }}>{escapeHtml(det.name)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>{choiceStr}</span>
                      <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, ...styleStringToObj(statusStyle) }}>{statusText}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Convert inline style string to React style object
function styleStringToObj(styleStr) {
  if (!styleStr) return {}
  return Object.fromEntries(
    styleStr.split(';').filter(Boolean).map((rule) => {
      const [prop, val] = rule.split(':').map((s) => s.trim())
      const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      return [camel, val]
    })
  )
}
