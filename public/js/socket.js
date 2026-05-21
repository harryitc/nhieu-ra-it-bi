/* ==========================================================================
   WEBSOCKET COMMUNICATION LOGIC & EVENT DISPATCHER
   ========================================================================== */
import { STATE } from './state.js';
import { SOUNDS } from './sounds.js';
import { CONFETTI } from './confetti.js';
import { showToast, showModalAlert, showScreen, escapeHtml } from './ui_common.js';
import { loadStoredHistoryAndStats, renderTransparentHistoryList } from './history.js';
import { renderPlayersCircle, setupActiveRound, executeRevealCountdown, revealOutcomes } from './game.js';

export function initWebSocket() {
    if (STATE.socket) return;

    // Detect environment dynamically to support local and cloud deployments (Render, Railway, Heroku)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}`;

    STATE.socket = new WebSocket(socketUrl);

    STATE.socket.onopen = () => {
        console.log('Connected to Multiplayer WebSocket Server.');
        
        // Auto-reconnect: check if there's a saved session in localStorage
        if (!STATE.roomCode) {
            const savedRoom = localStorage.getItem('activeRoomCode');
            const savedPlayerId = localStorage.getItem('activePlayerId');
            const savedPlayerName = localStorage.getItem('activePlayerName');
            
            if (savedRoom && savedPlayerId && savedPlayerName) {
                console.log(`Attempting auto-rejoin to room ${savedRoom} as ${savedPlayerName}...`);
                sendToServer({
                    type: 'REJOIN_ROOM',
                    roomCode: savedRoom,
                    playerId: savedPlayerId,
                    playerName: savedPlayerName
                });
            }
        }
    };

    STATE.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };

    STATE.socket.onclose = () => {
        console.log('Disconnected from Server.');
        STATE.socket = null;
        
        if (STATE.deliberateLeave) {
            // Deliberate leave was already handled by LEAVE_CONFIRMED,
            // just reconnect WebSocket for next usage
            STATE.deliberateLeave = false;
            initWebSocket();
        } else if (STATE.roomCode) {
            // Unintentional disconnect while in a room
            // Session info is already saved in localStorage, so auto-reconnect on reload
            showModalAlert(
                'Mất Kết Nối',
                'Mất kết nối tới máy chủ! Đang thử kết nối lại...',
                'wifi_off',
                () => {
                    // Try to reconnect rather than full reload
                    initWebSocket();
                }
            );
        } else {
            // Not in any room, just reconnect quietly
            setTimeout(() => initWebSocket(), 2000);
        }
    };
}

// Save active session to localStorage for reconnection recovery
export function saveSession() {
    if (STATE.roomCode && STATE.myPlayer) {
        localStorage.setItem('activeRoomCode', STATE.roomCode);
        localStorage.setItem('activePlayerId', STATE.myPlayer.id);
        localStorage.setItem('activePlayerName', STATE.myPlayer.name);
    }
}

// Clear active session from localStorage
export function clearSession() {
    localStorage.removeItem('activeRoomCode');
    localStorage.removeItem('activePlayerId');
    localStorage.removeItem('activePlayerName');
}

export function sendToServer(data) {
    if (STATE.socket && STATE.socket.readyState === WebSocket.OPEN) {
        STATE.socket.send(JSON.stringify(data));
    } else {
        console.warn('Socket not connected. Message ignored:', data);
    }
}

export function updateLobbyConfigText() {
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

export function updateLobbyControls() {
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
        if (hostCtrl) hostCtrl.classList.remove('hidden');
        if (waitMsg) waitMsg.classList.add('hidden');
        
        // Host can start only if >= 2 players
        if (startBtn) {
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
        }
    } else {
        if (hostCtrl) hostCtrl.classList.add('hidden');
        if (waitMsg) waitMsg.classList.remove('hidden');
        document.getElementById('lobby-status-text').textContent = 'Đang trong phòng chờ...';
        document.getElementById('lobby-status-text').className = 'info-val text-neon-blue';
    }
}

export function renderLobbyPlayers() {
    const list = document.getElementById('lobby-players-list');
    if (!list) return;
    list.innerHTML = '';
    
    const countEl = document.getElementById('lobby-player-count');
    if (countEl) countEl.textContent = STATE.players.length;

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

export function handleServerMessage(msg) {
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

            // Save session for reconnection recovery
            saveSession();
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

            // Save session for reconnection recovery
            saveSession();

            // If this is a reconnect, show a toast
            if (msg.isReconnect) {
                showToast('Đã kết nối lại phòng chơi thành công! 🔗', 'success');
            }
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
            if (table) CONFETTI.createCanvas(table);
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
            const overlay = document.getElementById('result-overlay');
            if (overlay) overlay.classList.remove('active');
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
            const playScreen = document.getElementById('play-screen');
            const isPlayScreen = playScreen && playScreen.classList.contains('active');
            
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
                            SOUNDS.playClick();
                            
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

        // --- REJOIN FAILED ---
        case 'REJOIN_FAILED': {
            console.log('Rejoin failed:', msg.message);
            // Clear stale session data
            clearSession();
            // Go home silently
            showScreen('welcome-screen');
            break;
        }

        // --- LEAVE CONFIRMED ---
        case 'LEAVE_CONFIRMED': {
            showToast('Bạn đã rời phòng chơi!', 'info');
            
            // Clean up window location search parameters
            const url = new URL(window.location);
            url.searchParams.delete('room');
            window.history.replaceState({}, '', url.toString());
            
            // Clear session from localStorage
            clearSession();
            
            // Reset local state completely
            STATE.roomCode = null;
            STATE.myPlayer = null;
            STATE.players = [];
            STATE.myChoice = null;
            STATE.choiceChanges = 0;
            STATE.isCountingDown = false;
            STATE.matchHistory = [];
            STATE.playerStats = {};
            STATE.deliberateLeave = true; // Signal onclose handler
            
            // Clear lists in HTML
            const lobbyList = document.getElementById('lobby-players-list');
            if (lobbyList) lobbyList.innerHTML = '';
            const historyList = document.getElementById('history-messages-container');
            if (historyList) historyList.innerHTML = '';
            
            // Hide chat & history widgets
            document.getElementById('app-chat-wrapper').classList.add('hidden');
            document.getElementById('emoji-reaction-bar').classList.add('hidden');
            document.getElementById('app-history-wrapper').classList.add('hidden');
            
            // Go home
            showScreen('welcome-screen');
            break;
        }

        // --- SYSTEM ERROR ---
        case 'ERROR': {
            showToast(msg.message, 'error');
            break;
        }
    }
}
