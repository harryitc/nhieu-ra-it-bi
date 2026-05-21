/* ==========================================================================
   CLIENT STATE
   ========================================================================== */
const STATE = {
    socket: null,
    roomCode: null,
    myPlayer: null, // { id, name, color, isHost }
    players: [],    // Array of sanitized players from server
    currentMode: 'majority-out',
    maxChanges: 0,   // Maximum times a player can change their choice
    choiceChanges: 0, // Number of times local player changed choice in current round
    myChoice: null,
    soundEnabled: true,
    isCountingDown: false,
    audioCtx: null,
    chatExpanded: true,
    unreadMessages: 0,
    matchHistory: [],
    playerStats: {},
    deliberateLeave: false
};

// SVG Hand Assets (Identical to previous optimized premium versions)
const HAND_SVGS = {
    sấp: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-sap" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#3a3d52" />
                <stop offset="100%" stop-color="#1b1c25" />
            </linearGradient>
            <filter id="glow-sap" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-sap)" stroke="#ff3131" stroke-width="1.5" />
        <path d="M28,80 C28,58 32,50 36,46 C36,46 35,24 38,20 C40.5,17.5 43,20 43,30 L43,44 C43,44 45.5,18 48,15 C50.5,13.5 53,16 53,28 L53,42 C53,42 55.5,15 58,12 C60.5,10.5 63,13 63,28 L63,44 C63,44 65.5,20 68,18 C70.5,16.5 73,20 73,36 L73,55 C73,66 69,80 50,80 Z" fill="url(#grad-sap)" stroke="#ff3131" stroke-width="2" filter="url(#glow-sap)" />
        <path d="M28,68 C20,62 13,54 18,48 C22.5,43 27.5,54 29.5,59 Z" fill="url(#grad-sap)" stroke="#ff3131" stroke-width="2" />
        <circle cx="39.5" cy="46" r="2.5" fill="#ff3131" opacity="0.6" />
        <circle cx="48" cy="42" r="2.5" fill="#ff3131" opacity="0.6" />
        <circle cx="58" cy="42" r="2.5" fill="#ff3131" opacity="0.6" />
        <circle cx="68" cy="44" r="2.5" fill="#ff3131" opacity="0.6" />
    </svg>`,

    ngửa: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-ngua" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="100%" stop-color="#e0f2fe" />
            </linearGradient>
            <filter id="glow-ngua" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-ngua)" stroke="#00f0ff" stroke-width="1.5" />
        <path d="M28,80 C28,58 32,52 36,48 C36,48 35,26 38,22 C40.5,19 43,22 43,33 L43,46 C43,46 45.5,22 48,18 C50.5,15.5 53,18 53,30 L53,44 C53,44 55.5,20 58,16 C60.5,14 63,16 63,30 L63,46 C63,46 65.5,24 68,20 C70.5,18 73,22 73,38 L73,57 C73,67 69,80 50,80 Z" fill="url(#grad-ngua)" stroke="#00f0ff" stroke-width="2" filter="url(#glow-ngua)" />
        <path d="M28,68 C17,62 10,57 14,49 C18,41 24.5,52 28.5,60 Z" fill="url(#grad-ngua)" stroke="#00f0ff" stroke-width="2" />
        <path d="M36,60 C42,64 54,64 62,54" fill="none" stroke="#ff007f" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
        <path d="M40,53 C47,50 56,56 66,56" fill="none" stroke="#ff007f" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
        <path d="M32,71 C44,73 57,71 65,62" fill="none" stroke="#ff007f" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
    </svg>`,

    ẩn: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-an" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffe600" />
                <stop offset="100%" stop-color="#ff8c00" />
            </linearGradient>
            <filter id="glow-an" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path d="M40,95 L60,95 L57,80 L43,80 Z" fill="url(#grad-an)" stroke="#ffe600" stroke-width="1.5" />
        <path d="M30,80 C24,80 20,74 20,62 C20,50 26,45 35,45 L65,45 C74,45 80,50 80,62 C80,74 76,80 70,80 Z" fill="url(#grad-an)" stroke="#ffffff" stroke-width="2" filter="url(#glow-an)" />
        <path d="M30,45 C30,35 38,35 38,45" fill="none" stroke="#000" stroke-width="2" opacity="0.2" />
        <path d="M42,45 C42,35 50,35 50,45" fill="none" stroke="#000" stroke-width="2" opacity="0.2" />
        <path d="M54,45 C54,35 62,35 62,45" fill="none" stroke="#000" stroke-width="2" opacity="0.2" />
        <path d="M66,45 C66,35 74,35 74,45" fill="none" stroke="#000" stroke-width="2" opacity="0.2" />
        <path d="M26,62 C20,58 23,50 32,53 Z" fill="url(#grad-an)" stroke="#ffffff" stroke-width="1.5" />
    </svg>`,

    búa: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-bua" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ff9f43" />
                <stop offset="100%" stop-color="#ff5e00" />
            </linearGradient>
            <filter id="glow-bua" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-bua)" stroke="#ff5e00" stroke-width="1.5" />
        <path d="M32,80 C32,58 35,50 38,46 C38,46 36,36 40,36 C44,36 44,46 44,46 C44,46 44,34 48,34 C52,34 52,46 52,46 C52,46 52,32 56,32 C60,32 60,46 60,46 C60,46 60,34 64,34 C68,34 68,48 68,55 C68,66 64,80 50,80 Z" fill="url(#grad-bua)" stroke="#ff5e00" stroke-width="2" filter="url(#glow-bua)" />
        <path d="M32,68 C24,62 17,54 22,48 C26.5,43 31.5,54 33.5,59 Z" fill="url(#grad-bua)" stroke="#ff5e00" stroke-width="2" />
        <circle cx="41.5" cy="46" r="2.5" fill="#ff5e00" opacity="0.6" />
        <circle cx="49" cy="42" r="2.5" fill="#ff5e00" opacity="0.6" />
        <circle cx="57" cy="42" r="2.5" fill="#ff5e00" opacity="0.6" />
    </svg>`,

    kéo: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-keo" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f368e0" />
                <stop offset="100%" stop-color="#bd00ff" />
            </linearGradient>
            <filter id="glow-keo" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-keo)" stroke="#bd00ff" stroke-width="1.5" />
        <path d="M30,80 C30,62 33,52 38,48 C38,48 35,16 40,16 C45,16 46,30 46,42 L47,42 C47,30 48,12 53,12 C58,12 59,28 59,42 C59,42 61,42 63,44 C65,28 66,28 70,36 C70,44 68,54 68,57 C68,67 64,80 50,80 Z" fill="url(#grad-keo)" stroke="#bd00ff" stroke-width="2" filter="url(#glow-keo)" />
        <path d="M30,68 C20,62 13,54 18,48 C22.5,43 27.5,54 29.5,59 Z" fill="url(#grad-keo)" stroke="#bd00ff" stroke-width="2" />
    </svg>`,

    bao: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-bao" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a4b0be" />
                <stop offset="100%" stop-color="#39ff14" />
            </linearGradient>
            <filter id="glow-bao" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-bao)" stroke="#39ff14" stroke-width="1.5" />
        <path d="M28,80 C28,58 32,52 36,48 C36,48 32,15 37,12 C42,9 43,20 43,33 L43,46 C43,46 42,10 47,8 C52,6 53,16 53,30 L53,44 C53,44 54,8 59,7 C64,6 65,16 65,30 L65,46 C65,46 66,12 71,11 C76,10 77,20 77,38 L75,57 C75,67 69,80 50,80 Z" fill="url(#grad-bao)" stroke="#39ff14" stroke-width="2" filter="url(#glow-bao)" />
        <path d="M28,68 C17,62 10,57 14,49 C18,41 24.5,52 28.5,60 Z" fill="url(#grad-bao)" stroke="#39ff14" stroke-width="2" />
    </svg>`
};

/* ==========================================================================
   AUDIO SYNTHESIZER (WEB AUDIO API)
   ========================================================================== */
const SOUNDS = {
    init() {
        if (STATE.audioCtx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            STATE.audioCtx = new AudioContextClass();
        }
    },

    playClick() {
        if (!STATE.soundEnabled || !STATE.audioCtx) return;
        this.init();
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
        if (!STATE.soundEnabled || !STATE.audioCtx) return;
        this.init();
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
        if (!STATE.soundEnabled || !STATE.audioCtx) return;
        this.init();
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
        if (!STATE.soundEnabled || !STATE.audioCtx) return;
        this.init();
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
        if (!STATE.soundEnabled || !STATE.audioCtx) return;
        this.init();
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
        if (!STATE.soundEnabled || !STATE.audioCtx) return;
        this.init();
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

/* ==========================================================================
   CONFETTI PARTICLE SYSTEM (HIGH PERFORMANCE CANVAS)
   ========================================================================== */
class ConfettiManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.isActive = false;
        this.animationFrameId = null;
    }

    createCanvas(parentElement) {
        if (this.canvas) this.canvas.remove();
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'confetti-canvas';
        parentElement.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (this.canvas) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    }

    spawnAround(x, y, count = 25) {
        const colors = ['#00f0ff', '#bd00ff', '#ffdf00', '#39ff14', '#ff007f', '#ff5e00'];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                size: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.7) * 8 - 4, // Shoot upwards
                gravity: 0.18,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
                decay: Math.random() * 0.015 + 0.01
            });
        }
        if (!this.isActive) {
            this.isActive = true;
            this.animate();
        }
    }

    animate() {
        if (!this.isActive || !this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.rotationSpeed;
            p.opacity -= p.decay;

            if (p.opacity <= 0 || p.y > this.canvas.height) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
        }

        if (this.particles.length === 0) {
            this.isActive = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        }
    }

    stop() {
        this.isActive = false;
        this.particles = [];
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

const CONFETTI = new ConfettiManager();

/* ==========================================================================
   WEBSOCKET COMMUNICATION LOGIC
   ========================================================================== */
function initWebSocket() {
    if (STATE.socket) return;

    // Detect environment dynamically to support local and cloud deployments (Render, Railway, Heroku)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}`;

    STATE.socket = new WebSocket(socketUrl);

    STATE.socket.onopen = () => {
        console.log('Connected to Multiplayer WebSocket Server.');
    };

    STATE.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };

    STATE.socket.onclose = () => {
        console.log('Disconnected from Server.');
        STATE.socket = null;
        
        if (STATE.deliberateLeave) {
            showToast('Bạn đã rời phòng chơi!', 'info');
            
            // Clean up window location search parameters
            const url = new URL(window.location);
            url.searchParams.delete('room');
            window.history.replaceState({}, '', url.toString());
            
            // Reset local state completely
            STATE.roomCode = null;
            STATE.myPlayer = null;
            STATE.players = [];
            STATE.myChoice = null;
            STATE.choiceChanges = 0;
            STATE.isCountingDown = false;
            STATE.matchHistory = [];
            STATE.playerStats = {};
            STATE.deliberateLeave = false;
            
            // Clear lists in HTML
            const lobbyList = document.getElementById('lobby-players-list');
            if (lobbyList) lobbyList.innerHTML = '';
            const historyList = document.getElementById('history-messages-container');
            if (historyList) historyList.innerHTML = '';
            
            // Go home
            showScreen('welcome-screen');
            
            // Re-establish WebSocket connection immediately so they are ready to join/create a room again!
            initWebSocket();
        } else {
            showModalAlert(
                'Mất Kết Nối',
                'Mất kết nối tới máy chủ! Vui lòng bấm Xác Nhận để tải lại trang chủ.',
                'wifi_off',
                () => {
                    window.location.reload();
                }
            );
        }
    };
}

function sendToServer(data) {
    if (STATE.socket && STATE.socket.readyState === WebSocket.OPEN) {
        STATE.socket.send(JSON.stringify(data));
    } else {
        console.warn('Socket not connected. Message ignored:', data);
    }
}

/* ==========================================================================
   INCOMING MESSAGE DISPATCHER
   ========================================================================== */
function handleServerMessage(msg) {
    switch (msg.type) {
        // --- ROOM CREATED ---
        case 'ROOM_CREATED': {
            STATE.roomCode = msg.roomCode;
            STATE.myPlayer = msg.player;
            STATE.maxChanges = msg.maxChanges || 0;
            document.getElementById('lobby-room-code').textContent = msg.roomCode;
            
            const modeTitles = {
                'majority-out': 'Nhiều Ra, Ít Bị (Phổ biến)',
                'white-out': 'Trắng Ra, Đen Bị',
                'black-out': 'Đen Ra, Trắng Bị'
            };
            document.getElementById('lobby-mode-name').textContent = modeTitles[STATE.currentMode];
            
            updateLobbyConfigText();
            showScreen('lobby-screen');
            updateLobbyControls();

            // Show chat & reaction elements
            document.getElementById('app-chat-wrapper').classList.remove('hidden');
            document.getElementById('emoji-reaction-bar').classList.remove('hidden');

            loadStoredHistoryAndStats();
            document.getElementById('app-history-wrapper').classList.remove('hidden');
            break;
        }

        // --- ROOM JOINED ---
        case 'ROOM_JOINED': {
            STATE.roomCode = msg.roomCode;
            STATE.myPlayer = msg.player;
            STATE.currentMode = msg.gameMode;
            STATE.maxChanges = msg.maxChanges || 0;
            document.getElementById('lobby-room-code').textContent = msg.roomCode;
            
            const modeTitles = {
                'majority-out': 'Nhiều Ra, Ít Bị',
                'white-out': 'Trắng Ra, Đen Bị',
                'black-out': 'Đen Ra, Trắng Bị'
            };
            document.getElementById('lobby-mode-name').textContent = modeTitles[msg.gameMode];

            updateLobbyConfigText();

            if (msg.gameState === 'playing' || msg.gameState === 'revealed') {
                document.getElementById('game-room-code-label').textContent = msg.roomCode;
                document.getElementById('current-mode-title').textContent = modeTitles[msg.gameMode];
                
                if (msg.player.isSpectator) {
                    document.getElementById('game-status-text').textContent = 'Bạn đang quan sát trận đấu...';
                    document.getElementById('my-choice-bar').classList.add('hidden');
                }
                
                document.getElementById('btn-reveal-all').classList.add('hidden');
                document.getElementById('player-waiting-reveal-msg').classList.remove('hidden');
                document.getElementById('player-waiting-reveal-msg').innerHTML = `
                    <div class="waiting-spinner"></div>
                    <p>Bạn đang xem trận đấu...</p>
                `;
                
                showScreen('play-screen');
                renderPlayersCircle();
            } else {
                showScreen('lobby-screen');
                updateLobbyControls();
            }

            // Show chat & reaction elements
            document.getElementById('app-chat-wrapper').classList.remove('hidden');
            document.getElementById('emoji-reaction-bar').classList.remove('hidden');

            loadStoredHistoryAndStats();
            document.getElementById('app-history-wrapper').classList.remove('hidden');
            break;
        }

        // --- ROOM CONFIG UPDATED ---
        case 'ROOM_CONFIG_UPDATED': {
            STATE.currentMode = msg.gameMode;
            STATE.maxChanges = msg.maxChanges;
            
            const modeTitles = {
                'majority-out': 'Nhiều Ra, Ít Bị',
                'white-out': 'Trắng Ra, Đen Bị',
                'black-out': 'Đen Ra, Trắng Bị'
            };
            
            const lobbyModeName = document.getElementById('lobby-mode-name');
            if (lobbyModeName) {
                lobbyModeName.textContent = modeTitles[msg.gameMode] || msg.gameMode;
            }
            
            updateLobbyConfigText();
            
            // Pre-fill selects for the host to avoid desynchronization
            if (STATE.myPlayer && STATE.myPlayer.isHost) {
                const selectMode = document.getElementById('host-select-mode');
                const selectChanges = document.getElementById('host-select-changes');
                if (selectMode) selectMode.value = msg.gameMode;
                if (selectChanges) selectChanges.value = msg.maxChanges;
            }
            break;
        }

        // --- PLAYER LIST UPDATE ---
        case 'PLAYER_LIST_UPDATE': {
            STATE.players = msg.players;
            
            // Sync local client player host status in case host migrated
            const me = msg.players.find(p => p.id === STATE.myPlayer.id);
            if (me) {
                STATE.myPlayer.isHost = me.isHost;
                STATE.myPlayer.isSpectator = me.isSpectator || false;
                STATE.myPlayer.isSafe = me.isSafe || false;
            }

            // Render updated state
            renderLobbyPlayers();
            updateLobbyControls();
            
            if (document.getElementById('play-screen').classList.contains('active')) {
                // If game already started, sync real-time hands table circle
                renderPlayersCircle();
            }
            break;
        }

        // --- GAME STARTED ---
        case 'GAME_STARTED': {
            showScreen('play-screen');
            setupActiveRound(msg.roundNumber, msg.roundType, msg.gameMode);
            
            // Init canvas confetti system
            const table = document.querySelector('.game-table');
            CONFETTI.createCanvas(table);
            break;
        }

        // --- CHOICE ACCEPTED ---
        case 'CHOICE_ACCEPTED': {
            STATE.myChoice = msg.choice;
            STATE.choiceChanges = msg.choiceChanges || 0;
            
            const btnSap = document.getElementById('btn-choice-sap');
            const btnNgua = document.getElementById('btn-choice-ngua');
            const btnKeo = document.getElementById('btn-choice-keo');
            const btnBua = document.getElementById('btn-choice-bua');
            const btnBao = document.getElementById('btn-choice-bao');
            
            if (btnSap) btnSap.classList.remove('selected-sap');
            if (btnNgua) btnNgua.classList.remove('selected-ngua');
            if (btnKeo) btnKeo.classList.remove('selected-keo');
            if (btnBua) btnBua.classList.remove('selected-bua');
            if (btnBao) btnBao.classList.remove('selected-bao');
            
            if (msg.choice === 'sấp') {
                if (btnSap) btnSap.classList.add('selected-sap');
            } else if (msg.choice === 'ngửa') {
                if (btnNgua) btnNgua.classList.add('selected-ngua');
            } else if (msg.choice === 'kéo') {
                if (btnKeo) btnKeo.classList.add('selected-keo');
            } else if (msg.choice === 'búa') {
                if (btnBua) btnBua.classList.add('selected-bua');
            } else if (msg.choice === 'bao') {
                if (btnBao) btnBao.classList.add('selected-bao');
            }
            
            updateChoiceChangesUI();
            break;
        }

        // --- REVEAL COUNTDOWN ---
        case 'REVEAL_COUNTDOWN': {
            executeRevealCountdown();
            break;
        }

        // --- REVEAL RESULTS ---
        case 'REVEAL_RESULTS': {
            revealOutcomes(msg.isTie, msg.results, msg.ultimateLoserId, msg.roundNumber, msg.roundType);
            break;
        }

        // --- ROUND RESET ---
        case 'ROUND_RESET': {
            setupActiveRound(msg.roundNumber, msg.roundType);
            CONFETTI.stop();
            break;
        }

        // --- GO TO LOBBY ---
        case 'GO_TO_LOBBY': {
            document.getElementById('result-overlay').classList.remove('active');
            STATE.myChoice = null;
            STATE.isCountingDown = false;
            showScreen('lobby-screen');
            CONFETTI.stop();
            break;
        }

        // --- CHAT MESSAGE ---
        case 'CHAT_MESSAGE': {
            const container = document.getElementById('chat-messages-container');
            if (container) {
                if (msg.playerId === 'system') {
                    const msgRow = document.createElement('div');
                    msgRow.className = 'chat-system-message';
                    msgRow.textContent = msg.message;
                    container.appendChild(msgRow);
                    showToast(msg.message, 'info');
                } else {
                    const isMe = msg.playerId === STATE.myPlayer.id;
                    const msgRow = document.createElement('div');
                    msgRow.className = isMe ? 'chat-msg-row msg-me' : 'chat-msg-row';
                    msgRow.innerHTML = `
                        <div class="chat-msg-sender" style="color: ${msg.playerColor.value}">${msg.playerName}</div>
                        <div class="chat-msg-bubble">${escapeHtml(msg.message)}</div>
                    `;
                    container.appendChild(msgRow);
                }
                container.scrollTop = container.scrollHeight;
                
                if (!STATE.chatExpanded) {
                    STATE.unreadMessages++;
                    const badge = document.getElementById('chat-badge');
                    if (badge) {
                        badge.textContent = STATE.unreadMessages;
                        badge.classList.remove('hidden');
                    }
                }
            }
            break;
        }

        // --- BROADCAST REACTION ---
        case 'BROADCAST_REACTION': {
            const isPlayScreen = document.getElementById('play-screen').classList.contains('active');
            
            if (isPlayScreen) {
                if (msg.targetPlayerId) {
                    // Targeted Reaction on Gameplay table screen
                    const senderNode = document.getElementById(`player-node-${msg.playerId}`);
                    const targetNode = document.getElementById(`player-node-${msg.targetPlayerId}`);
                    
                    if (senderNode && targetNode) {
                        const senderAvatar = senderNode.querySelector('.player-avatar-circle');
                        const targetAvatar = targetNode.querySelector('.player-avatar-circle');
                        
                        if (senderAvatar && targetAvatar) {
                            const senderRect = senderAvatar.getBoundingClientRect();
                            const targetRect = targetAvatar.getBoundingClientRect();
                            
                            const flyingEmoji = document.createElement('div');
                            flyingEmoji.className = 'targeted-flying-emoji';
                            flyingEmoji.textContent = msg.emoji;
                            
                            // Start absolute position on document body at sender's center
                            flyingEmoji.style.left = `${senderRect.left + senderRect.width / 2}px`;
                            flyingEmoji.style.top = `${senderRect.top + senderRect.height / 2}px`;
                            
                            // Compute travel displacements
                            const dx = (targetRect.left + targetRect.width / 2) - (senderRect.left + senderRect.width / 2);
                            const dy = (targetRect.top + targetRect.height / 2) - (senderRect.top + senderRect.height / 2);
                            
                            flyingEmoji.style.setProperty('--dx', `${dx}px`);
                            flyingEmoji.style.setProperty('--dy', `${dy}px`);
                            
                            document.body.appendChild(flyingEmoji);
                            
                            // Play whoosh / reaction sound if enabled
                            if (STATE.soundEnabled) {
                                SOUNDS.playClick();
                            }
                            
                            // Trigger flight transition in next frame
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    flyingEmoji.classList.add('animate-fly');
                                });
                            });
                            
                            // Hit logic after 1s (matching transition duration)
                            setTimeout(() => {
                                flyingEmoji.remove();
                                
                                // Shake avatar on hit
                                targetAvatar.classList.add('avatar-shake');
                                setTimeout(() => {
                                    targetAvatar.classList.remove('avatar-shake');
                                }, 500);
                                
                                // Spawn confetti around target avatar in table canvas coordinates
                                if (CONFETTI.canvas) {
                                    const canvasRect = CONFETTI.canvas.getBoundingClientRect();
                                    const rx = (targetRect.left + targetRect.width / 2) - canvasRect.left;
                                    const ry = (targetRect.top + targetRect.height / 2) - canvasRect.top;
                                    CONFETTI.spawnAround(rx, ry, 15);
                                }
                            }, 1000);
                        }
                    }
                } else {
                    // Untargeted Reaction: Spawn from center of table and drift random directions
                    const table = document.querySelector('.game-table');
                    if (table) {
                        const floatingEmoji = document.createElement('div');
                        floatingEmoji.className = 'floating-emoji-table';
                        floatingEmoji.textContent = msg.emoji;
                        
                        // Drift outwards [-120px, 120px]
                        const driftX = (Math.random() * 240 - 120) + 'px';
                        const driftY = (Math.random() * 240 - 120) + 'px';
                        floatingEmoji.style.setProperty('--drift-x', driftX);
                        floatingEmoji.style.setProperty('--drift-y', driftY);
                        
                        floatingEmoji.style.left = '50%';
                        floatingEmoji.style.top = '50%';
                        
                        table.appendChild(floatingEmoji);
                        
                        setTimeout(() => {
                            floatingEmoji.remove();
                        }, 2500);
                    }
                }
            } else {
                // Flying emoji with player name in lobby or other screen
                const floatingLobby = document.createElement('div');
                floatingLobby.className = 'floating-emoji-lobby';
                
                // Random position horizontally across bottom half of screen
                const leftPos = (15 + Math.random() * 70) + '%';
                floatingLobby.style.left = leftPos;
                
                const randomX = (Math.random() * 100 - 50) + 'px';
                floatingLobby.style.setProperty('--random-x', randomX);
                
                const targetText = msg.targetPlayerName ? ` ➔ ${msg.targetPlayerName}` : '';
                floatingLobby.innerHTML = `
                    <span class="lobby-emoji-symbol">${msg.emoji}</span>
                    <span class="lobby-emoji-name" style="color: ${msg.playerColor.value}">${msg.playerName}${targetText}</span>
                `;
                
                document.body.appendChild(floatingLobby);
                
                setTimeout(() => {
                    floatingLobby.remove();
                }, 2500);
            }
            break;
        }

        // --- SYSTEM ERROR ---
        case 'ERROR': {
            showToast(msg.message, 'error');
            break;
        }
    }
}

// Utility: escape HTML characters
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================================================
   MATCH HISTORY & DATA PERSISTENCE SERVICES
   ========================================================================== */
function loadStoredHistoryAndStats() {
    if (!STATE.roomCode) return;
    try {
        const storedHistory = localStorage.getItem(`matchHistory_${STATE.roomCode}`);
        const storedStats = localStorage.getItem(`playerStats_${STATE.roomCode}`);
        if (storedHistory) {
            STATE.matchHistory = JSON.parse(storedHistory);
        } else {
            STATE.matchHistory = [];
        }
        if (storedStats) {
            STATE.playerStats = JSON.parse(storedStats);
        } else {
            STATE.playerStats = {};
        }
    } catch (err) {
        console.error("Lỗi khi load dữ liệu lịch sử từ localStorage:", err);
        STATE.matchHistory = [];
        STATE.playerStats = {};
    }
    renderTransparentHistoryList();
    renderHistoryModal();
}

function recordMatchHistory(isTie, results, ultimateLoserId, roundNumber, roundType) {
    if (!STATE.roomCode) return;

    // 1. Initialize stats for any player that doesn't have them yet
    results.forEach(res => {
        if (!res.isSpectator) {
            if (!STATE.playerStats[res.id]) {
                STATE.playerStats[res.id] = {
                    id: res.id,
                    name: res.name,
                    color: res.color,
                    roundsPlayed: 0,
                    roundsSafe: 0,
                    roundsLost: 0,
                    tournamentsLost: 0
                };
            } else {
                // Ensure name and color are updated in stats
                STATE.playerStats[res.id].name = res.name;
                STATE.playerStats[res.id].color = res.color;
            }
        }
    });

    // 2. Accumulate stats for actively participating players in this round
    results.forEach(res => {
        if (!res.isSpectator && res.choice !== null && res.choice !== undefined) {
            const stats = STATE.playerStats[res.id];
            if (stats) {
                stats.roundsPlayed++;
                if (!isTie) {
                    if (res.status === 'safe') {
                        stats.roundsSafe++;
                    } else if (res.status === 'loser') {
                        stats.roundsLost++;
                    }
                }
            }
        }
    });

    // 3. Accumulate tournamentsLost for the ultimate loser
    if (ultimateLoserId) {
        if (!STATE.playerStats[ultimateLoserId]) {
            const loserRes = results.find(r => r.id === ultimateLoserId);
            STATE.playerStats[ultimateLoserId] = {
                id: ultimateLoserId,
                name: loserRes ? loserRes.name : 'Người chơi',
                color: loserRes ? loserRes.color : { value: '#ffffff' },
                roundsPlayed: 0,
                roundsSafe: 0,
                roundsLost: 0,
                tournamentsLost: 1
            };
        } else {
            STATE.playerStats[ultimateLoserId].tournamentsLost++;
        }
    }

    // 4. Pack round details
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const roundInfo = {
        roundNumber: roundNumber,
        roundType: roundType,
        time: timeStr,
        isTie: isTie,
        ultimateLoserId: ultimateLoserId,
        details: results.map(res => ({
            id: res.id,
            name: res.name,
            choice: res.choice,
            status: res.status,
            color: res.color,
            isSpectator: res.isSpectator,
            isSafe: res.isSafe
        }))
    };

    STATE.matchHistory.push(roundInfo);

    // Save to localStorage
    try {
        localStorage.setItem(`matchHistory_${STATE.roomCode}`, JSON.stringify(STATE.matchHistory));
        localStorage.setItem(`playerStats_${STATE.roomCode}`, JSON.stringify(STATE.playerStats));
    } catch (e) {
        console.error("Error saving match history to localStorage:", e);
    }

    // 5. Trigger rendering of HUD and modal
    renderTransparentHistoryList();
    renderHistoryModal();
}

function renderTransparentHistoryList() {
    const container = document.getElementById('history-messages-container');
    if (!container) return;

    if (STATE.matchHistory.length === 0) {
        container.innerHTML = '<div class="history-system-message">Chưa có lịch sử vòng đấu.</div>';
        return;
    }

    container.innerHTML = '';

    // Show up to the last 4 rounds
    const recentRounds = STATE.matchHistory.slice(-4);
    recentRounds.forEach(round => {
        const row = document.createElement('div');
        row.className = 'history-msg-row';
        
        let text = '';
        if (round.isTie) {
            text = `Vòng ${round.roundNumber}: Kết quả Hòa! 🤝`;
        } else if (round.ultimateLoserId) {
            const loserName = STATE.playerStats[round.ultimateLoserId]?.name || 'Người chơi';
            text = `Vòng ${round.roundNumber}: Chung cuộc! 💥 ${loserName} thua cuộc!`;
        } else {
            const safeCount = round.details.filter(d => !d.isSpectator && d.choice !== null && d.status === 'safe').length;
            const lostCount = round.details.filter(d => !d.isSpectator && d.choice !== null && d.status === 'loser').length;
            text = `Vòng ${round.roundNumber}: ${safeCount} An Toàn, ${lostCount} Bị Chọn`;
        }

        row.innerHTML = `
            <div class="history-msg-bubble">
                <span style="color: var(--neon-blue); font-weight: bold; margin-right: 5px;">[${round.time}]</span>
                <span>${escapeHtml(text)}</span>
            </div>
        `;
        
        row.addEventListener('click', () => {
            openHistoryDetailModal();
        });
        
        container.appendChild(row);
    });

    container.scrollTop = container.scrollHeight;
}

function renderHistoryModal() {
    const tbody = document.getElementById('history-stats-tbody');
    const timelineContainer = document.getElementById('history-timeline-container');
    if (!tbody || !timelineContainer) return;

    // --- 1. Render Stats Tab ---
    tbody.innerHTML = '';
    const sortedStats = Object.values(STATE.playerStats).sort((a, b) => {
        if (a.tournamentsLost !== b.tournamentsLost) {
            return a.tournamentsLost - b.tournamentsLost;
        }
        if (a.roundsSafe !== b.roundsSafe) {
            return b.roundsSafe - a.roundsSafe;
        }
        return b.roundsPlayed - a.roundsPlayed;
    });

    if (sortedStats.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.4);">
                    Chưa có thống kê người chơi.
                </td>
            </tr>
        `;
    } else {
        sortedStats.forEach(stat => {
            const winRate = stat.roundsPlayed > 0 ? Math.round((stat.roundsSafe / stat.roundsPlayed) * 100) : 0;
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
            
            tr.innerHTML = `
                <td style="padding: 12px 5px; display: flex; align-items: center; gap: 8px;">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${stat.color.value}; box-shadow: 0 0 8px ${stat.color.value};"></span>
                    <span style="color:${stat.color.value}; font-weight: 600;">${escapeHtml(stat.name)}</span>
                </td>
                <td style="padding: 12px 5px; text-align: center; font-weight: 500; color: #10b981;">${stat.roundsSafe}</td>
                <td style="padding: 12px 5px; text-align: center; font-weight: 500; color: #ef4444;">${stat.roundsLost}</td>
                <td style="padding: 12px 5px; text-align: center; font-weight: bold; color: #f43f5e;">${stat.tournamentsLost}</td>
                <td style="padding: 12px 5px; text-align: center; font-weight: bold; color: var(--neon-blue); text-shadow: 0 0 5px rgba(0, 240, 255, 0.3);">${winRate}%</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- 2. Render Timeline/Log Tab ---
    timelineContainer.innerHTML = '';
    
    if (STATE.matchHistory.length === 0) {
        timelineContainer.innerHTML = `
            <div style="text-align: center; padding: 25px; color: rgba(255,255,255,0.4); font-size: 13px;">
                Chưa có nhật ký vòng đấu nào. Chơi một ván để bắt đầu ghi nhận!
            </div>
        `;
        return;
    }

    const timelineRounds = [...STATE.matchHistory].reverse();
    timelineRounds.forEach(round => {
        const card = document.createElement('div');
        card.style.background = 'rgba(255, 255, 255, 0.02)';
        card.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        card.style.borderRadius = '12px';
        card.style.padding = '12px 15px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '8px';

        let titleText = '';
        let headerStyle = '';
        if (round.isTie) {
            titleText = `Vòng ${round.roundNumber} - HÒA 🤝`;
            headerStyle = 'color: #eab308; text-shadow: 0 0 5px rgba(234, 179, 8, 0.3);';
        } else if (round.ultimateLoserId) {
            const ultimateLoserName = STATE.playerStats[round.ultimateLoserId]?.name || 'Người chơi';
            titleText = `Vòng ${round.roundNumber} - KẾT THÚC 👑 (Thua: ${ultimateLoserName})`;
            headerStyle = 'color: #ef4444; text-shadow: 0 0 5px rgba(239, 68, 68, 0.3);';
        } else {
            titleText = `Vòng ${round.roundNumber} - TIẾP TỤC ⚔️`;
            headerStyle = 'color: var(--neon-blue); text-shadow: 0 0 5px var(--neon-blue-glow);';
        }

        const modeName = round.roundType === 'oan-tu-ti' ? 'Oẳn Tù Tì' : 'Nhiều Ra Ít Bị';

        let choicesHtml = '';
        round.details.forEach(det => {
            if (det.isSpectator) return;
            if (det.choice === null || det.choice === undefined) return;
            
            let statusText = '';
            let statusStyle = '';
            
            if (det.status === 'safe') {
                statusText = 'An Toàn';
                statusStyle = 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);';
            } else if (det.status === 'loser') {
                statusText = 'Bị Chọn';
                statusStyle = 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);';
            } else {
                statusText = 'Hòa';
                statusStyle = 'background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.1);';
            }

            const choiceStr = det.choice.charAt(0).toUpperCase() + det.choice.slice(1);

            choicesHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 6px 0; border-bottom: 1px dashed rgba(255,255,255,0.03);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:${det.color.value};"></span>
                        <span style="color: rgba(255,255,255,0.85);">${escapeHtml(det.name)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: rgba(255,255,255,0.5); font-style: italic;">${choiceStr}</span>
                        <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; ${statusStyle}">${statusText}</span>
                    </div>
                </div>
            `;
        });

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
                <span style="font-weight: 700; font-size: 13px; ${headerStyle}">${titleText}</span>
                <span style="font-size: 11px; color: rgba(255, 255, 255, 0.4);">${modeName} @ ${round.time}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                ${choicesHtml}
            </div>
        `;
        timelineContainer.appendChild(card);
    });
}

function openHistoryDetailModal() {
    const modal = document.getElementById('history-detail-modal');
    if (modal) {
        renderHistoryModal();
        modal.style.display = 'flex';
        if (typeof SOUNDS !== 'undefined' && SOUNDS.playClick) {
            SOUNDS.playClick();
        }
    }
}

function closeHistoryDetailModal() {
    const modal = document.getElementById('history-detail-modal');
    if (modal) {
        modal.style.display = 'none';
        if (typeof SOUNDS !== 'undefined' && SOUNDS.playClick) {
            SOUNDS.playClick();
        }
    }
}

function updateLobbyConfigText() {
    const textLimit = document.getElementById('lobby-config-changes-limit');
    if (!textLimit) return;
    
    if (STATE.maxChanges === 0) {
        textLimit.textContent = 'Không cho phép (Chỉ chọn 1 lần)';
    } else if (STATE.maxChanges === 999) {
        textLimit.textContent = 'Không giới hạn (Đổi thoải mái)';
    } else {
        textLimit.textContent = `Tối đa ${STATE.maxChanges} lần`;
    }
}

function updateChoiceChangesUI() {
    const hint = document.getElementById('choice-changes-hint');
    if (!hint) return;
    
    const max = STATE.maxChanges;
    const cur = STATE.choiceChanges;
    const isOanTuTi = STATE.roundType === 'oan-tu-ti';
    const typeLabel = isOanTuTi ? 'búa kéo bao' : 'sấp ngửa';
    
    if (max === 0) {
        hint.textContent = `Thay đổi ${typeLabel}: Không cho phép (Chỉ chọn 1 lần)`;
    } else if (max === 999) {
        hint.textContent = `Thay đổi ${typeLabel}: Vô hạn (Đã đổi ${cur} lần)`;
    } else {
        const left = max - cur;
        hint.textContent = `Thay đổi ${typeLabel}: ${cur}/${max} lần (Còn lại ${left} lần)`;
    }
    
    const btnSap = document.getElementById('btn-choice-sap');
    const btnNgua = document.getElementById('btn-choice-ngua');
    const btnKeo = document.getElementById('btn-choice-keo');
    const btnBua = document.getElementById('btn-choice-bua');
    const btnBao = document.getElementById('btn-choice-bao');
    const buttons = isOanTuTi ? [btnKeo, btnBua, btnBao] : [btnSap, btnNgua];
    const otherButtons = isOanTuTi ? [btnSap, btnNgua] : [btnKeo, btnBua, btnBao];
    
    if (STATE.myChoice !== null && max !== 999 && cur >= max) {
        buttons.forEach(btn => {
            if (btn) {
                btn.classList.add('disabled');
                btn.disabled = true;
            }
        });
        
        // Show lock banner if choice changes are exhausted
        const submitMsgText = document.getElementById('choice-locked-message-text');
        if (submitMsgText) {
            let labelText = '';
            let choiceColor = '#ffffff';
            if (STATE.myChoice === 'sấp') {
                labelText = 'Sấp (Úp tay)';
                choiceColor = 'var(--neon-red)';
            } else if (STATE.myChoice === 'ngửa') {
                labelText = 'Ngửa (Trắng)';
                choiceColor = 'var(--neon-blue)';
            } else if (STATE.myChoice === 'kéo') {
                labelText = 'Kéo (✌️)';
                choiceColor = 'var(--neon-purple)';
            } else if (STATE.myChoice === 'búa') {
                labelText = 'Búa (✊)';
                choiceColor = 'var(--neon-orange)';
            } else if (STATE.myChoice === 'bao') {
                labelText = 'Bao (🖐️)';
                choiceColor = 'var(--neon-green)';
            }
            submitMsgText.innerHTML = `Bạn đã chọn: <strong id="my-submitted-choice-text" style="color: ${choiceColor}">${labelText}</strong> (Đã khóa vĩnh viễn!)`;
        }
        document.getElementById('choice-submitted-msg').classList.remove('hidden');
    } else {
        buttons.forEach(btn => {
            if (btn) {
                btn.classList.remove('disabled');
                btn.disabled = false;
            }
        });
        // Hide lock banner so players can see the buttons
        document.getElementById('choice-submitted-msg').classList.add('hidden');
    }
    
    // Always disable and mute other choices from a different mode
    otherButtons.forEach(btn => {
        if (btn) {
            btn.classList.add('disabled');
            btn.disabled = true;
        }
    });
}

function setupActiveRound(roundNumber, roundType, gameMode) {
    if (gameMode) {
        STATE.currentMode = gameMode;
    }
    STATE.roundNumber = roundNumber || 1;
    STATE.roundType = roundType || 'nhieu-ra-it-bi';
    
    STATE.myChoice = null;
    STATE.choiceChanges = 0;
    STATE.isCountingDown = false;
    
    // UI elements reset
    document.getElementById('game-room-code-label').textContent = STATE.roomCode;
    
    const modeTitles = {
        'majority-out': 'Nhiều Ra, Ít Bị',
        'white-out': 'Trắng Ra, Đen Bị',
        'black-out': 'Đen Ra, Trắng Bị'
    };
    
    const modeTitleText = modeTitles[STATE.currentMode] || 'Nhiều Ra, Ít Bị';
    if (STATE.roundType === 'oan-tu-ti') {
        document.getElementById('current-mode-title').textContent = `Vòng ${STATE.roundNumber}: Chung Kết Oẳn Tù Tì`;
    } else {
        document.getElementById('current-mode-title').textContent = `Vòng ${STATE.roundNumber}: ${modeTitleText}`;
    }
    
    document.getElementById('game-status-text').textContent = 'Đang đợi bạn bè đưa ra lựa chọn...';
    document.getElementById('countdown-text').style.display = 'none';
    document.getElementById('result-overlay').classList.remove('active');
    
    // Toggle Choice Buttons containers
    const sapNguaContainer = document.getElementById('choice-buttons-sap-ngua');
    const oanTuTiContainer = document.getElementById('choice-buttons-oan-tu-ti');
    
    if (STATE.roundType === 'oan-tu-ti') {
        if (sapNguaContainer) sapNguaContainer.classList.add('hidden');
        if (oanTuTiContainer) {
            oanTuTiContainer.classList.remove('hidden');
            oanTuTiContainer.style.display = 'grid'; // Ensure grid layout
        }
    } else {
        if (sapNguaContainer) {
            sapNguaContainer.classList.remove('hidden');
            sapNguaContainer.style.display = 'grid';
        }
        if (oanTuTiContainer) oanTuTiContainer.classList.add('hidden');
    }
    
    // Clean all choice button styles
    const btnSap = document.getElementById('btn-choice-sap');
    const btnNgua = document.getElementById('btn-choice-ngua');
    const btnKeo = document.getElementById('btn-choice-keo');
    const btnBua = document.getElementById('btn-choice-bua');
    const btnBao = document.getElementById('btn-choice-bao');
    
    [btnSap, btnNgua, btnKeo, btnBua, btnBao].forEach(btn => {
        if (btn) {
            btn.classList.remove('selected-sap', 'selected-ngua', 'selected-keo', 'selected-bua', 'selected-bao', 'disabled');
            btn.disabled = false;
        }
    });
    
    // Check if spectator or safe or active
    const isSpectator = STATE.myPlayer.isSpectator;
    const isSafe = STATE.myPlayer.isSafe;
    
    if (isSpectator) {
        document.getElementById('game-status-text').textContent = 'Bạn đang quan sát trận đấu...';
        document.getElementById('my-choice-bar').classList.add('hidden');
        
        document.getElementById('btn-reveal-all').classList.add('hidden');
        const waitMsg = document.getElementById('player-waiting-reveal-msg');
        if (waitMsg) {
            waitMsg.classList.remove('hidden');
            waitMsg.innerHTML = `
                <div class="waiting-spinner"></div>
                <p>Bạn đang xem trận đấu...</p>
            `;
        }
    } else if (isSafe) {
        document.getElementById('game-status-text').textContent = 'Bạn đã AN TOÀN! Đang đợi các người chơi khác...';
        document.getElementById('my-choice-bar').classList.add('hidden');
        
        document.getElementById('btn-reveal-all').classList.add('hidden');
        const waitMsg = document.getElementById('player-waiting-reveal-msg');
        if (waitMsg) {
            waitMsg.classList.remove('hidden');
            waitMsg.innerHTML = `
                <div class="waiting-spinner"></div>
                <p>Bạn đã AN TOÀN! Đang xem trận đấu...</p>
            `;
        }
    } else {
        // Active player!
        document.getElementById('game-status-text').textContent = 'Đang đợi bạn bè đưa ra lựa chọn...';
        document.getElementById('my-choice-bar').classList.remove('hidden');
        document.getElementById('choice-submitted-msg').classList.add('hidden');
        
        updateChoiceChangesUI();
        
        const btnReveal = document.getElementById('btn-reveal-all');
        const waitMsg = document.getElementById('player-waiting-reveal-msg');
        
        if (STATE.myPlayer.isHost) {
            if (btnReveal) {
                btnReveal.classList.remove('hidden');
                btnReveal.classList.add('disabled');
                btnReveal.disabled = true;
            }
            if (waitMsg) waitMsg.classList.add('hidden');
        } else {
            if (btnReveal) btnReveal.classList.add('hidden');
            if (waitMsg) {
                waitMsg.classList.remove('hidden');
                waitMsg.innerHTML = `
                    <div class="waiting-spinner"></div>
                    <p>Đợi lật tay...</p>
                `;
            }
        }
    }
    
    renderPlayersCircle();
}

/* ==========================================================================
   UI RENDERING UTILITIES
   ========================================================================== */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => scr.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function updateLobbyControls() {
    const isHost = STATE.myPlayer.isHost;
    const onlineCount = STATE.players.length;

    const hostCtrl = document.getElementById('host-start-control');
    const waitMsg = document.getElementById('player-wait-control');
    const startBtn = document.getElementById('btn-host-start');

    const configPanel = document.getElementById('host-config-panel');
    if (configPanel) {
        if (isHost) {
            configPanel.classList.remove('hidden');
            // Pre-fill selects for the host to avoid desynchronization
            const selectMode = document.getElementById('host-select-mode');
            const selectChanges = document.getElementById('host-select-changes');
            if (selectMode) selectMode.value = STATE.currentMode;
            if (selectChanges) selectChanges.value = STATE.maxChanges;
        } else {
            configPanel.classList.add('hidden');
        }
    }

    if (isHost) {
        hostCtrl.classList.remove('hidden');
        waitMsg.classList.add('hidden');
        
        // Host can start only if >= 2 players
        if (onlineCount >= 2) {
            startBtn.classList.remove('disabled');
            startBtn.disabled = false;
            document.getElementById('lobby-status-text').textContent = 'Phòng đã sẵn sàng bắt đầu chơi!';
            document.getElementById('lobby-status-text').className = 'info-val text-neon-green';
        } else {
            startBtn.classList.add('disabled');
            startBtn.disabled = true;
            document.getElementById('lobby-status-text').textContent = 'Đang đợi thêm bạn tham gia (cần ít nhất 2)...';
            document.getElementById('lobby-status-text').className = 'info-val text-neon-blue';
        }
    } else {
        hostCtrl.classList.add('hidden');
        waitMsg.classList.remove('hidden');
        document.getElementById('lobby-status-text').textContent = 'Đang trong phòng chờ...';
        document.getElementById('lobby-status-text').className = 'info-val text-neon-blue';
    }
}

function renderLobbyPlayers() {
    const list = document.getElementById('lobby-players-list');
    list.innerHTML = '';
    
    document.getElementById('lobby-player-count').textContent = STATE.players.length;

    STATE.players.forEach(p => {
        const row = document.createElement('div');
        row.className = 'lobby-player-row';
        
        const isMe = p.id === STATE.myPlayer.id;

        row.innerHTML = `
            <div class="lobby-player-left">
                <span class="lobby-player-dot" style="background: ${p.color.value}"></span>
                <span class="lobby-player-name" style="color: ${p.color.value}">${p.name}</span>
            </div>
            <div class="lobby-player-badges">
                ${p.isHost ? '<span class="lobby-badge-role role-host">Chủ phòng</span>' : ''}
                ${isMe ? '<span class="lobby-badge-role role-you">Bạn</span>' : ''}
            </div>
        `;
        list.appendChild(row);
    });
}

function showTargetedReactionPicker(targetPlayer, avatarElement) {
    if (!targetPlayer) return;
    
    const existing = document.getElementById('targeted-reaction-picker');
    if (existing) existing.remove();

    const parentNode = avatarElement.closest('.player-ring-node');
    if (!parentNode) return;

    const picker = document.createElement('div');
    picker.id = 'targeted-reaction-picker';
    picker.className = 'targeted-reaction-picker';
    
    const emojis = ['👍', '🔥', '😂', '😮', '😢', '🎉'];
    emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'targeted-emoji-btn';
        btn.textContent = emoji;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sendToServer({
                type: 'SEND_REACTION',
                emoji: emoji,
                targetPlayerId: targetPlayer.id,
                targetPlayerName: targetPlayer.name
            });
            picker.remove();
        });
        picker.appendChild(btn);
    });

    parentNode.appendChild(picker);

    const clickOutside = (e) => {
        if (!picker.contains(e.target) && !avatarElement.contains(e.target)) {
            picker.remove();
            document.removeEventListener('click', clickOutside);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', clickOutside);
    }, 50);
}

function renderPlayersCircle() {
    const ring = document.getElementById('players-ring');
    ring.innerHTML = '';

    // Filter out spectators so they are not laid out inside the gameplay circle
    const activePlayers = STATE.players.filter(p => !p.isSpectator);
    const N = activePlayers.length;

    // Render spectator list/badge on header
    const spectators = STATE.players.filter(p => p.isSpectator);
    const specBadge = document.getElementById('game-spectators-badge');
    const specCount = document.getElementById('game-spectators-count');
    if (specBadge && specCount) {
        if (spectators.length > 0) {
            specBadge.classList.remove('hidden');
            specCount.textContent = spectators.length;
            specBadge.title = `Người xem: ${spectators.map(s => s.name).join(', ')}`;
        } else {
            specBadge.classList.add('hidden');
        }
    }

    if (N > 0) {
        activePlayers.forEach((player, idx) => {
            // Distribute mathematically in circle layout
            const angle = (2 * Math.PI * idx) / N - Math.PI / 2;
            const radius = 43; 
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            const node = document.createElement('div');
            node.className = player.isSafe ? 'player-ring-node is-safe' : 'player-ring-node';
            node.id = `player-node-${player.id}`;
            node.style.left = `${x}%`;
            node.style.top = `${y}%`;
            
            const isMe = player.id === STATE.myPlayer.id;

            // Card rendering state: unchosen, or chosen (lock fist symbol)
            let cardClass = 'not-chosen';
            let innerIcon = `<span class="material-symbols-rounded hand-icon-secret">question_mark</span>`;

            if (player.hasChosen) {
                cardClass = 'chosen-hidden';
                innerIcon = `<span class="material-symbols-rounded hand-icon-secret">lock</span>`;
            }
            
            if (player.isSafe) {
                cardClass = 'is-safe-card';
                innerIcon = '';
            }

            node.innerHTML = `
                <div class="player-avatar-circle" style="background: rgba(${player.color.rgb}, 0.1); border-color: ${player.color.value}; color: ${player.color.value}">
                    ${player.name.charAt(0).toUpperCase()}
                    ${player.isHost ? '<div class="player-avatar-badge" title="Chủ phòng">★</div>' : ''}
                </div>
                <div class="player-node-name" style="color: ${player.color.value}">${player.name} ${isMe ? '(Bạn)' : ''}</div>
                
                <div class="hand-card ${cardClass}" id="hand-card-${player.id}">
                    <div class="hand-card-inner">
                        <!-- Face A: hidden slot -->
                        <div class="hand-card-front">
                            ${innerIcon}
                        </div>
                        <!-- Face B: revealed hand (to be injected) -->
                        <div class="hand-card-back" id="hand-back-${player.id}"></div>
                    </div>
                    <div class="hand-status-badge">An toàn</div>
                </div>
            `;

            ring.appendChild(node);

            const avatar = node.querySelector('.player-avatar-circle');
            if (avatar) {
                avatar.style.cursor = 'pointer';
                avatar.title = `Bấm để thả reaction cho ${player.name}`;
                avatar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showTargetedReactionPicker(player, avatar);
                });
            }
        });
    }

    // Check if Host can click "LẬT TAY" yet
    if (STATE.myPlayer.isSpectator) {
        document.getElementById('game-status-text').textContent = 'Bạn đang quan sát trận đấu...';
    } else if (STATE.myPlayer.isHost && !STATE.isCountingDown) {
        const btnReveal = document.getElementById('btn-reveal-all');
        const contenders = activePlayers.filter(p => !p.isSafe);
        const allChosen = contenders.every(p => p.hasChosen);
        
        if (allChosen && contenders.length >= 2) {
            btnReveal.classList.remove('disabled');
            btnReveal.disabled = false;
            document.getElementById('game-status-text').textContent = 'TẤT CẢ ĐÃ CHỌN XONG! Hãy bấm lật tay!';
        } else {
            btnReveal.classList.add('disabled');
            btnReveal.disabled = true;
            document.getElementById('game-status-text').textContent = 'Đang đợi bạn bè đặt tay...';
        }
    } else if (!STATE.isCountingDown) {
        // normal player choice status
        const me = activePlayers.find(p => p.id === STATE.myPlayer.id);
        if (me) {
            if (me.isSafe) {
                document.getElementById('game-status-text').textContent = 'Bạn đã AN TOÀN! Đang đợi các người chơi khác...';
            } else if (me.hasChosen) {
                document.getElementById('game-status-text').textContent = 'Đã khóa lựa chọn! Đang đợi người khác...';
            } else {
                document.getElementById('game-status-text').textContent = 'Đang đợi bạn bè đưa ra lựa chọn...';
            }
        }
    }
}

/* ==========================================================================
   GAMEPLAY & REVEAL FLOWS
   ========================================================================== */
function executeRevealCountdown() {
    STATE.isCountingDown = true;

    // Hide reveal buttons during countdown
    document.getElementById('btn-reveal-all').classList.add('hidden');
    document.getElementById('player-waiting-reveal-msg').classList.add('hidden');
    
    // Bottom selection bar hide
    document.getElementById('my-choice-bar').classList.add('hidden');

    const countdownText = document.getElementById('countdown-text');
    countdownText.style.display = 'block';

    const chants = ['BA...', 'HAI...', 'MỘT...', 'LẬT TAY!'];
    let counter = 0;

    countdownText.textContent = chants[counter];
    SOUNDS.playCountdown(400);

    const interval = setInterval(() => {
        counter++;
        if (counter < chants.length) {
            countdownText.textContent = chants[counter];
            if (counter === chants.length - 1) {
                SOUNDS.playCountdown(800);
            } else {
                SOUNDS.playCountdown(400);
            }
        } else {
            clearInterval(interval);
            countdownText.style.display = 'none';
        }
    }, 950);
}

function revealOutcomes(isTie, results, ultimateLoserId, roundNumber, roundType) {
    recordMatchHistory(isTie, results, ultimateLoserId, roundNumber, roundType);
    SOUNDS.playFlip();

    // 1. Render all hand cards 3D flip simultaneously
    results.forEach(res => {
        const handBack = document.getElementById(`hand-back-${res.id}`);
        if (handBack) {
            handBack.innerHTML = HAND_SVGS[res.choice];
            handBack.className = `hand-card-back choice-${res.choice}-reveal`;
        }

        const handCard = document.getElementById(`hand-card-${res.id}`);
        if (handCard) {
            handCard.className = 'hand-card revealed';
        }
    });

    // 2. Render winner/loser visual glowing highlights
    setTimeout(() => {
        results.forEach(res => {
            const node = document.getElementById(`player-node-${res.id}`);
            if (!node || isTie) return;

            const badge = node.querySelector('.hand-status-badge');
            
            if (res.status === 'safe') {
                node.classList.add('is-safe');
                badge.textContent = 'AN TOÀN';
                
                // Explode colored confetti from safe player's hand card!
                const rect = node.getBoundingClientRect();
                const canvasRect = CONFETTI.canvas.getBoundingClientRect();
                const rx = rect.left + rect.width/2 - canvasRect.left;
                const ry = rect.top + rect.height/2 - canvasRect.top;
                
                CONFETTI.spawnAround(rx, ry, 22);
            } else if (res.status === 'loser') {
                node.classList.add('is-loser');
                badge.textContent = 'BỊ CHỌN';
            }
        });
        
        // Show result spotlight dialog modal after 1.2s
        setTimeout(() => {
            triggerResultOverlay(isTie, results, ultimateLoserId, roundNumber, roundType);
        }, 1200);

    }, 800);
}

function triggerResultOverlay(isTie, results, ultimateLoserId, roundNumber, roundType) {
    const overlay = document.getElementById('result-overlay');
    const tieBox = document.getElementById('tie-result-container');
    const decisiveBox = document.getElementById('decisive-result-container');
    const title = document.getElementById('result-title');
    const iconBg = document.getElementById('result-status-icon-bg');
    const icon = document.getElementById('result-status-icon');
    const loserName = document.getElementById('loser-name-display');
    const summaryList = document.getElementById('result-summary-list');

    summaryList.innerHTML = '';

    // Render Host vs Player Action control buttons
    const hostBtns = document.getElementById('host-result-controls');
    const playerMsg = document.getElementById('player-result-controls');

    if (STATE.myPlayer.isHost) {
        hostBtns.classList.remove('hidden');
        playerMsg.classList.add('hidden');
    } else {
        hostBtns.classList.add('hidden');
        playerMsg.classList.remove('hidden');
    }

    const btnPlayAgain = document.getElementById('btn-play-again');

    if (isTie) {
        SOUNDS.playTie();
        tieBox.classList.remove('hidden');
        decisiveBox.classList.add('hidden');
        
        title.textContent = 'Kết quả: HÒA RỒI!';
        iconBg.style.background = 'linear-gradient(135deg, #ffdf00 0%, #ff8c00 100%)';
        iconBg.style.boxShadow = '0 0 25px rgba(255, 223, 0, 0.35)';
        icon.textContent = 'handshake';

        if (btnPlayAgain) {
            btnPlayAgain.innerHTML = `
                <span class="material-symbols-rounded">replay</span>
                Chơi Tiếp Vòng Mới
            `;
        }
        if (playerMsg) {
            playerMsg.innerHTML = `
                <div class="waiting-spinner"></div>
                <p>Đang đợi chủ phòng thiết lập vòng tiếp theo...</p>
            `;
        }
    } else {
        tieBox.classList.add('hidden');
        decisiveBox.classList.remove('hidden');

        const loserHandIcon = decisiveBox.querySelector('.loser-hand-icon');

        if (ultimateLoserId !== null && ultimateLoserId !== undefined) {
            // Tournament is over! Ultimate loser found!
            SOUNDS.playLose(); // play game over/lose sound
            
            title.textContent = '💀 TRẬN ĐẤU KẾT THÚC 💀';
            iconBg.style.background = 'linear-gradient(135deg, #ff3131 0%, #000000 100%)';
            iconBg.style.boxShadow = '0 0 35px rgba(255, 49, 49, 0.6)';
            icon.textContent = 'skull';

            if (loserHandIcon) {
                loserHandIcon.textContent = 'skull';
            }

            const decisiveTitle = decisiveBox.querySelector('.result-subtitle');
            if (decisiveTitle) {
                decisiveTitle.textContent = 'NGƯỜI THUA CHUNG CUỘC';
            }

            const loserBadge = decisiveBox.querySelector('.loser-badge');
            if (loserBadge) {
                loserBadge.textContent = 'CHUNG CUỘC';
            }

            const ultimateLoser = results.find(r => r.id === ultimateLoserId);
            if (ultimateLoser) {
                loserName.textContent = ultimateLoser.name;
                loserName.style.color = ultimateLoser.color.value;
            }

            // Mega multi-confetti explosions across the canvas!
            if (CONFETTI.canvas) {
                const w = CONFETTI.canvas.width;
                const h = CONFETTI.canvas.height;
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        CONFETTI.spawnAround(Math.random() * w, Math.random() * h, 30);
                    }, i * 150);
                }
            }

            if (btnPlayAgain) {
                btnPlayAgain.innerHTML = `
                    <span class="material-symbols-rounded">autorenew</span>
                    Chơi Trận Mới
                `;
            }
            if (playerMsg) {
                playerMsg.innerHTML = `
                    <div class="waiting-spinner"></div>
                    <p>Đang đợi chủ phòng bắt đầu trận mới...</p>
                `;
            }

        } else {
            // Intermediary round results (tournament still in progress)
            SOUNDS.playFlip();

            const displayRound = roundNumber || STATE.roundNumber || 1;
            title.textContent = `Kết quả Vòng ${displayRound}`;
            iconBg.style.background = 'linear-gradient(135deg, #bd00ff 0%, #00f0ff 100%)';
            iconBg.style.boxShadow = '0 0 25px rgba(189, 0, 255, 0.45)';
            icon.textContent = 'check_circle';

            if (loserHandIcon) {
                loserHandIcon.textContent = 'sentiment_very_dissatisfied';
            }

            const decisiveTitle = decisiveBox.querySelector('.result-subtitle');
            if (decisiveTitle) {
                decisiveTitle.textContent = 'NGƯỜI CHƠI CHƯA AN TOÀN';
            }

            const loserBadge = decisiveBox.querySelector('.loser-badge');
            if (loserBadge) {
                loserBadge.textContent = 'CHƯA AN TOÀN';
            }

            const losers = results.filter(r => r.status === 'loser');
            const loserText = losers.map(l => l.name).join(', ');
            
            loserName.textContent = loserText;
            if (losers.length > 0) {
                loserName.style.color = losers[0].color.value;
            }

            if (btnPlayAgain) {
                btnPlayAgain.innerHTML = `
                    <span class="material-symbols-rounded">skip_next</span>
                    Đấu Vòng Tiếp Theo
                `;
            }
            if (playerMsg) {
                playerMsg.innerHTML = `
                    <div class="waiting-spinner"></div>
                    <p>Đang đợi chủ phòng thiết lập vòng tiếp theo...</p>
                `;
            }
        }

        // Render summary items lists
        results.forEach(res => {
            const item = document.createElement('div');
            item.className = 'result-summary-item';
            
            const isSpectator = res.isSpectator;
            const isSafe = res.isSafe;
            const isLoser = res.status === 'loser';
            
            let statusText = 'Đang Chơi';
            let statusClass = 'is-playing';
            
            if (isSpectator) {
                statusText = 'Quan Sát';
                statusClass = 'is-spectator';
            } else if (res.status === 'safe' || isSafe) {
                statusText = 'An Toàn';
                statusClass = 'is-safe';
            } else if (isLoser) {
                statusText = 'Bị Chọn';
                statusClass = 'is-loser';
            }
            
            let choiceText = res.choice ? res.choice.toUpperCase() : 'KHÔNG CHỌN';

            item.innerHTML = `
                <span class="summary-item-name" style="color: ${res.color.value}">${res.name}</span>
                <span class="summary-item-choice">(Chọn: ${choiceText})</span>
                <span class="summary-item-status ${statusClass}">${statusText}</span>
            `;
            summaryList.appendChild(item);
        });
    }

    overlay.classList.add('active');
}

/* ==========================================================================
   EVENT INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Connect WebSocket
    initWebSocket();

    // 2. Check for Direct Join Link parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        const setupGrid = document.querySelector('.setup-layout-grid');
        if (setupGrid) {
            setupGrid.classList.add('direct-join-mode');
        }
        document.getElementById('direct-join-header').style.display = 'block';
        document.getElementById('direct-join-actions-container').style.display = 'block';
        document.getElementById('direct-join-room-code-text').textContent = roomParam.toUpperCase();
        
        document.getElementById('join-room-code').value = roomParam.toUpperCase();
        // Visual focus on name input to guide
        document.getElementById('join-player-name').focus();
    }

    // Direct Join Back Button Listener
    document.getElementById('direct-join-back-btn').addEventListener('click', () => {
        SOUNDS.playClick();
        
        // Remove query parameter cleanly from address bar
        window.history.pushState({}, document.title, window.location.pathname);
        
        // Restore standard grid view
        const setupGrid = document.querySelector('.setup-layout-grid');
        if (setupGrid) {
            setupGrid.classList.remove('direct-join-mode');
        }
        document.getElementById('direct-join-header').style.display = 'none';
        document.getElementById('direct-join-actions-container').style.display = 'none';
        document.getElementById('join-room-code').value = '';
    });

    // 3. Welcome screen selectors binding
    const modeItems = document.querySelectorAll('.mode-select-item');
    modeItems.forEach(item => {
        item.addEventListener('click', (e) => {
            SOUNDS.playClick();
            modeItems.forEach(m => m.classList.remove('active'));
            e.currentTarget.classList.add('active');
            STATE.currentMode = e.currentTarget.getAttribute('data-mode');
        });
    });

    // Host configurations select change listeners
    const selectMode = document.getElementById('host-select-mode');
    const selectChanges = document.getElementById('host-select-changes');
    
    const sendConfigUpdate = () => {
        if (!STATE.myPlayer || !STATE.myPlayer.isHost) return;
        const mode = selectMode.value;
        const maxChanges = parseInt(selectChanges.value, 10);
        sendToServer({
            type: 'UPDATE_ROOM_CONFIG',
            gameMode: mode,
            maxChanges: maxChanges
        });
    };

    if (selectMode) selectMode.addEventListener('change', sendConfigUpdate);
    if (selectChanges) selectChanges.addEventListener('change', sendConfigUpdate);

    // Create Room click
    document.getElementById('btn-create-room').addEventListener('click', () => {
        SOUNDS.playClick();
        const hostName = document.getElementById('create-host-name').value.trim();
        if (!hostName) {
            showToast('Vui lòng điền tên của bạn trước khi tạo phòng!', 'warning');
            return;
        }
        sendToServer({
            type: 'CREATE_ROOM',
            hostName: hostName,
            gameMode: STATE.currentMode
        });
    });

    // Join Room click
    document.getElementById('btn-join-room').addEventListener('click', () => {
        SOUNDS.playClick();
        const pName = document.getElementById('join-player-name').value.trim();
        const rCode = document.getElementById('join-room-code').value.trim().toUpperCase();

        if (!pName) {
            showToast('Vui lòng điền tên của bạn!', 'warning');
            return;
        }
        if (!rCode || rCode.length !== 4) {
            showToast('Vui lòng nhập đầy đủ mã phòng chơi (4 chữ cái)!', 'warning');
            return;
        }

        sendToServer({
            type: 'JOIN_ROOM',
            playerName: pName,
            roomCode: rCode
        });
    });

    // Lobby Copy Room Code click (Copy code ONLY)
    document.getElementById('copy-room-code-btn').addEventListener('click', () => {
        SOUNDS.playClick();
        if (!STATE.roomCode) return;
        
        navigator.clipboard.writeText(STATE.roomCode).then(() => {
            showToast(`Đã sao chép Mã phòng: ${STATE.roomCode}`, 'success');
        }).catch(err => {
            console.error('Copy room code failed:', err);
            showModalAlert('Mã Phòng Chơi', `Mã phòng chơi của bạn là: ${STATE.roomCode}\n(Không thể tự động sao chép)`, 'content_copy');
        });
    });

    // Lobby Copy Room Direct Link click
    document.getElementById('copy-room-link-btn').addEventListener('click', () => {
        SOUNDS.playClick();
        if (!STATE.roomCode) return;
        
        // Generate absolute direct join URL link
        const joinUrl = `${window.location.protocol}//${window.location.host}/?room=${STATE.roomCode}`;
        
        navigator.clipboard.writeText(joinUrl).then(() => {
            showToast('Đã sao chép liên kết vào phòng! Hãy gửi liên kết này cho bạn bè.', 'success');
        }).catch(err => {
            console.error('Copy link failed:', err);
            showModalAlert('Liên Kết Vào Phòng', `Liên kết của bạn là:\n${joinUrl}\n(Hãy bôi đen và sao chép thủ công)`, 'link');
        });
    });

    // Host Start Game click
    document.getElementById('btn-host-start').addEventListener('click', () => {
        SOUNDS.playClick();
        sendToServer({ type: 'START_GAME' });
    });

    // Submitting secret choices
    document.getElementById('btn-choice-sap').addEventListener('click', () => {
        SOUNDS.playClick();
        sendToServer({ type: 'SUBMIT_CHOICE', choice: 'sấp' });
    });
    document.getElementById('btn-choice-ngua').addEventListener('click', () => {
        SOUNDS.playClick();
        sendToServer({ type: 'SUBMIT_CHOICE', choice: 'ngửa' });
    });
    document.getElementById('btn-choice-keo').addEventListener('click', () => {
        SOUNDS.playClick();
        sendToServer({ type: 'SUBMIT_CHOICE', choice: 'kéo' });
    });
    document.getElementById('btn-choice-bua').addEventListener('click', () => {
        SOUNDS.playClick();
        sendToServer({ type: 'SUBMIT_CHOICE', choice: 'búa' });
    });
    document.getElementById('btn-choice-bao').addEventListener('click', () => {
        SOUNDS.playClick();
        sendToServer({ type: 'SUBMIT_CHOICE', choice: 'bao' });
    });

    // Host trigger reveal click
    document.getElementById('btn-reveal-all').addEventListener('click', () => {
        SOUNDS.playClick();
        sendToServer({ type: 'TRIGGER_REVEAL' });
    });

    // Host reset / play again click
    document.getElementById('btn-play-again').addEventListener('click', () => {
        SOUNDS.playClick();
        sendToServer({ type: 'PLAY_AGAIN' });
    });

    // Host back to lobby click from overlay
    document.getElementById('btn-back-setup').addEventListener('click', () => {
        SOUNDS.playClick();
        if (STATE.myPlayer && STATE.myPlayer.isHost) {
            sendToServer({ type: 'BACK_TO_LOBBY' });
        } else {
            document.getElementById('result-overlay').classList.remove('active');
            showScreen('lobby-screen');
            CONFETTI.stop();
        }
    });

    // Audio volume toggle click
    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
        STATE.soundEnabled = !STATE.soundEnabled;
        const icon = document.getElementById('sound-icon');
        if (STATE.soundEnabled) {
            icon.textContent = 'volume_up';
            SOUNDS.playClick();
        } else {
            icon.textContent = 'volume_off';
        }
    });

    // Audio Autoplay policy bypass
    document.body.addEventListener('click', () => {
        SOUNDS.init();
        document.getElementById('sound-init-banner').classList.add('hidden');
    }, { once: true });

    // Load static SVG hand details inside choice panel bottom bars
    document.getElementById('svg-choice-sap-container').innerHTML = HAND_SVGS.sấp;
    document.getElementById('svg-choice-ngua-container').innerHTML = HAND_SVGS.ngửa;
    document.getElementById('svg-choice-keo-container').innerHTML = HAND_SVGS.kéo;
    document.getElementById('svg-choice-bua-container').innerHTML = HAND_SVGS.búa;
    document.getElementById('svg-choice-bao-container').innerHTML = HAND_SVGS.bao;

    // ==========================================================================
    // FLOATING CHAT & EMOJI SYSTEM BINDINGS
    // ==========================================================================
    const chatWrapper = document.getElementById('app-chat-wrapper');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatInput = document.getElementById('chat-input-field');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatBadge = document.getElementById('chat-badge');

    const toggleChat = (forceState) => {
        chatWrapper.classList.remove('collapsed');
        chatWrapper.classList.add('expanded');
        STATE.chatExpanded = true;
        STATE.unreadMessages = 0;
        if (chatBadge) {
            chatBadge.textContent = '0';
            chatBadge.classList.add('hidden');
        }
        if (chatInput) {
            setTimeout(() => chatInput.focus(), 50);
        }
        SOUNDS.playClick();
    };

    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', () => {
            toggleChat(true);
        });
    }
    if (chatCloseBtn) chatCloseBtn.addEventListener('click', () => toggleChat(false));

    const sendChatMessage = () => {
        const text = chatInput.value.trim();
        if (!text) return;
        
        sendToServer({
            type: 'SEND_CHAT',
            message: text
        });
        
        chatInput.value = '';
    };

    if (chatSendBtn) chatSendBtn.addEventListener('click', sendChatMessage);
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }

    // Reaction Buttons click listeners
    const emojiBtns = document.querySelectorAll('#emoji-reaction-bar .emoji-btn');
    emojiBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const emoji = e.currentTarget.getAttribute('data-emoji');
            if (emoji) {
                sendToServer({
                    type: 'SEND_REACTION',
                    emoji: emoji
                });
            }
            // Add a small bounce scale effect on click
            e.currentTarget.style.transform = 'scale(0.8)';
            setTimeout(() => {
                e.currentTarget.style.transform = '';
            }, 100);
        });
    });

    // Pre-fill playerName from localStorage
    const savedPlayerName = localStorage.getItem('playerName');
    if (savedPlayerName) {
        const hostNameInput = document.getElementById('create-host-name');
        const joinNameInput = document.getElementById('join-player-name');
        if (hostNameInput) hostNameInput.value = savedPlayerName;
        if (joinNameInput) joinNameInput.value = savedPlayerName;
    }

    // Save playerName on Create Room or Join Room click
    const btnCreateRoom = document.getElementById('btn-create-room');
    if (btnCreateRoom) {
        btnCreateRoom.addEventListener('click', () => {
            const hostName = document.getElementById('create-host-name').value.trim();
            if (hostName) {
                localStorage.setItem('playerName', hostName);
            }
        });
    }

    const btnJoinRoom = document.getElementById('btn-join-room');
    if (btnJoinRoom) {
        btnJoinRoom.addEventListener('click', () => {
            const pName = document.getElementById('join-player-name').value.trim();
            if (pName) {
                localStorage.setItem('playerName', pName);
            }
        });
    }

    // Bind History Modal events
    const tabStatsBtn = document.getElementById('btn-tab-stats');
    const tabLogBtn = document.getElementById('btn-tab-log');
    const tabStatsContent = document.getElementById('tab-stats-content');
    const tabLogContent = document.getElementById('tab-log-content');

    if (tabStatsBtn && tabLogBtn && tabStatsContent && tabLogContent) {
        tabStatsBtn.addEventListener('click', () => {
            tabStatsBtn.classList.add('active');
            tabLogBtn.classList.remove('active');
            tabStatsContent.style.display = 'block';
            tabLogContent.style.display = 'none';
            if (typeof SOUNDS !== 'undefined' && SOUNDS.playClick) {
                SOUNDS.playClick();
            }
        });

        tabLogBtn.addEventListener('click', () => {
            tabLogBtn.classList.add('active');
            tabStatsBtn.classList.remove('active');
            tabLogContent.style.display = 'block';
            tabStatsContent.style.display = 'none';
            if (typeof SOUNDS !== 'undefined' && SOUNDS.playClick) {
                SOUNDS.playClick();
            }
        });
    }

    const historyToggleBtn = document.getElementById('history-toggle-btn');
    const historyModalCloseBtn = document.getElementById('history-modal-close-btn');

    if (historyToggleBtn) {
        historyToggleBtn.addEventListener('click', () => {
            openHistoryDetailModal();
        });
    }

    if (historyModalCloseBtn) {
        historyModalCloseBtn.addEventListener('click', () => {
            closeHistoryDetailModal();
        });
    }

    // Bind Deliberate Leave Room events
    document.querySelectorAll('.btn-leave-room').forEach(btn => {
        btn.addEventListener('click', () => {
            showModalAlert(
                'Rời Phòng Chơi',
                'Bạn có chắc chắn muốn rời khỏi phòng chơi hiện tại không? Mọi dữ liệu về kết quả tích lũy trong phòng này sẽ bị xóa.',
                'logout',
                () => {
                    STATE.deliberateLeave = true;
                    if (STATE.roomCode) {
                        localStorage.removeItem(`matchHistory_${STATE.roomCode}`);
                        localStorage.removeItem(`playerStats_${STATE.roomCode}`);
                    }
                    if (STATE.socket) {
                        STATE.socket.close();
                    }
                },
                true,
                () => {
                    // Cancel leave: do nothing
                }
            );
        });
    });
});

/* ==========================================================================
   CUSTOM SOFT ALERTS & TOASTS SYSTEM
   ========================================================================== */
function showToast(message, type = 'info') {
    const container = document.getElementById('custom-toast-container');
    if (!container) return;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;

    // Select icon based on type
    let iconName = 'info';
    if (type === 'success') iconName = 'check_circle';
    else if (type === 'error') iconName = 'error';
    else if (type === 'warning') iconName = 'warning';

    toast.innerHTML = `
        <span class="material-symbols-rounded toast-icon">${iconName}</span>
        <div class="toast-content">${message}</div>
    `;

    // Append to container
    container.appendChild(toast);

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
        toast.classList.add('toast-fadeOut');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
        // Fallback remove if transitionend does not trigger
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

let activeModalCallback = null;
let activeModalCancelCallback = null;

function showModalAlert(title, message, icon = 'info', onConfirm = null, showCancel = false, onCancel = null) {
    const backdrop = document.getElementById('custom-modal-backdrop');
    const titleEl = document.getElementById('custom-modal-title');
    const messageEl = document.getElementById('custom-modal-message');
    const iconEl = document.getElementById('custom-modal-icon');
    const okBtn = document.getElementById('custom-modal-ok-btn');
    const cancelBtn = document.getElementById('custom-modal-cancel-btn');

    if (!backdrop || !titleEl || !messageEl || !iconEl || !okBtn) return;

    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Set icon type class for dynamic text shadow & color
    iconEl.className = 'material-symbols-rounded modal-icon';
    let iconClass = 'icon-info';
    if (icon === 'wifi_off' || icon === 'error') iconClass = 'icon-error';
    else if (icon === 'warning') iconClass = 'icon-warning';
    else if (icon === 'check_circle' || icon === 'success') iconClass = 'icon-success';
    else if (icon === 'logout') iconClass = 'icon-error';
    
    iconEl.classList.add(iconClass);
    iconEl.textContent = icon;

    // Show/hide cancel button
    if (cancelBtn) {
        if (showCancel) {
            cancelBtn.classList.remove('hidden');
        } else {
            cancelBtn.classList.add('hidden');
        }
    }

    // Save callback
    activeModalCallback = onConfirm;
    activeModalCancelCallback = onCancel;

    // Show modal
    backdrop.classList.remove('hidden');
    
    // Play a click or countdown sound to grab attention
    if (typeof SOUNDS !== 'undefined' && SOUNDS.playClick) {
        SOUNDS.playClick();
    }
}

// Bind confirmation button click globally once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const okBtn = document.getElementById('custom-modal-ok-btn');
    const cancelBtn = document.getElementById('custom-modal-cancel-btn');
    const backdrop = document.getElementById('custom-modal-backdrop');
    
    if (okBtn && backdrop) {
        okBtn.addEventListener('click', () => {
            if (typeof SOUNDS !== 'undefined' && SOUNDS.playClick) {
                SOUNDS.playClick();
            }
            backdrop.classList.add('hidden');
            if (activeModalCallback) {
                const cb = activeModalCallback;
                activeModalCallback = null;
                activeModalCancelCallback = null;
                cb();
            }
        });
    }

    if (cancelBtn && backdrop) {
        cancelBtn.addEventListener('click', () => {
            if (typeof SOUNDS !== 'undefined' && SOUNDS.playClick) {
                SOUNDS.playClick();
            }
            backdrop.classList.add('hidden');
            if (activeModalCancelCallback) {
                const cb = activeModalCancelCallback;
                activeModalCallback = null;
                activeModalCancelCallback = null;
                cb();
            }
        });
    }
});
