/* ==========================================================================
   AUDIO SYNTHESIZER (WEB AUDIO API)
   ========================================================================== */
import { STATE } from './state.js';

export const SOUNDS = {
    init() {
        if (STATE.audioCtx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            STATE.audioCtx = new AudioContextClass();
        }
    },

    playClick() {
        if (!STATE.soundEnabled) return;
        this.init();
        if (!STATE.audioCtx) return;
        const osc = STATE.audioCtx.createOscillator();
        const gain = STATE.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(STATE.audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, STATE.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, STATE.audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, STATE.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, STATE.audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(STATE.audioCtx.currentTime + 0.08);
    },

    playCountdown(pitch = 500) {
        if (!STATE.soundEnabled) return;
        this.init();
        if (!STATE.audioCtx) return;
        const osc = STATE.audioCtx.createOscillator();
        const gain = STATE.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(STATE.audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, STATE.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, STATE.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, STATE.audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(STATE.audioCtx.currentTime + 0.2);
    },

    playFlip() {
        if (!STATE.soundEnabled) return;
        this.init();
        if (!STATE.audioCtx) return;
        const osc = STATE.audioCtx.createOscillator();
        const gain = STATE.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(STATE.audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, STATE.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, STATE.audioCtx.currentTime + 0.25);
        const filter = STATE.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, STATE.audioCtx.currentTime);
        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);
        gain.gain.setValueAtTime(0.15, STATE.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, STATE.audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(STATE.audioCtx.currentTime + 0.25);
    },

    playWin() {
        if (!STATE.soundEnabled) return;
        this.init();
        if (!STATE.audioCtx) return;
        const now = STATE.audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major
        notes.forEach((freq, idx) => {
            const osc = STATE.audioCtx.createOscillator();
            const gain = STATE.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(STATE.audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(0.15, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.1 + 0.4);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.4);
        });
    },

    playLose() {
        if (!STATE.soundEnabled) return;
        this.init();
        if (!STATE.audioCtx) return;
        const now = STATE.audioCtx.currentTime;
        const notes = [311.13, 293.66, 277.18, 220.00]; // Eb4, D4, Db4, A3
        notes.forEach((freq, idx) => {
            const osc = STATE.audioCtx.createOscillator();
            const gain = STATE.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(STATE.audioCtx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);
            osc.frequency.exponentialRampToValueAtTime(freq - 50, now + idx * 0.15 + 0.3);
            const filter = STATE.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, now);
            osc.disconnect(gain);
            osc.connect(filter);
            filter.connect(gain);
            gain.gain.setValueAtTime(0.15, now + idx * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.15 + 0.3);
            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 0.3);
        });
    },

    playTie() {
        if (!STATE.soundEnabled) return;
        this.init();
        if (!STATE.audioCtx) return;
        const osc = STATE.audioCtx.createOscillator();
        const gain = STATE.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(STATE.audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, STATE.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(261.63, STATE.audioCtx.currentTime + 0.4);
        const lfo = STATE.audioCtx.createOscillator();
        const lfoGain = STATE.audioCtx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(15, STATE.audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(30, STATE.audioCtx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        gain.gain.setValueAtTime(0.2, STATE.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, STATE.audioCtx.currentTime + 0.4);
        lfo.start();
        osc.start();
        lfo.stop(STATE.audioCtx.currentTime + 0.4);
        osc.stop(STATE.audioCtx.currentTime + 0.4);
    }
};
