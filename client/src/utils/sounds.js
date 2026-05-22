/* ==========================================================================
   AUDIO SYNTHESIZER (Web Audio API)
   ========================================================================== */
let audioCtx = null

function ensureCtx() {
  if (audioCtx) return audioCtx
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (AudioContextClass) audioCtx = new AudioContextClass()
  return audioCtx
}

const sounds = {
  get enabled() {
    return _enabled
  },
  set enabled(v) {
    _enabled = v
  },

  init() {
    ensureCtx()
  },

  playClick() {
    const ctx = ensureCtx()
    if (!_enabled || !ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  },

  playCountdown(pitch = 500) {
    const ctx = ensureCtx()
    if (!_enabled || !ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(pitch, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  },

  playFlip() {
    const ctx = ensureCtx()
    if (!_enabled || !ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(80, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  },

  playWin() {
    const ctx = ensureCtx()
    if (!_enabled || !ctx) return
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.1)
      gain.gain.setValueAtTime(0.15, now + idx * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.1 + 0.4)
      osc.start(now + idx * 0.1)
      osc.stop(now + idx * 0.1 + 0.4)
    })
  },

  playLose() {
    const ctx = ensureCtx()
    if (!_enabled || !ctx) return
    const now = ctx.currentTime
    const notes = [311.13, 293.66, 277.18, 220.0]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(600, now)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, now + idx * 0.15)
      osc.frequency.exponentialRampToValueAtTime(freq - 50, now + idx * 0.15 + 0.3)
      gain.gain.setValueAtTime(0.15, now + idx * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.15 + 0.3)
      osc.start(now + idx * 0.15)
      osc.stop(now + idx * 0.15 + 0.3)
    })
  },

  playTie() {
    const ctx = ensureCtx()
    if (!_enabled || !ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(15, ctx.currentTime)
    lfoGain.gain.setValueAtTime(30, ctx.currentTime)
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(330, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(261.63, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    lfo.start()
    osc.start()
    lfo.stop(ctx.currentTime + 0.4)
    osc.stop(ctx.currentTime + 0.4)
  }
}

let _enabled = true

export default sounds
