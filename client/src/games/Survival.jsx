import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const MODES = [
  {
    id: 'classic', icon: 'bubble_chart', label: 'Cổ Điển', badge: null,
    sub: 'Thế giới mở · Không giới hạn',
    desc: 'Ăn pellet và nuốt cell nhỏ hơn để lớn. Không có điều kiện thắng — chỉ cần thống trị bảng xếp hạng!',
    color: '#2ed573', glow: 'rgba(46,213,115,0.35)', grad: ['#2ed573', '#1e90ff'],
  },
  {
    id: 'battle', icon: 'crisis_alert', label: 'Chiến Trường', badge: '🔥 HOT',
    sub: 'Vùng thu hẹp · Vũ khí · Sprint',
    desc: 'Vùng an toàn thu hẹp dần, nhặt hòm vũ khí để nâng cấp súng, giữ SHIFT để bứt tốc. Người cuối cùng sống sót thắng vòng!',
    color: '#ff4757', glow: 'rgba(255,71,87,0.35)', grad: ['#ff4757', '#c0392b'],
  },
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

function LobbyScreen({ name, onNameChange, onNext, onBack, error }) {
  return (
    <div className="app-container">
      <div className="bg-glow bg-glow-1" /><div className="bg-glow bg-glow-2" /><div className="bg-glow bg-glow-3" />
      <div className="hub-page animate-fade-in" style={{ maxWidth: 440, width: '100%' }}>
        <header className="app-header">
          <button className="hub-back-btn" onClick={onBack} title="Về trang chủ">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div className="logo-container" style={{ background: 'linear-gradient(135deg,#2ed573,#1e90ff)' }}>
            <span className="material-symbols-rounded logo-icon">bubble_chart</span>
          </div>
          <h1 className="app-title" style={{ fontSize: 30 }}>SINH TỒN 2D</h1>
          <p className="app-subtitle">Ăn pellet · Nuốt cell nhỏ · Thống trị bảng xếp hạng</p>
        </header>
        <div className="glass-card" style={{ padding: '28px 24px' }}>
          <div className="form-group">
            <label>Tên của bạn</label>
            <div className="input-wrapper">
              <span className="material-symbols-rounded input-icon">person</span>
              <input
                type="text" placeholder="Ví dụ: Hoàng, Hải, Luna..."
                maxLength={15} value={name}
                onChange={e => onNameChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onNext()}
                autoFocus
              />
            </div>
          </div>
          {error && <p style={{ color:'#f87171', fontSize:13, marginBottom:12 }}>{error}</p>}
          <button className="btn btn-primary btn-large btn-glow-effect w-100" onClick={onNext}>
            <span className="material-symbols-rounded">arrow_forward</span>
            Chọn Chế Độ Chơi
          </button>
        </div>
      </div>
    </div>
  )
}

function ModeSelect({ onSelect, onBack }) {
  const [hover, setHover] = useState(null)
  return (
    <div className="app-container">
      <div className="bg-glow bg-glow-1" /><div className="bg-glow bg-glow-2" /><div className="bg-glow bg-glow-3" />
      <div className="hub-page animate-fade-in" style={{ maxWidth: 540, width: '100%' }}>
        <header className="app-header">
          <button className="hub-back-btn" onClick={onBack}>
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h1 className="app-title" style={{ fontSize: 26 }}>CHỌN CHẾ ĐỘ CHƠI</h1>
          <p className="app-subtitle">2 chế độ — cổ điển và chiến trường đầy ắp hành động</p>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              onMouseEnter={() => setHover(m.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: hover === m.id ? `rgba(${hexToRgb(m.color)},0.12)` : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${hover === m.id ? m.color : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.2s ease',
                boxShadow: hover === m.id ? `0 0 24px ${m.glow}` : 'none',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: `linear-gradient(135deg,${m.grad[0]},${m.grad[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 16px ${m.glow}`,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#fff' }}>{m.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>{m.label}</span>
                  {m.badge && (
                    <span style={{
                      background: `linear-gradient(135deg,${m.grad[0]},${m.grad[1]})`,
                      color: '#fff', fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap',
                    }}>{m.badge}</span>
                  )}
                </div>
                <p style={{ color: m.color, fontSize: 11, fontWeight: 600, margin: '0 0 4px', opacity: 0.9 }}>{m.sub}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{m.desc}</p>
              </div>
              <span className="material-symbols-rounded" style={{ color: m.color, fontSize: 22, flexShrink: 0, opacity: hover === m.id ? 1 : 0.3 }}>chevron_right</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Survival() {
  const navigate = useNavigate()

  const [screen,       setScreen]       = useState('lobby')
  const [playerName,   setPlayerName]   = useState('')
  const [deathInfo,    setDeathInfo]    = useState(null)
  const [connError,    setConnError]    = useState('')

  const canvasRef     = useRef(null)
  const wsRef         = useRef(null)
  const stateRef      = useRef({ players:[], food:[], leaderboard:[], tick:0, zone:null, winner:null, resetCountdown:0, roundNum:1, mode:'classic', bullets:[], weaponBoxes:[] })
  const myIdRef       = useRef(null)
  const modeRef       = useRef('classic')
  const worldSizeRef  = useRef(6000)
  const mouseRef      = useRef({ x: 0, y: 0 })
  const rafRef        = useRef(null)
  const inputTimerRef = useRef(null)
  const roundNumRef   = useRef(1)
  const screenRef     = useRef('lobby')
  const sprintRef     = useRef(false)

  useEffect(() => { screenRef.current = screen }, [screen])

  useEffect(() => {
    const onKey = e => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight')
        sprintRef.current = e.type === 'keydown'
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [])

  const connectAndJoin = useCallback((name, mode) => {
    setConnError('')
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close() }
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws
    ws.onopen = () => { ws.send(JSON.stringify({ type: 'SURVIVAL_JOIN', playerName: name, mode })) }
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      switch (msg.type) {
        case 'SURVIVAL_JOINED':
          myIdRef.current = msg.playerId
          modeRef.current = msg.mode
          worldSizeRef.current = msg.worldSize
          roundNumRef.current = 1
          setScreen('playing')
          break
        case 'SURVIVAL_STATE':
          stateRef.current = msg
          if (msg.roundNum > roundNumRef.current) {
            roundNumRef.current = msg.roundNum
            if (screenRef.current === 'dead') { setDeathInfo(null); setScreen('playing') }
          }
          break
        case 'SURVIVAL_DIED':
          setDeathInfo(msg); setScreen('dead')
          break
      }
    }
    ws.onerror = () => setConnError('Không kết nối được máy chủ. Thử lại sau.')
    ws.onclose = () => { if (screenRef.current === 'playing') setScreen('modeSelect') }
  }, [])

  useEffect(() => {
    if (screen !== 'playing') { clearInterval(inputTimerRef.current); return }
    inputTimerRef.current = setInterval(() => {
      const ws = wsRef.current; if (!ws || ws.readyState !== 1) return
      const canvas = canvasRef.current; if (!canvas) return
      const dx = mouseRef.current.x - canvas.width / 2
      const dy = mouseRef.current.y - canvas.height / 2
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 8) return
      ws.send(JSON.stringify({ type: 'SURVIVAL_INPUT', dx: dx / len, dy: dy / len, sprint: sprintRef.current }))
    }, 40)
    return () => clearInterval(inputTimerRef.current)
  }, [screen])

  useEffect(() => {
    if (screen !== 'playing' && screen !== 'dead') { cancelAnimationFrame(rafRef.current); return }
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)

    const render = () => {
      const { players, food, leaderboard, zone, winner, resetCountdown, mode, bullets, weaponBoxes } = stateRef.current
      const W = canvas.width, H = canvas.height, WORLD = worldSizeRef.current
      const me = players.find(p => p.id === myIdRef.current)
      const myMass = me ? Math.floor(me.r * me.r / 25) : 0

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08090f'; ctx.fillRect(0, 0, W, H)

      const camX = me ? me.x - W / 2 : WORLD / 2 - W / 2
      const camY = me ? me.y - H / 2 : WORLD / 2 - H / 2

      ctx.save(); ctx.translate(-camX, -camY)

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1
      const gx0 = Math.floor(camX / 70) * 70, gy0 = Math.floor(camY / 70) * 70
      for (let x = gx0; x < camX + W + 70; x += 70) { ctx.beginPath(); ctx.moveTo(x, camY); ctx.lineTo(x, camY + H); ctx.stroke() }
      for (let y = gy0; y < camY + H + 70; y += 70) { ctx.beginPath(); ctx.moveTo(camX, y); ctx.lineTo(camX + W, y); ctx.stroke() }

      // World border
      ctx.strokeStyle = 'rgba(0,240,255,0.25)'; ctx.lineWidth = 6
      ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 14
      ctx.strokeRect(0, 0, WORLD, WORLD); ctx.shadowBlur = 0

      // Battle zone
      if (zone) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(camX - 10, camY - 10, W + 20, H + 20)
        ctx.arc(zone.cx, zone.cy, zone.r, 0, Math.PI * 2, true)
        ctx.fillStyle = 'rgba(255,49,49,0.17)'; ctx.fill('evenodd')
        ctx.restore()

        ctx.beginPath(); ctx.arc(zone.cx, zone.cy, zone.r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255,49,49,0.9)'; ctx.lineWidth = 4
        ctx.shadowColor = '#ff4757'; ctx.shadowBlur = 20
        ctx.stroke(); ctx.shadowBlur = 0

        // "NGUY HIỂM" label on zone border
        const labelAngle = -Math.PI / 4
        const labelX = zone.cx + Math.cos(labelAngle) * zone.r
        const labelY = zone.cy + Math.sin(labelAngle) * zone.r
        if (labelX > camX && labelX < camX + W && labelY > camY && labelY < camY + H) {
          ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'center'
          ctx.fillStyle = '#ff4757'; ctx.fillText('⚠ VÙNG NGUY HIỂM', labelX, labelY - 8)
          ctx.textAlign = 'left'
        }
      }

      // Weapon boxes (battle)
      if (weaponBoxes) {
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 500)
        for (const wb of weaponBoxes) {
          ctx.save()
          ctx.shadowColor = '#fdcb6e'; ctx.shadowBlur = 18 * pulse
          ctx.fillStyle = '#b8860b'
          roundRect(ctx, wb.x - 16, wb.y - 16, 32, 32, 7); ctx.fill()
          ctx.fillStyle = '#fdcb6e'
          roundRect(ctx, wb.x - 12, wb.y - 12, 24, 24, 5); ctx.fill()
          ctx.shadowBlur = 0
          ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText('⚔', wb.x, wb.y + 1)
          ctx.restore()
        }
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      }

      // Bullets
      if (bullets) {
        for (const b of bullets) {
          ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2)
          ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 10; ctx.fill()
        }
        ctx.shadowBlur = 0
      }

      // Food pellets
      for (const f of food) {
        ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = f.color; ctx.shadowColor = f.color; ctx.shadowBlur = 8; ctx.fill()
      }
      ctx.shadowBlur = 0

      // Players (small-first, guns drawn behind cell)
      const GUN_ANGLE_MAP = [[],[0],[0,Math.PI],[0,Math.PI*2/3,Math.PI*4/3],[0,Math.PI/2,Math.PI,Math.PI*3/2]]
      const sorted = [...players].sort((a, b) => a.r - b.r)
      for (const p of sorted) {
        if (!p.alive) continue
        const isMe = p.id === myIdRef.current

        // Gun barrels (drawn behind circle so circle masks the base)
        const wl = p.weaponLevel || 0
        if (wl > 0) {
          const gAngles = GUN_ANGLE_MAP[Math.min(wl, 4)] || []
          const bW = Math.max(6, p.r * 0.3)
          for (const angle of gAngles) {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(angle)
            ctx.fillStyle = '#636e72'
            ctx.fillRect(p.r * 0.35, -bW / 2, p.r * 1.15, bW)
            ctx.fillStyle = '#b2bec3'
            ctx.fillRect(p.r * 0.35, -bW / 2, p.r * 1.15, bW * 0.35)
            ctx.restore()
          }
        }

        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + '28'; ctx.fill()

        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.strokeStyle = isMe ? '#ffffff' : p.color; ctx.lineWidth = isMe ? 3 : 2
        ctx.shadowColor = p.color; ctx.shadowBlur = isMe ? 22 : 8
        ctx.stroke(); ctx.shadowBlur = 0

        if (p.r > 14) {
          const fs = Math.max(10, Math.min(p.r * 0.44, 18))
          ctx.font = `bold ${fs}px Inter,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4
          ctx.fillText(p.name, p.x, p.y - fs * 0.28)
          if (p.r > 26) {
            ctx.font = `${Math.max(9, fs * 0.7)}px Inter,sans-serif`; ctx.fillStyle = 'rgba(255,255,255,0.6)'
            ctx.fillText(Math.floor(p.r * p.r / 25), p.x, p.y + fs * 0.75)
          }
          ctx.shadowBlur = 0
        }
      }

      ctx.restore()

      // Winner banner
      if (winner) {
        const bH = 90
        ctx.fillStyle = 'rgba(8,9,15,0.92)'; ctx.fillRect(0, H/2 - bH/2 - 10, W, bH + 20)
        ctx.font = 'bold 30px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = winner.color; ctx.shadowColor = winner.color; ctx.shadowBlur = 28
        ctx.fillText(`🏆  ${winner.name} thắng vòng này!`, W/2, H/2 - 10)
        ctx.shadowBlur = 0
        if (resetCountdown > 0) {
          ctx.font = '14px Inter,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.45)'
          ctx.fillText(`Vòng mới bắt đầu sau ${resetCountdown}s...`, W/2, H/2 + 28)
        }
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      }

      // HUD: Leaderboard
      if (leaderboard.length > 0) {
        const lbX = W - 192, lbY = 16, lbW = 176, lbH = 38 + leaderboard.length * 24
        ctx.fillStyle = 'rgba(8,9,15,0.84)'
        roundRect(ctx, lbX, lbY, lbW, lbH, 12); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
        roundRect(ctx, lbX, lbY, lbW, lbH, 12); ctx.stroke()
        ctx.fillStyle = 'rgba(0,240,255,0.75)'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.textAlign = 'left'
        ctx.fillText('BẢNG XẾP HẠNG', lbX + 12, lbY + 20)
        leaderboard.forEach((e, i) => {
          const isMe = e.id === myIdRef.current, yy = lbY + 38 + i * 24
          ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(lbX + 18, yy - 2, 5, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = isMe ? '#fff' : 'rgba(255,255,255,0.7)'
          ctx.font = `${isMe ? 'bold ' : ''}12px Inter,sans-serif`
          const nameStr = e.name.length > 9 ? e.name.slice(0,9) + '…' : e.name
          ctx.fillText(`${i + 1}. ${nameStr}`, lbX + 28, yy + 3)
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'right'
          ctx.fillText(e.mass, lbX + lbW - 8, yy + 3)
          ctx.textAlign = 'left'
        })
      }

      // HUD: mode badge (battle only)
      if (mode === 'battle' && !winner) {
        const mInfo = MODES.find(m => m.id === mode)
        ctx.fillStyle = mInfo.color + 'cc'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`${mInfo.label.toUpperCase()} · VÒNG ${stateRef.current.roundNum}`, W/2, 22)
        ctx.textAlign = 'left'
      }

      // HUD: Mini-map (battle mode, bottom-right)
      if (mode === 'battle') {
        const MM = 160, MPad = 4, MX = W - MM - 20, MY = H - MM - 20, mscale = MM / WORLD
        ctx.fillStyle = 'rgba(8,9,15,0.84)'
        roundRect(ctx, MX - MPad, MY - MPad - 16, MM + MPad*2, MM + MPad*2 + 16, 10); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = 'bold 9px Inter,sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('BẢN ĐỒ', MX + MM/2, MY - 5)
        ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(MX, MY, MM, MM)
        ctx.strokeStyle = 'rgba(0,240,255,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(MX, MY, MM, MM)
        if (zone) {
          ctx.save()
          ctx.beginPath(); ctx.rect(MX, MY, MM, MM)
          ctx.arc(MX + zone.cx * mscale, MY + zone.cy * mscale, zone.r * mscale, 0, Math.PI*2, true)
          ctx.fillStyle = 'rgba(255,49,49,0.18)'; ctx.fill('evenodd'); ctx.restore()
          ctx.beginPath(); ctx.arc(MX + zone.cx * mscale, MY + zone.cy * mscale, zone.r * mscale, 0, Math.PI*2)
          ctx.strokeStyle = 'rgba(255,49,49,0.75)'; ctx.lineWidth = 1; ctx.stroke()
        }
        for (const p of players) {
          if (!p.alive) continue
          const isMe2 = p.id === myIdRef.current
          ctx.beginPath(); ctx.arc(MX + p.x * mscale, MY + p.y * mscale, isMe2 ? 4 : 2.5, 0, Math.PI*2)
          ctx.fillStyle = p.color; ctx.fill()
          if (isMe2) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke() }
        }
        ctx.textAlign = 'left'
      }

      // HUD: My stats + Mana bar
      if (me) {
        const rank = leaderboard.findIndex(e => e.id === myIdRef.current) + 1
        const mInfo = MODES.find(m => m.id === mode) || MODES[0]
        const isBattle = mode === 'battle'
        const statsH = isBattle ? 104 : 74
        const statsY = H - statsH - 16
        ctx.fillStyle = 'rgba(8,9,15,0.84)'
        roundRect(ctx, 16, statsY, 164, statsH, 12); ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'left'
        ctx.fillText('KHỐI LƯỢNG', 28, statsY + 20)
        ctx.fillStyle = mInfo.color; ctx.font = 'bold 30px Outfit,sans-serif'
        ctx.fillText(myMass, 28, statsY + 48)
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '10px Inter,sans-serif'
        ctx.fillText(rank > 0 ? `Hạng #${rank}/${leaderboard.length}` : 'Chờ leaderboard...', 28, statsY + 66)
        if (isBattle) {
          const myMana = me.mana ?? 100
          const manaY = statsY + 78
          ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '9px Inter,sans-serif'
          ctx.fillText(sprintRef.current && myMana > 0 ? 'MANA  ⚡ ĐANG CHẠY' : 'MANA  [SHIFT]', 28, manaY)
          ctx.fillStyle = 'rgba(255,255,255,0.07)'
          roundRect(ctx, 28, manaY + 5, 136, 8, 3); ctx.fill()
          if (myMana > 0) {
            const manaColor = sprintRef.current ? '#74b9ff' : '#a29bfe'
            ctx.fillStyle = manaColor; ctx.shadowColor = manaColor; ctx.shadowBlur = 6
            roundRect(ctx, 28, manaY + 5, 136 * (myMana / 100), 8, 3); ctx.fill()
            ctx.shadowBlur = 0
          }
        }
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [screen])

  const handleLeave = () => {
    const ws = wsRef.current
    if (ws) {
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'SURVIVAL_LEAVE' }))
      ws.onclose = null
      ws.close()
    }
    wsRef.current = null
    myIdRef.current = null
    setDeathInfo(null)
    setScreen('modeSelect')
  }

  const handleRespawn = () => {
    const ws = wsRef.current
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'SURVIVAL_RESPAWN' }))
    setDeathInfo(null); setScreen('playing')
  }

  if (screen === 'lobby') {
    return (
      <LobbyScreen
        name={playerName} onNameChange={setPlayerName} error={connError}
        onNext={() => { if (!playerName.trim()) setPlayerName('Người chơi'); setScreen('modeSelect') }}
        onBack={() => navigate('/')}
      />
    )
  }

  if (screen === 'modeSelect') {
    return (
      <ModeSelect
        onSelect={mode => {
          const name = playerName.trim() || 'Người chơi'
          connectAndJoin(name, mode)
        }}
        onBack={() => setScreen('lobby')}
      />
    )
  }

  const currentModeInfo = MODES.find(m => m.id === modeRef.current) || MODES[0]

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#08090f', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onMouseMove={e => { mouseRef.current = { x: e.clientX, y: e.clientY } }}
        onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; mouseRef.current = { x: t.clientX, y: t.clientY } }}
      />

      <button onClick={handleLeave} style={{
        position:'fixed', top:16, left:16, zIndex:200,
        background:'rgba(8,9,15,0.85)', border:'1px solid rgba(255,255,255,0.1)',
        color:'rgba(255,255,255,0.7)', borderRadius:10, padding:'8px 14px',
        cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6,
        backdropFilter:'blur(12px)',
      }}>
        <span className="material-symbols-rounded" style={{ fontSize:18 }}>arrow_back</span>
        Thoát
      </button>

      <div style={{
        position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', zIndex:200,
        display:'flex', alignItems:'center', gap:8,
        background:'rgba(8,9,15,0.78)', border:'1px solid rgba(255,255,255,0.07)',
        borderRadius:20, padding:'6px 14px', backdropFilter:'blur(12px)',
      }}>
        <span className="material-symbols-rounded" style={{ fontSize:16, color: currentModeInfo.color }}>{currentModeInfo.icon}</span>
        <span style={{ fontSize:12, color: currentModeInfo.color, fontWeight:600 }}>{currentModeInfo.label}</span>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>·</span>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
          {(stateRef.current.players?.filter(p => p.alive).length ?? 0)} người đang chơi
        </span>
      </div>

      {screen === 'dead' && (
        <div style={{
          position:'fixed', inset:0, zIndex:300,
          background:'rgba(0,0,0,0.78)', backdropFilter:'blur(10px)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            background:'rgba(10,11,20,0.96)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:24, padding:'40px 36px', textAlign:'center',
            maxWidth:360, width:'90%',
            boxShadow:'0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,49,49,0.07)',
          }}>
            <div style={{ fontSize:52, marginBottom:16 }}>💀</div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, marginBottom:8, color:'#f87171' }}>
              Bạn đã bị loại!
            </h2>
            {deathInfo?.killedBy && deathInfo.killedBy !== 'vùng nguy hiểm' && (
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:6 }}>
                Bởi <strong style={{ color:'#fff' }}>{deathInfo.killedBy}</strong>
              </p>
            )}
            {deathInfo?.killedBy === 'vùng nguy hiểm' && (
              <p style={{ color:'rgba(255,71,87,0.8)', fontSize:13, marginBottom:6 }}>☠️ Bị vùng nguy hiểm tiêu diệt</p>
            )}
            {deathInfo?.mass != null && (
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginBottom:4 }}>
                Khối lượng đạt được: <strong style={{ color:'#fdcb6e' }}>{deathInfo.mass}</strong>
              </p>
            )}
            {modeRef.current === 'battle' && (
              <p style={{ color:'rgba(255,255,255,0.38)', fontSize:13, marginBottom:20, marginTop:8 }}>
                Đang chờ vòng tiếp theo bắt đầu tự động...
              </p>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
              {modeRef.current === 'classic' && (
                <button onClick={handleRespawn} style={{
                  background:`linear-gradient(135deg,${currentModeInfo.grad[0]},${currentModeInfo.grad[1]})`,
                  border:'none', color:'#fff', borderRadius:12, padding:'13px 0', width:'100%',
                  fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif',
                }}>
                  ▶ Chơi Lại
                </button>
              )}
              <button onClick={handleLeave} style={{
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                color:'rgba(255,255,255,0.6)', borderRadius:12, padding:'11px 0', width:'100%',
                fontSize:14, cursor:'pointer', fontFamily:'Outfit,sans-serif',
              }}>
                Chọn Chế Độ Khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
