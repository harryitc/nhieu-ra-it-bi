/* ==========================================================================
   CONFETTI PARTICLE SYSTEM (High-performance Canvas)
   ========================================================================== */
export class ConfettiManager {
  constructor() {
    this.canvas = null
    this.ctx = null
    this.particles = []
    this.isActive = false
    this.animationFrameId = null
  }

  createCanvas(parentElement) {
    if (this.canvas) this.canvas.remove()
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'confetti-canvas'
    parentElement.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')
    this.resize()
    this._resizeHandler = () => this.resize()
    window.addEventListener('resize', this._resizeHandler)
  }

  resize() {
    if (!this.canvas || !this.canvas.parentElement) return
    const rect = this.canvas.parentElement.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height
  }

  spawnAround(x, y, count = 25) {
    const colors = ['#00f0ff', '#bd00ff', '#ffdf00', '#39ff14', '#ff007f', '#ff5e00']
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.7) * 8 - 4,
        gravity: 0.18,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        decay: Math.random() * 0.015 + 0.01
      })
    }
    if (!this.isActive) {
      this.isActive = true
      this.animate()
    }
  }

  animate() {
    if (!this.isActive || !this.ctx) return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.rotation += p.rotationSpeed
      p.opacity -= p.decay
      if (p.opacity <= 0 || p.y > this.canvas.height) {
        this.particles.splice(i, 1)
        continue
      }
      this.ctx.save()
      this.ctx.translate(p.x, p.y)
      this.ctx.rotate((p.rotation * Math.PI) / 180)
      this.ctx.fillStyle = p.color
      this.ctx.globalAlpha = p.opacity
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      this.ctx.restore()
    }
    if (this.particles.length === 0) {
      this.isActive = false
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    } else {
      this.animationFrameId = requestAnimationFrame(() => this.animate())
    }
  }

  stop() {
    this.isActive = false
    this.particles = []
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler)
  }
}
