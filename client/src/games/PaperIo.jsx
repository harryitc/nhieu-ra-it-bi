import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import sounds from '../utils/sounds'

function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  if (import.meta.env.DEV) return `ws://${window.location.host}/ws`
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/`
}

const PALETTE = [
  '#ff4757', '#2ed573', '#1e90ff', '#ffa502',
  '#ff6b81', '#a29bfe', '#00cec9', '#fdcb6e'
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function b64ToBytes(b64) {
  const bin = atob(b64)
  const n = bin.length
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) out[i] = bin.charCodeAt(i)
  return out
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

function LobbyScreen({ name, color, onNameChange, onColorChange, onJoin, onBack, error, takenColors }) {
  return (
    <div className="app-container">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />
      <div className="hub-page animate-fade-in" style={{ maxWidth: 460, width: '100%' }}>
        <header className="app-header">
          <button className="hub-back-btn" onClick={onBack} title="Về trang chủ">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div className="logo-container" style={{ background: 'linear-gradient(135deg,#ff5e00,#bd00ff)' }}>
            <span className="material-symbols-rounded logo-icon">grid_view</span>
          </div>
          <h1 className="app-title" style={{ fontSize: 30 }}>PAPER.IO</h1>
          <p className="app-subtitle">Chiếm đất · Cắt đuôi đối thủ · Thống trị bản đồ</p>
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
                onKeyDown={e => e.key === 'Enter' && onJoin()}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label>Chọn màu</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
              {PALETTE.map(c => {
                const taken = takenColors.has(c) && c !== color
                const selected = c === color
                return (
                  <button
                    key={c} disabled={taken}
                    onClick={() => onColorChange(c)}
                    style={{
                      width: 42, height: 42, borderRadius: 12, cursor: taken ? 'not-allowed' : 'pointer',
                      background: c, border: selected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                      boxShadow: selected ? `0 0 18px ${c}` : 'none',
                      opacity: taken ? 0.25 : 1, transition: 'all 0.15s',
                      position: 'relative'
                    }}
                    title={taken ? 'Màu đã có người chọn' : ''}
                  >
                    {taken && (
                      <span className="material-symbols-rounded" style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22
                      }}>block</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary btn-large btn-glow-effect w-100" onClick={onJoin}
            style={{ background: `linear-gradient(135deg,${color},#bd00ff)` }}>
            <span className="material-symbols-rounded">play_arrow</span>
            Tham Gia Trận
          </button>

          <div style={{
            marginTop: 18, padding: '14px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65
          }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: 600, marginBottom: 6 }}>📖 Cách chơi</p>
            <p style={{ margin: '0 0 4px' }}>• Di chuyển ra ngoài lãnh thổ sẽ để lại <strong style={{ color: '#fff' }}>đuôi</strong>.</p>
            <p style={{ margin: '0 0 4px' }}>• Đụng lại <strong style={{ color: '#fff' }}>đuôi của mình</strong> hoặc <strong style={{ color: '#fff' }}>lãnh thổ</strong> → vùng bao trong tô màu của bạn.</p>
            <p style={{ margin: '0 0 4px' }}>• Đang ở ngoài lãnh thổ mà bị đối thủ đụng trúng → <strong style={{ color: '#ff6b6b' }}>bạn thua</strong>.</p>
            <p style={{ margin: 0 }}>• Tô kín <strong style={{ color: '#fff' }}>100% bản đồ</strong> để chiến thắng!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaperIo() {
  const navigate = useNavigate()

  const [screen,    setScreen]    = useState('lobby')
  const [name,      setName]      = useState('')
  const [color,     setColor]     = useState(PALETTE[0])
  const [connError, setConnError] = useState('')
  const [deathInfo, setDeathInfo] = useState(null)
  const [takenColors, setTakenColors] = useState(new Set())

  const wsRef        = useRef(null)
  const canvasRef    = useRef(null)
  const myIdRef      = useRef(null)
  const mySlotRef    = useRef(-1)
  const cfgRef       = useRef({ grid: 60, cell: 32, tickRate: 15, autoWinPct: 0.55 })
  const stateRef     = useRef({
    tick: 0, roundNum: 1, owner: null, trail: null,
    players: [], leaderboard: [], total: 1, winner: null, resetCountdown: 0
  })
  const prevPosRef   = useRef(new Map())   // id -> {gx, gy} at last tick
  const lastTickAtRef = useRef(performance.now())
  const screenRef    = useRef('lobby')
  const rafRef       = useRef(null)
  const particlesRef = useRef([])          // claim/death particles
  const winnerShownRef = useRef(false)

  useEffect(() => { screenRef.current = screen }, [screen])

  const handleJoin = useCallback(() => {
    setConnError('')
    const pName = name.trim() || 'Người chơi'
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close() }
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws
    ws.onopen = () => {
      sounds.init(); sounds.playClick()
      ws.send(JSON.stringify({ type: 'PAPERIO_JOIN', playerName: pName, color }))
    }
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      switch (msg.type) {
        case 'PAPERIO_JOINED':
          myIdRef.current = msg.playerId
          mySlotRef.current = msg.slot
          cfgRef.current = { grid: msg.grid, cell: msg.cell, tickRate: msg.tickRate, autoWinPct: msg.autoWinPct }
          setScreen('playing')
          break
        case 'PAPERIO_FULL':
          setConnError('Phòng đã đầy (tối đa 12 người). Thử lại sau!')
          break
        case 'PAPERIO_STATE': {
          // Save previous tick player positions for interpolation
          const prev = new Map()
          for (const p of stateRef.current.players) prev.set(p.id, { gx: p.gx, gy: p.gy })
          prevPosRef.current = prev
          lastTickAtRef.current = performance.now()
          stateRef.current = {
            tick: msg.tick,
            roundNum: msg.roundNum,
            owner: b64ToBytes(msg.owner),
            trail: b64ToBytes(msg.trail),
            players: msg.players,
            leaderboard: msg.leaderboard,
            total: msg.total,
            winner: msg.winner,
            resetCountdown: msg.resetCountdown
          }
          // Track which colors are used
          setTakenColors(new Set(msg.players.map(p => p.color)))
          // Emit particles for claim events
          for (const ev of msg.events || []) {
            if (ev.type === 'claim') {
              const p = msg.players.find(pp => pp.slot === ev.slot)
              if (p) {
                spawnClaimBurst(p.gx, p.gy, p.color, ev.count)
                if (p.id === myIdRef.current) sounds.playFlip()
              }
            }
          }
          if (msg.winner && !winnerShownRef.current) {
            if (msg.winner.slot === mySlotRef.current) sounds.playWin()
            else if (mySlotRef.current >= 0) sounds.playLose()
            winnerShownRef.current = true
          }
          if (!msg.winner) winnerShownRef.current = false
          break
        }
        case 'PAPERIO_DIED':
          if (screenRef.current === 'playing') {
            setDeathInfo({ killedBy: msg.killedBy })
            setScreen('dead')
            sounds.playLose()
            spawnDeathBurst()
          }
          break
        case 'PAPERIO_CLAIMED':
          // optional ack — particles already from STATE events
          break
      }
    }
    ws.onerror = () => setConnError('Không kết nối được máy chủ. Thử lại sau.')
    ws.onclose = () => {
      if (screenRef.current === 'playing' || screenRef.current === 'dead') {
        setScreen('lobby')
      }
    }
  }, [name, color])

  const spawnClaimBurst = (gx, gy, c, count) => {
    const intensity = Math.min(40, Math.max(8, Math.floor(count / 4)))
    for (let i = 0; i < intensity; i++) {
      particlesRef.current.push({
        gx: gx + 0.5, gy: gy + 0.5,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.8) * 0.18,
        life: 1, color: c, size: 4 + Math.random() * 3
      })
    }
  }

  const spawnDeathBurst = () => {
    const me = stateRef.current.players.find(p => p.id === myIdRef.current)
    if (!me) return
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2
      particlesRef.current.push({
        gx: me.gx + 0.5, gy: me.gy + 0.5,
        vx: Math.cos(a) * (0.15 + Math.random() * 0.15),
        vy: Math.sin(a) * (0.15 + Math.random() * 0.15),
        life: 1, color: me.color, size: 3 + Math.random() * 4
      })
    }
  }

  // Send input from keyboard / touch
  useEffect(() => {
    if (screen !== 'playing') return
    const sendDir = (dir) => {
      const ws = wsRef.current
      if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'PAPERIO_INPUT', dir }))
    }
    const onKey = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowup' || k === 'w') sendDir('up')
      else if (k === 'arrowdown' || k === 's') sendDir('down')
      else if (k === 'arrowleft' || k === 'a') sendDir('left')
      else if (k === 'arrowright' || k === 'd') sendDir('right')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)

    // touch swipe
    let tStartX = 0, tStartY = 0
    const onTouchStart = (e) => { const t = e.touches[0]; tStartX = t.clientX; tStartY = t.clientY }
    const onTouchEnd = (e) => {
      const t = e.changedTouches[0]
      const dx = t.clientX - tStartX, dy = t.clientY - tStartY
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return
      if (Math.abs(dx) > Math.abs(dy)) sendDir(dx > 0 ? 'right' : 'left')
      else sendDir(dy > 0 ? 'down' : 'up')
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [screen])

  // Render loop
  useEffect(() => {
    if (screen !== 'playing' && screen !== 'dead') {
      cancelAnimationFrame(rafRef.current); return
    }
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize(); window.addEventListener('resize', resize)

    const render = (now) => {
      const W = window.innerWidth, H = window.innerHeight
      const cfg = cfgRef.current
      const N = cfg.grid
      const CELL = cfg.cell
      const st = stateRef.current
      const { owner, trail, players, leaderboard, total, winner, resetCountdown } = st

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0a0c14'; ctx.fillRect(0, 0, W, H)

      if (!owner) {
        // waiting for first state
        ctx.fillStyle = '#fff'; ctx.font = '14px Inter,sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('Đang vào trận...', W/2, H/2)
        rafRef.current = requestAnimationFrame(render); return
      }

      // ── Camera follows my player with interpolation ──
      const me = players.find(p => p.id === myIdRef.current)
      const prev = me ? prevPosRef.current.get(me.id) : null
      const tickInterval = 1000 / cfg.tickRate
      const alpha = Math.max(0, Math.min(1, (now - lastTickAtRef.current) / tickInterval))
      let camCX, camCY
      if (me) {
        const ipx = prev ? prev.gx + (me.gx - prev.gx) * alpha : me.gx
        const ipy = prev ? prev.gy + (me.gy - prev.gy) * alpha : me.gy
        camCX = (ipx + 0.5) * CELL
        camCY = (ipy + 0.5) * CELL
      } else {
        camCX = N * CELL / 2; camCY = N * CELL / 2
      }
      const camX = camCX - W / 2
      const camY = camCY - H / 2

      ctx.save(); ctx.translate(-camX, -camY)

      // ── Background grid lines ──
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
      const gx0 = Math.max(0, Math.floor(camX / CELL))
      const gy0 = Math.max(0, Math.floor(camY / CELL))
      const gx1 = Math.min(N, Math.ceil((camX + W) / CELL))
      const gy1 = Math.min(N, Math.ceil((camY + H) / CELL))
      for (let x = gx0; x <= gx1; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, gy0 * CELL); ctx.lineTo(x * CELL, gy1 * CELL); ctx.stroke()
      }
      for (let y = gy0; y <= gy1; y++) {
        ctx.beginPath(); ctx.moveTo(gx0 * CELL, y * CELL); ctx.lineTo(gx1 * CELL, y * CELL); ctx.stroke()
      }

      // ── World border ──
      ctx.strokeStyle = 'rgba(0,240,255,0.35)'; ctx.lineWidth = 4
      ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 16
      ctx.strokeRect(0, 0, N * CELL, N * CELL); ctx.shadowBlur = 0

      // slot -> color map
      const slotColor = new Array(16).fill(null)
      for (const p of players) slotColor[p.slot] = p.color

      // ── Owned territory ──
      for (let y = gy0; y < gy1; y++) {
        for (let x = gx0; x < gx1; x++) {
          const idx = y * N + x
          const o = owner[idx]
          if (o === 0) continue
          const c = slotColor[o - 1]
          if (!c) continue
          ctx.fillStyle = c + '55'
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
        }
      }

      // ── Owned-territory borders (visible outline around each color block) ──
      ctx.lineWidth = 2
      for (let y = gy0; y < gy1; y++) {
        for (let x = gx0; x < gx1; x++) {
          const idx = y * N + x
          const o = owner[idx]
          if (o === 0) continue
          const c = slotColor[o - 1]
          if (!c) continue
          ctx.strokeStyle = c
          // draw edges where neighbor differs
          if (x === 0 || owner[idx - 1] !== o) {
            ctx.beginPath(); ctx.moveTo(x * CELL, y * CELL); ctx.lineTo(x * CELL, (y + 1) * CELL); ctx.stroke()
          }
          if (x === N - 1 || owner[idx + 1] !== o) {
            ctx.beginPath(); ctx.moveTo((x + 1) * CELL, y * CELL); ctx.lineTo((x + 1) * CELL, (y + 1) * CELL); ctx.stroke()
          }
          if (y === 0 || owner[idx - N] !== o) {
            ctx.beginPath(); ctx.moveTo(x * CELL, y * CELL); ctx.lineTo((x + 1) * CELL, y * CELL); ctx.stroke()
          }
          if (y === N - 1 || owner[idx + N] !== o) {
            ctx.beginPath(); ctx.moveTo(x * CELL, (y + 1) * CELL); ctx.lineTo((x + 1) * CELL, (y + 1) * CELL); ctx.stroke()
          }
        }
      }

      // ── Trails ──
      for (let y = gy0; y < gy1; y++) {
        for (let x = gx0; x < gx1; x++) {
          const idx = y * N + x
          const t = trail[idx]
          if (t === 0) continue
          const c = slotColor[t - 1]
          if (!c) continue
          // outer glow
          ctx.fillStyle = c + 'AA'
          ctx.fillRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8)
          // inner bright
          ctx.fillStyle = c
          ctx.fillRect(x * CELL + CELL/2 - 3, y * CELL + CELL/2 - 3, 6, 6)
        }
      }

      // ── Particles (claim / death) ──
      const dt = 1 / 60
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const pa = particles[i]
        pa.gx += pa.vx; pa.gy += pa.vy
        pa.vy += 0.012 // gravity
        pa.life -= dt * 0.7
        if (pa.life <= 0) { particles.splice(i, 1); continue }
        ctx.globalAlpha = Math.max(0, pa.life)
        ctx.fillStyle = pa.color
        ctx.beginPath()
        ctx.arc(pa.gx * CELL, pa.gy * CELL, pa.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // ── Players ──
      for (const p of players) {
        if (!p.alive) continue
        const prev = prevPosRef.current.get(p.id)
        const ipx = prev ? prev.gx + (p.gx - prev.gx) * alpha : p.gx
        const ipy = prev ? prev.gy + (p.gy - prev.gy) * alpha : p.gy
        const cx = (ipx + 0.5) * CELL
        const cy = (ipy + 0.5) * CELL
        const isMe = p.id === myIdRef.current
        const r = CELL * 0.42

        // outer glow
        ctx.shadowColor = p.color; ctx.shadowBlur = isMe ? 22 : 12
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0

        // white ring for me
        if (isMe) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 3
          ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.stroke()
        }

        // eye direction indicator
        const dirDX = { up: 0, down: 0, left: -1, right: 1 }[p.dir] || 0
        const dirDY = { up: -1, down: 1, left: 0, right: 0 }[p.dir] || 0
        ctx.fillStyle = '#0a0c14'
        ctx.beginPath(); ctx.arc(cx + dirDX * r * 0.4, cy + dirDY * r * 0.4, r * 0.22, 0, Math.PI * 2); ctx.fill()

        // name tag
        const nameStr = (p.isBot ? '🤖 ' : '') + p.name
        ctx.font = `bold ${Math.max(11, CELL * 0.42)}px Inter,sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
        ctx.fillStyle = '#fff'
        ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 4
        ctx.fillText(nameStr, cx, cy - r - 5)
        ctx.shadowBlur = 0
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      }

      ctx.restore()

      // ── HUD: Leaderboard ──
      const lbW = 200
      const lbH = 38 + leaderboard.length * 24 + 8
      const lbX = W - lbW - 16, lbY = 16
      ctx.fillStyle = 'rgba(8,9,15,0.84)'
      roundRect(ctx, lbX, lbY, lbW, lbH, 12); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
      roundRect(ctx, lbX, lbY, lbW, lbH, 12); ctx.stroke()
      ctx.fillStyle = 'rgba(0,240,255,0.75)'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.textAlign = 'left'
      ctx.fillText('BẢNG XẾP HẠNG · ' + total + ' Ô', lbX + 12, lbY + 20)
      leaderboard.forEach((e, i) => {
        const yy = lbY + 38 + i * 24
        const isMe = e.id === myIdRef.current
        ctx.fillStyle = e.color
        ctx.beginPath(); ctx.arc(lbX + 18, yy - 2, 5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = isMe ? '#fff' : 'rgba(255,255,255,0.72)'
        ctx.font = `${isMe ? 'bold ' : ''}12px Inter,sans-serif`
        const nameStr = e.name.length > 10 ? e.name.slice(0, 10) + '…' : e.name
        ctx.fillText(`${i + 1}. ${nameStr}`, lbX + 28, yy + 3)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'right'
        const pct = ((e.ter / total) * 100).toFixed(1)
        ctx.fillText(pct + '%', lbX + lbW - 8, yy + 3)
        ctx.textAlign = 'left'
      })

      // ── HUD: Minimap ──
      const miniSize = 152
      const miniX = W - miniSize - 16, miniY = lbY + lbH + 12
      ctx.fillStyle = 'rgba(8,9,15,0.84)'
      roundRect(ctx, miniX, miniY, miniSize, miniSize + 24, 12); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      roundRect(ctx, miniX, miniY, miniSize, miniSize + 24, 12); ctx.stroke()
      ctx.fillStyle = 'rgba(0,240,255,0.75)'; ctx.font = 'bold 10px Inter,sans-serif'
      ctx.fillText('BẢN ĐỒ', miniX + 12, miniY + 16)
      const mapPad = 10
      const mapW = miniSize - mapPad * 2
      const cellPx = mapW / N
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.fillRect(miniX + mapPad, miniY + 22, mapW, mapW)
      // draw owner grid into minimap (sample every cell for tiny canvas)
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const idx = y * N + x
          const o = owner[idx]
          if (o === 0) continue
          const c = slotColor[o - 1]
          if (!c) continue
          ctx.fillStyle = c + 'BB'
          ctx.fillRect(miniX + mapPad + x * cellPx, miniY + 22 + y * cellPx, Math.ceil(cellPx), Math.ceil(cellPx))
        }
      }
      // draw player heads
      for (const p of players) {
        if (!p.alive) continue
        const isMe = p.id === myIdRef.current
        ctx.fillStyle = isMe ? '#fff' : p.color
        ctx.beginPath()
        ctx.arc(miniX + mapPad + (p.gx + 0.5) * cellPx, miniY + 22 + (p.gy + 0.5) * cellPx, isMe ? 3 : 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── HUD: My stats ──
      if (me) {
        const myEntry = leaderboard.find(e => e.id === myIdRef.current)
        const myTer = myEntry ? myEntry.ter : 0
        const pct = (myTer / total) * 100
        const targetPct = cfg.autoWinPct * 100
        ctx.fillStyle = 'rgba(8,9,15,0.84)'
        roundRect(ctx, 16, H - 100, 240, 84, 12); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'
        roundRect(ctx, 16, H - 100, 240, 84, 12); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px Inter,sans-serif'
        ctx.fillText('LÃNH THỔ', 30, H - 80)
        ctx.fillStyle = color; ctx.font = 'bold 30px Outfit,sans-serif'
        ctx.fillText(pct.toFixed(1) + '%', 30, H - 50)
        // progress bar
        const bX = 30, bY = H - 32, bW = 212, bH = 8
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(ctx, bX, bY, bW, bH, 4); ctx.fill()
        const fillPct = Math.min(1, pct / targetPct)
        if (fillPct > 0) {
          ctx.fillStyle = color
          roundRect(ctx, bX, bY, bW * fillPct, bH, 4); ctx.fill()
        }
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(`Mục tiêu ${targetPct}%`, bX + bW, H - 8)
        ctx.textAlign = 'left'
      }

      // ── HUD: round + player count top-center ──
      const aliveCount = players.filter(p => p.alive).length
      ctx.fillStyle = 'rgba(8,9,15,0.78)'
      roundRect(ctx, W / 2 - 110, 16, 220, 30, 14); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      roundRect(ctx, W / 2 - 110, 16, 220, 30, 14); ctx.stroke()
      ctx.fillStyle = '#ffa502'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(`PAPER.IO · VÒNG ${st.roundNum} · ${aliveCount} người đang chơi`, W / 2, 35)
      ctx.textAlign = 'left'

      // ── Winner banner ──
      if (winner) {
        const bH = 100
        ctx.fillStyle = 'rgba(8,9,15,0.93)'; ctx.fillRect(0, H / 2 - bH / 2 - 10, W, bH + 20)
        ctx.font = 'bold 32px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle = winner.color; ctx.shadowColor = winner.color; ctx.shadowBlur = 28
        ctx.fillText(`🏆  ${winner.name} thống trị (${winner.pct}%)!`, W / 2, H / 2 - 10)
        ctx.shadowBlur = 0
        if (resetCountdown > 0) {
          ctx.font = '14px Inter,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.fillText(`Vòng mới sau ${resetCountdown}s...`, W / 2, H / 2 + 28)
        }
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [screen, color])

  const handleLeave = () => {
    const ws = wsRef.current
    if (ws) { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'PAPERIO_LEAVE' })); ws.close() }
    navigate('/')
  }

  const handleRespawn = () => {
    const ws = wsRef.current
    if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'PAPERIO_RESPAWN' }))
    setDeathInfo(null); setScreen('playing')
  }

  if (screen === 'lobby') {
    return (
      <LobbyScreen
        name={name} color={color}
        onNameChange={setName} onColorChange={setColor}
        onJoin={handleJoin} onBack={() => navigate('/')}
        error={connError}
        takenColors={takenColors}
      />
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#08090f', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      <button onClick={handleLeave} style={{
        position: 'fixed', top: 16, left: 16, zIndex: 200,
        background: 'rgba(8,9,15,0.85)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '8px 14px',
        cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
        backdropFilter: 'blur(12px)'
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>arrow_back</span>
        Thoát
      </button>

      {/* Controls hint bottom-center */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
        background: 'rgba(8,9,15,0.78)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: '6px 16px', backdropFilter: 'blur(12px)',
        fontSize: 11, color: 'rgba(255,255,255,0.55)',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>WASD</span>
        <span>hoặc</span>
        <span style={{ color: '#fff', fontWeight: 600 }}>↑↓←→</span>
        <span>·</span>
        <span>vuốt trên di động</span>
      </div>

      {screen === 'dead' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(10,11,20,0.96)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '40px 36px', textAlign: 'center',
            maxWidth: 360, width: '90%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,49,49,0.07)'
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>💀</div>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#f87171' }}>
              Bạn đã chết!
            </h2>
            {deathInfo?.killedBy && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 18 }}>
                {deathInfo.killedBy === 'va biên'
                  ? 'Bạn đã đụng phải biên giới!'
                  : deathInfo.killedBy === 'va chạm'
                  ? 'Va chạm trực diện ngoài lãnh thổ!'
                  : (<>Bị <strong style={{ color: '#fff' }}>{deathInfo.killedBy}</strong> đụng trúng</>)
                }
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button onClick={handleRespawn} style={{
                background: `linear-gradient(135deg,${color},#bd00ff)`,
                border: 'none', color: '#fff', borderRadius: 12, padding: '13px 0', width: '100%',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit,sans-serif'
              }}>
                ▶ Chơi Lại
              </button>
              <button onClick={handleLeave} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '11px 0', width: '100%',
                fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit,sans-serif'
              }}>
                Về Trang Chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
