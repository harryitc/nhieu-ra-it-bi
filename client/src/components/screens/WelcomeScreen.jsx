import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import useGameStore from '../../store/gameStore'
import { sendToServer } from '../../hooks/useWebSocket'
import sounds from '../../utils/sounds'
import { HAND_SVGS } from '../../utils/handSvgs'

const MODES = [
  {
    id: 'oan-tu-ti',
    icon: 'sports_kabaddi',
    title: 'Oẳn Tù Tì',
    desc: 'Kéo – Búa – Bao. Kéo thắng Bao, Búa thắng Kéo, Bao thắng Búa.',
    badge: 'Chính'
  },
  {
    id: 'majority-out',
    icon: 'groups',
    title: 'Nhiều Ra, Ít Bị',
    desc: 'Số đông an toàn, số ít bị chọn (thua).'
  },
  {
    id: 'minority-out',
    icon: 'person_remove',
    title: 'Ít Ra, Nhiều Bị',
    desc: 'Số ít an toàn, số đông bị chọn (thua).'
  }
]

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const { savedPlayerName, addToast, setSavedPlayerName } = useGameStore(useShallow((s) => ({
    savedPlayerName: s.savedPlayerName,
    addToast: s.addToast,
    setSavedPlayerName: s.setSavedPlayerName
  })))

  const [hostName, setHostName] = useState(savedPlayerName || '')
  const [joinName, setJoinName] = useState(savedPlayerName || '')
  const [joinCode, setJoinCode] = useState('')
  const [selectedMode, setSelectedMode] = useState('oan-tu-ti')

  // Handle direct-join URL param (?room=XXXX)
  const [directJoinCode, setDirectJoinCode] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = params.get('room') || params.get('invite_friends')
    if (room) {
      setDirectJoinCode(room.toUpperCase())
      setJoinCode(room.toUpperCase())
    }
  }, [])

  const handleDirectJoinBack = () => {
    sounds.playClick()
    window.history.pushState({}, document.title, window.location.pathname)
    setDirectJoinCode(null)
    setJoinCode('')
  }

  const handleSelectMode = (modeId) => {
    sounds.playClick()
    setSelectedMode(modeId)
  }

  const handleCreateRoom = () => {
    sounds.playClick()
    const name = hostName.trim()
    if (!name) {
      addToast('Vui lòng điền tên của bạn trước khi tạo phòng!', 'warning')
      return
    }
    setSavedPlayerName(name)
    sendToServer({ type: 'CREATE_ROOM', hostName: name, gameMode: selectedMode })
  }

  const handleJoinRoom = () => {
    sounds.playClick()
    const name = joinName.trim()
    const code = joinCode.trim().toUpperCase()
    if (!name) { addToast('Vui lòng điền tên của bạn!', 'warning'); return }
    if (!code || code.length !== 4) { addToast('Vui lòng nhập đầy đủ mã phòng chơi (4 chữ cái)!', 'warning'); return }
    setSavedPlayerName(name)
    sendToServer({ type: 'JOIN_ROOM', playerName: name, roomCode: code })
  }

  const isDirectMode = Boolean(directJoinCode)

  return (
    <section id="welcome-screen" className="screen active">
      <header className="app-header animate-fade-in">
        <button className="hub-back-btn" onClick={() => navigate('/')} title="Về trang chủ">
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <div className="logo-container">
          <span className="material-symbols-rounded logo-icon">sports_kabaddi</span>
        </div>
        <h1 className="app-title">OẲN TÙ TÌ</h1>
        <p className="app-subtitle">Trò chơi dân gian trực tuyến thời gian thực</p>
      </header>

      <main className="setup-container animate-slide-up">
        <div className={`setup-layout-grid ${isDirectMode ? 'direct-join-mode' : ''}`}>

          {/* Create Room Card */}
          <div className="glass-card setup-card">
            <div className="card-header">
              <span className="material-symbols-rounded header-icon">add_box</span>
              <h2>Tạo Phòng Chơi Mới</h2>
            </div>

            <div className="form-group">
              <label htmlFor="create-host-name">Tên của bạn</label>
              <div className="input-wrapper">
                <span className="material-symbols-rounded input-icon">person</span>
                <input
                  type="text" id="create-host-name" placeholder="Ví dụ: Hoàng, Hải..."
                  maxLength={15} value={hostName} onChange={(e) => setHostName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Chọn luật chơi</label>
              <div className="modes-grid-vertical">
                {MODES.map((m) => (
                  <div
                    key={m.id}
                    className={`mode-select-item ${selectedMode === m.id ? 'active' : ''}`}
                    data-mode={m.id}
                    onClick={() => handleSelectMode(m.id)}
                  >
                    <span className="material-symbols-rounded mode-item-icon">{m.icon}</span>
                    <div className="mode-desc">
                      <h3>{m.title}</h3>
                      <p>{m.desc}</p>
                    </div>
                    {m.badge && <span className="badge badge-popular">{m.badge}</span>}
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-large btn-glow-effect w-100" id="btn-create-room" onClick={handleCreateRoom}>
              <span className="material-symbols-rounded">add_circle</span>
              Tạo Phòng Trực Tuyến
            </button>
          </div>

          {/* Join Room Card */}
          <div className="glass-card setup-card flex-justify" id="join-room-card">
            <div>
              <div className="card-header">
                <span className="material-symbols-rounded header-icon">login</span>
                <h2>Tham Gia Phòng Đã Có</h2>
              </div>

              {isDirectMode && (
                <div className="direct-join-room-header" style={{ textAlign: 'center', marginBottom: 25 }}>
                  <span className="material-symbols-rounded header-icon text-neon-blue" style={{ fontSize: 42, display: 'block', marginBottom: 12, color: 'var(--neon-blue)' }}>meeting_room</span>
                  <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Tham Gia Trận Đấu</h2>
                  <p className="app-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Mã phòng: <strong style={{ color: 'var(--neon-blue)', textShadow: '0 0 10px var(--neon-blue-glow)' }}>{directJoinCode}</strong>
                  </p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="join-player-name">Tên của bạn</label>
                <div className="input-wrapper">
                  <span className="material-symbols-rounded input-icon">person</span>
                  <input
                    type="text" id="join-player-name" placeholder="Nhập tên của bạn..."
                    maxLength={15} value={joinName} onChange={(e) => setJoinName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" id="join-room-code-group">
                <label htmlFor="join-room-code">Mã phòng (4 chữ cái)</label>
                <div className="input-wrapper">
                  <span className="material-symbols-rounded input-icon">vpn_key</span>
                  <input
                    type="text" id="join-room-code" placeholder="Ví dụ: A8FD"
                    maxLength={4} style={{ textTransform: 'uppercase' }}
                    value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>

            <div className="join-actions-container" style={{ width: '100%' }}>
              <button className="btn btn-secondary btn-large w-100" id="btn-join-room" onClick={handleJoinRoom}>
                <span className="material-symbols-rounded">meeting_room</span>
                Vào Phòng Chơi
              </button>

              {isDirectMode && (
                <div style={{ textAlign: 'center', marginTop: 15 }}>
                  <span
                    style={{ fontSize: 13, color: 'var(--neon-blue)', textDecoration: 'none', cursor: 'pointer', fontWeight: 500 }}
                    onClick={handleDirectJoinBack}
                  >
                    Tự Tạo Phòng Chơi Mới
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </section>
  )
}
