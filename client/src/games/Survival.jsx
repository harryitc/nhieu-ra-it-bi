import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Reuse the same WS endpoint as the main game
function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  if (import.meta.env.DEV) return `ws://${window.location.host}/ws`
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/`
}

// ─── Rounded rect helper (Safari compat) ──────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ─── Lobby screen ──────────────────────────────────────────────────────────
function SurvivalLobby({ name, onNameChange, onJoin, onBack, error }) {
  const handleKey = (e) => { if (e.key === 'Enter') onJoin() }
  return (
    <div className="app-container">
      <div className="bg-glow bg-glow-1" /><div className="bg-glow bg-glow-2" /><div className="bg-glow bg-glow-3" />
      <div className="hub-page animate-fade-in" style={{ maxWidth: 460, width: '100%' }}>
        <header className="app-header">
          <button className="hub-back-btn" onClick={onBack} title="Về trang chủ">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div className="logo-container" style={{ background: 'linear-gradient(135deg,#2ed573,#1e90ff)' }}>
            <span className="material-symbols-rounded logo-icon">bubble_chart</span>
          </div>
          <h1 className="app-title" style={{ fontSize: 32 }}>SINH TỒN 2D</h1>
          <p className="app-subtitle">Ăn pellet để lớn lên — nuốt cell nhỏ hơn để tồn tại!</p>
        </header>

        <div className="glass-card" style={{ padding: '28px 24px' }}>
          <div className="form-group">
            <label>Tên của bạn</label>
            <div className="input-wrapper">
              <span className="material-symbols-rounded input-icon">person</span>
              <input
                type="text" placeholder="Ví dụ: Hoàng, Hải..."
                maxLength={15} value={name}
                onChange={e => onNameChange(e.target.value)}
                onKeyDown={handleKey}
                autoFocus
              />
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
              🟢 Di chuyển bằng <strong>chuột / ngón tay</strong><br/>
              🔵 Ăn <strong>pellet màu</strong> để tăng khối lượng<br/>
              🔴 <strong>Nuốt</strong> cell nhỏ hơn 90% kích thước của bạn<br/>
              ⚠️ Tránh bị cell lớn hơn nuốt!
            </p>
          </div>

          <button className="btn btn-primary btn-large btn-glow-effect w-100" onClick={onJoin}>
            <span className="material-symbols-rounded">play_arrow</span>
            Vào Trò Chơi
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function Survival() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState('lobby')    // 'lobby'|'playing'|'dead'
  const [playerName, setPlayerName] = useState('')
  const [deathInfo, setDeathInfo] = useState(null)
  const [connError, setConnError] = useState('')

  const canvasRef       = useRef(null)
  const wsRef           = useRef(null)
  const stateRef        = useRef({ players: [], food: [], leaderboard: [], tick: 0 })
  const myIdRef         = useRef(null)
  const worldSizeRef    = useRef(6000)
  const mouseRef        = useRef({ x: 0, y: 0 })
  const rafRef          = useRef(null)
  const inputTimerRef   = useRef(null)
  const screenRef       = useRef('lobby')

  // keep screenRef in sync for use inside RAF callbacks
  useEffect(() => { screenRef.current = screen }, [screen])

  const connectAndJoin = useCallback((name) => {
    setConnError('')
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'SURVIVAL_JOIN', playerName: name }))
    }
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      switch (msg.type) {
        case 'SURVIVAL_JOINED':
          myIdRef.current   = msg.playerId
          worldSizeRef.current = msg.worldSize
          setScreen('playing')
          break
        case 'SURVIVAL_STATE':
          stateRef.current = msg
          break
        case 'SURVIVAL_DIED':
          setDeathInfo(msg)
          setScreen('dead')
          break
      }
    }
    ws.onerror = () => setConnError('Không kết nối được máy chủ. Thử lại sau.')
    ws.onclose = () => {
      if (screenRef.current === 'playing') setScreen('lobby')
    }
  }, [])

  // ── Send movement input ──────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'playing') { clearInterval(inputTimerRef.current); return }
    inputTimerRef.current = setInterval(() => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== 1) return
      const canvas = canvasRef.current
      if (!canvas) return
      const dx = mouseRef.current.x - canvas.width / 2
      const dy = mouseRef.current.y - canvas.height / 2
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 8) return
      ws.send(JSON.stringify({ type: 'SURVIVAL_INPUT', dx: dx / len, dy: dy / len }))
    }, 40) // 25 Hz
    return () => clearInterval(inputTimerRef.current)
  }, [screen])

  // ── Canvas render loop ───────────────────────────────────────────────────
  useEffect(() => {
    if (screen === 'lobby') { cancelAnimationFrame(rafRef.current); return }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const GRID = 70

    const render = () => {
      const { players, food, leaderboard } = stateRef.current
      const W = canvas.width, H = canvas.height
      const WORLD = worldSizeRef.current
      const me = players.find(p => p.id === myIdRef.current)

      ctx.clearRect(0, 0, W, H)

      // ── Background ─────────────────────────────────────────────────────
      ctx.fillStyle = '#08090f'
      ctx.fillRect(0, 0, W, H)

      const camX = me ? me.x - W / 2 : WORLD / 2 - W / 2
      const camY = me ? me.y - H / 2 : WORLD / 2 - H / 2

      ctx.save()
      ctx.translate(-camX, -camY)

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.035)'
      ctx.lineWidth = 1
      const gx0 = Math.floor(camX / GRID) * GRID
      const gy0 = Math.floor(camY / GRID) * GRID
      for (let x = gx0; x < camX + W + GRID; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, camY); ctx.lineTo(x, camY + H); ctx.stroke()
      }
      for (let y = gy0; y < camY + H + GRID; y += GRID) {
        ctx.beginPath(); ctx.moveTo(camX, y); ctx.lineTo(camX + W, y); ctx.stroke()
      }

      // World border glow
      ctx.strokeStyle = 'rgba(0,240,255,0.25)'
      ctx.lineWidth = 6
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 12
      ctx.strokeRect(0, 0, WORLD, WORLD)
      ctx.shadowBlur = 0

      // Food pellets
      for (const f of food) {
        ctx.beginPath()
        ctx.arc(f.x, f.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = f.color
        ctx.shadowColor = f.color
        ctx.shadowBlur = 8
        ctx.fill()
      }
      ctx.shadowBlur = 0

      // Players (small first so big renders on top)
      const sorted = [...players].sort((a, b) => a.r - b.r)
      for (const p of sorted) {
        if (!p.alive) continue
        const isMe = p.id === myIdRef.current

        // Fill
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + '28'
        ctx.fill()

        // Border
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.strokeStyle = isMe ? '#ffffff' : p.color
        ctx.lineWidth   = isMe ? 3 : 2
        ctx.shadowColor = p.color
        ctx.shadowBlur  = isMe ? 18 : 8
        ctx.stroke()
        ctx.shadowBlur  = 0

        // Name + mass label
        if (p.r > 14) {
          const fontSize = Math.max(10, Math.min(p.r * 0.45, 18))
          ctx.font = `bold ${fontSize}px Inter, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(0,0,0,0.8)'
          ctx.shadowBlur = 4
          ctx.fillText(p.name, p.x, p.y - fontSize * 0.25)
          if (p.r > 28) {
            ctx.font = `${Math.max(9, fontSize * 0.7)}px Inter, sans-serif`
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.fillText(p.r < 200 ? `${Math.floor(p.r ** 2 / 25)}` : '🏆', p.x, p.y + fontSize * 0.8)
          }
          ctx.shadowBlur = 0
        }
      }

      ctx.restore()

      // ── HUD: Leaderboard (top-right) ──────────────────────────────────
      if (leaderboard.length > 0) {
        const lbX = W - 188, lbY = 16
        const lbH = 36 + leaderboard.length * 24

        ctx.fillStyle = 'rgba(8,9,15,0.82)'
        roundRect(ctx, lbX, lbY, 172, lbH, 12)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'
        ctx.lineWidth = 1
        roundRect(ctx, lbX, lbY, 172, lbH, 12)
        ctx.stroke()

        ctx.fillStyle = 'rgba(0,240,255,0.8)'
        ctx.font = 'bold 10px Inter, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('BẢNG XẾP HẠNG', lbX + 12, lbY + 20)

        leaderboard.forEach((entry, i) => {
          const isMe = entry.id === myIdRef.current
          const yy = lbY + 38 + i * 24
          ctx.fillStyle = entry.color
          ctx.beginPath(); ctx.arc(lbX + 18, yy, 5, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = isMe ? '#ffffff' : 'rgba(255,255,255,0.75)'
          ctx.font = `${isMe ? 'bold ' : ''}12px Inter, sans-serif`
          ctx.textAlign = 'left'
          ctx.fillText(`${i + 1}. ${entry.name.slice(0, 10)}`, lbX + 28, yy + 4)
          ctx.fillStyle = 'rgba(255,255,255,0.4)'
          ctx.font = '11px Inter, sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText(entry.mass, lbX + 160, yy + 4)
        })
        ctx.textAlign = 'left'
      }

      // ── HUD: My stats (bottom-left) ───────────────────────────────────
      if (me) {
        const myMass = Math.floor(me.r * me.r / 25)
        const rank   = leaderboard.findIndex(e => e.id === myIdRef.current) + 1

        ctx.fillStyle = 'rgba(8,9,15,0.82)'
        roundRect(ctx, 16, H - 82, 160, 66, 12)
        ctx.fill()

        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('KHỐI LƯỢNG', 28, H - 62)

        ctx.fillStyle = me.color
        ctx.font = 'bold 28px Outfit, sans-serif'
        ctx.fillText(myMass, 28, H - 34)

        if (rank > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)'
          ctx.font = '10px Inter, sans-serif'
          ctx.fillText(`Hạng #${rank}/${leaderboard.length}`, 28, H - 18)
        }
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [screen])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleJoin = () => {
    const name = playerName.trim() || 'Người chơi'
    connectAndJoin(name)
  }

  const handleRespawn = () => {
    setDeathInfo(null)
    const ws = wsRef.current
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'SURVIVAL_RESPAWN' }))
      setScreen('playing')
    } else {
      connectAndJoin(playerName || 'Người chơi')
    }
  }

  const handleLeave = () => {
    const ws = wsRef.current
    if (ws) {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'SURVIVAL_LEAVE' }))
      ws.close()
    }
    navigate('/')
  }

  const handleMouseMove = (e) => {
    mouseRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    const t = e.touches[0]
    mouseRef.current = { x: t.clientX, y: t.clientY }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (screen === 'lobby') {
    return (
      <SurvivalLobby
        name={playerName} onNameChange={setPlayerName}
        onJoin={handleJoin} onBack={() => navigate('/')}
        error={connError}
      />
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#08090f', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      />

      {/* Leave button */}
      <button
        onClick={handleLeave}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 200,
          background: 'rgba(8,9,15,0.85)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 14px',
          cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
          backdropFilter: 'blur(12px)'
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>arrow_back</span>
        Thoát
      </button>

      {/* Player count */}
      <div style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
        background: 'rgba(8,9,15,0.75)', border: '1px solid rgba(255,255,255,0.07)',
        color: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '6px 16px',
        fontSize: 12, backdropFilter: 'blur(12px)'
      }}>
        {stateRef.current.players?.filter(p => p.alive).length ?? 0} người đang chơi
      </div>

      {/* Death overlay */}
      {screen === 'dead' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(10,11,20,0.95)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '40px 36px', textAlign: 'center',
            maxWidth: 340, width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,49,49,0.1)'
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>💀</div>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#f87171' }}>
              Bạn đã bị ăn!
            </h2>
            {deathInfo?.killedBy && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 6 }}>
                Bởi <strong style={{ color: '#fff' }}>{deathInfo.killedBy}</strong>
              </p>
            )}
            {deathInfo?.mass && (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 24 }}>
                Khối lượng đạt được: <strong style={{ color: '#fdcb6e' }}>{deathInfo.mass}</strong>
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleRespawn}
                style={{
                  background: 'linear-gradient(135deg,#2ed573,#1e90ff)', border: 'none',
                  color: '#fff', borderRadius: 12, padding: '13px 0', width: '100%',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit,sans-serif'
                }}
              >
                <span style={{ marginRight: 8 }}>▶</span>Chơi Lại
              </button>
              <button
                onClick={handleLeave}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '11px 0', width: '100%',
                  fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit,sans-serif'
                }}
              >
                Về Trang Chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
