import { useShallow } from 'zustand/react/shallow'
import useGameStore from '../../store/gameStore'
import { sendToServer, closeSocket } from '../../hooks/useWebSocket'
import sounds from '../../utils/sounds'
import { MODE_TITLES } from '../../utils/helpers'

const CHANGE_OPTIONS = [
  { value: 0, label: 'Không cho phép (Chỉ chọn 1 lần)' },
  { value: 1, label: 'Thay đổi tối đa 1 lần (Chọn 2 lần)' },
  { value: 2, label: 'Thay đổi tối đa 2 lần (Chọn 3 lần)' },
  { value: 3, label: 'Thay đổi tối đa 3 lần (Chọn 4 lần)' },
  { value: 999, label: 'Không giới hạn (Đổi thoải mái)' }
]

export default function LobbyScreen() {
  const {
    roomCode, myPlayer, players, currentMode, maxChanges,
    showModal, addToast
  } = useGameStore(useShallow((s) => ({
    roomCode: s.roomCode,
    myPlayer: s.myPlayer,
    players: s.players,
    currentMode: s.currentMode,
    maxChanges: s.maxChanges,
    showModal: s.showModal,
    addToast: s.addToast
  })))
  const setDeliberateLeave = useGameStore((s) => s.setDeliberateLeave)
  const resetRoom = useGameStore((s) => s.resetRoom)

  const isHost = myPlayer?.isHost ?? false
  const canStart = players.length >= 2

  const handleCopyCode = () => {
    sounds.playClick()
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode).then(() => {
      addToast(`Đã sao chép Mã phòng: ${roomCode}`, 'success')
    }).catch(() => {
      showModal({ title: 'Mã Phòng Chơi', message: `Mã phòng chơi của bạn là: ${roomCode}`, icon: 'content_copy' })
    })
  }

  const handleCopyLink = () => {
    sounds.playClick()
    if (!roomCode) return
    const joinUrl = `${window.location.protocol}//${window.location.host}/?invite_friends=${roomCode}`
    navigator.clipboard.writeText(joinUrl).then(() => {
      addToast('Đã sao chép liên kết vào phòng! Hãy gửi liên kết này cho bạn bè.', 'success')
    }).catch(() => {
      showModal({ title: 'Liên Kết Vào Phòng', message: `Liên kết của bạn là:\n${joinUrl}`, icon: 'link' })
    })
  }

  const handleStart = () => {
    sounds.playClick()
    sendToServer({ type: 'START_GAME' })
  }

  const handleModeChange = (e) => {
    if (!isHost) return
    sendToServer({ type: 'UPDATE_ROOM_CONFIG', gameMode: e.target.value, maxChanges })
  }

  const handleChangesChange = (e) => {
    if (!isHost) return
    sendToServer({ type: 'UPDATE_ROOM_CONFIG', gameMode: currentMode, maxChanges: parseInt(e.target.value, 10) })
  }

  const handleLeave = () => {
    sounds.playClick()
    showModal({
      title: 'Rời Phòng Chờ',
      message: 'Bạn có chắc chắn muốn rời khỏi phòng chơi hiện tại không? Mọi dữ liệu về kết quả tích lũy trong phòng này sẽ bị xóa.',
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
  }

  const configText = () => {
    if (maxChanges === 0) return 'Không cho phép (Chỉ chọn 1 lần)'
    if (maxChanges === 999) return 'Không giới hạn (Đổi thoải mái)'
    return `Tối đa ${maxChanges} lần`
  }

  const lobbyStatusText = isHost
    ? (canStart ? 'Phòng đã sẵn sàng bắt đầu chơi!' : 'Đang đợi thêm bạn tham gia (cần ít nhất 2)...')
    : 'Đang trong phòng chờ...'

  const lobbyStatusClass = isHost
    ? (canStart ? 'info-val text-neon-green' : 'info-val text-neon-blue')
    : 'info-val text-neon-blue'

  return (
    <section id="lobby-screen" className="screen active">
      <header className="app-header">
        <h1 className="app-title">PHÒNG CHỜ TRỰC TUYẾN</h1>
        <p className="app-subtitle">Mời bạn bè nhập mã phòng để cùng tham gia</p>
      </header>

      <main className="lobby-container animate-slide-up">

        <div className="glass-card room-code-card">
          <p className="room-code-label">MÃ PHÒNG CHƠI</p>
          <div className="room-code-display-wrapper" id="copy-room-code-btn" title="Bấm để sao chép Mã Phòng" onClick={handleCopyCode}>
            <h1 className="room-code-display">{roomCode ?? '----'}</h1>
            <span className="material-symbols-rounded copy-icon">content_copy</span>
          </div>
          <p className="room-code-hint" style={{ marginBottom: 12 }}>Bấm vào mã phòng trên để sao chép mã phòng!</p>
          <button className="btn btn-secondary w-100" id="copy-room-link-btn" onClick={handleCopyLink} style={{ height: 40, borderRadius: 10, fontSize: 13 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>link</span>
            Sao Chép Link Tham Gia
          </button>
        </div>

        <div className="lobby-grid">
          {/* Players List */}
          <div className="glass-card lobby-players-card">
            <div className="card-header">
              <span className="material-symbols-rounded header-icon">group</span>
              <h2>Bạn Bè Đang Trực Tuyến (<span id="lobby-player-count">{players.length}</span>/10)</h2>
            </div>
            <div className="lobby-players-list" id="lobby-players-list">
              {players.map((p) => (
                <LobbyPlayerRow key={p.id} player={p} myId={myPlayer?.id} />
              ))}
            </div>
          </div>

          {/* Room Info */}
          <div className="glass-card lobby-info-card">
            <div className="card-header">
              <span className="material-symbols-rounded header-icon">info</span>
              <h2>Thông Tin Trận Đấu</h2>
            </div>
            <div className="info-content-box">
              <div className="info-row">
                <span className="info-label">Chế độ chơi:</span>
                <span className="info-val" id="lobby-mode-name">{MODE_TITLES[currentMode] ?? currentMode}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Thay đổi lựa chọn:</span>
                <span className="info-val text-neon-yellow">{configText()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Trạng thái:</span>
                <span className={lobbyStatusClass}>{lobbyStatusText}</span>
              </div>

              {/* Host Config Panel */}
              {isHost && (
                <div className="host-config-panel" id="host-config-panel">
                  <div className="config-section">
                    <label className="config-label">Thay đổi luật chơi:</label>
                    <select className="custom-select" id="host-select-mode" value={currentMode} onChange={handleModeChange}>
                      <option value="oan-tu-ti">Oẳn Tù Tì</option>
                      <option value="majority-out">Nhiều Ra, Ít Bị</option>
                      <option value="minority-out">Ít Ra, Nhiều Bị</option>
                    </select>
                  </div>
                  <div className="config-section">
                    <label className="config-label">Số lần đổi lựa chọn:</label>
                    <select className="custom-select" id="host-select-changes" value={maxChanges} onChange={handleChangesChange}>
                      {CHANGE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {isHost ? (
                <div className="host-controls" id="host-start-control">
                  <p className="control-hint">Bạn là chủ phòng. Bấm Bắt đầu khi đã đủ người (tối thiểu 2 người).</p>
                  <button
                    className={`btn btn-primary btn-large btn-glow-effect w-100 ${canStart ? '' : 'disabled'}`}
                    id="btn-host-start"
                    disabled={!canStart}
                    onClick={handleStart}
                  >
                    <span className="material-symbols-rounded">play_arrow</span>
                    Bắt Đầu Trò Chơi
                  </button>
                </div>
              ) : (
                <div className="player-waiting-message" id="player-wait-control">
                  <div className="waiting-spinner" />
                  <p>Đang đợi chủ phòng bấm bắt đầu...</p>
                </div>
              )}

              <button
                className="btn btn-danger btn-large btn-leave-room w-100"
                id="btn-lobby-leave"
                style={{ marginTop: 15, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
                onClick={handleLeave}
              >
                <span className="material-symbols-rounded">logout</span>
                Rời Phòng Chờ
              </button>
            </div>
          </div>
        </div>

      </main>
    </section>
  )
}

function LobbyPlayerRow({ player, myId }) {
  const isMe = player.id === myId
  return (
    <div className="lobby-player-row">
      <div className="lobby-player-left">
        <span className="lobby-player-dot" style={{ background: player.color.value }} />
        <span className="lobby-player-name" style={{ color: player.color.value }}>{player.name}</span>
      </div>
      <div className="lobby-player-badges">
        {player.isHost && <span className="lobby-badge-role role-host">Chủ phòng</span>}
        {isMe && <span className="lobby-badge-role role-you">Bạn</span>}
      </div>
    </div>
  )
}
