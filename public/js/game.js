/* ==========================================================================
   GAMEPLAY & RENDERING FLOWS
   ========================================================================== */
import { STATE } from './state.js';
import { SOUNDS } from './sounds.js';
import { CONFETTI } from './confetti.js';
import { HAND_SVGS } from './assets.js';
import { recordMatchHistory } from './history.js';
import { showToast, showModalAlert } from './ui_common.js';
import { sendToServer } from './socket.js';

export function showTargetedReactionPicker(targetPlayer, avatarElement) {
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

export function renderPlayersCircle() {
    const ring = document.getElementById('players-ring');
    if (!ring) return;
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
            if (btnReveal) {
                btnReveal.classList.remove('disabled');
                btnReveal.disabled = false;
            }
            document.getElementById('game-status-text').textContent = 'TẤT CẢ ĐÃ CHỌN XONG! Hãy bấm lật tay!';
        } else {
            if (btnReveal) {
                btnReveal.classList.add('disabled');
                btnReveal.disabled = true;
            }
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

export function updateChoiceChangesUI() {
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
        const submitMsg = document.getElementById('choice-submitted-msg');
        if (submitMsg) submitMsg.classList.remove('hidden');
    } else {
        buttons.forEach(btn => {
            if (btn) {
                btn.classList.remove('disabled');
                btn.disabled = false;
            }
        });
        // Hide lock banner so players can see the buttons
        const submitMsg = document.getElementById('choice-submitted-msg');
        if (submitMsg) submitMsg.classList.add('hidden');
    }
    
    // Always disable and mute other choices from a different mode
    otherButtons.forEach(btn => {
        if (btn) {
            btn.classList.add('disabled');
            btn.disabled = true;
        }
    });
}

export function setupActiveRound(roundNumber, roundType, gameMode) {
    if (gameMode) {
        STATE.currentMode = gameMode;
    }
    STATE.roundNumber = roundNumber || 1;
    STATE.roundType = roundType || 'oan-tu-ti';
    
    STATE.myChoice = null;
    STATE.choiceChanges = 0;
    STATE.isCountingDown = false;
    
    // UI elements reset
    const codeLabel = document.getElementById('game-room-code-label');
    if (codeLabel) codeLabel.textContent = STATE.roomCode;
    
    const modeTitles = {
        'oan-tu-ti': 'Oẳn Tù Tì',
        'majority-out': 'Nhiều Ra, Ít Bị',
        'minority-out': 'Ít Ra, Nhiều Bị'
    };
    
    const modeTitleText = modeTitles[STATE.currentMode] || 'Nhiều Ra, Ít Bị';
    const modeTitleEl = document.getElementById('current-mode-title');
    if (modeTitleEl) {
        if (STATE.roundType === 'oan-tu-ti') {
            modeTitleEl.textContent = `Vòng ${STATE.roundNumber}: Oẳn Tù Tì`;
        } else {
            modeTitleEl.textContent = `Vòng ${STATE.roundNumber}: ${modeTitleText}`;
        }
    }
    
    const statusText = document.getElementById('game-status-text');
    if (statusText) statusText.textContent = 'Đang đợi bạn bè đưa ra lựa chọn...';
    const countdownText = document.getElementById('countdown-text');
    if (countdownText) countdownText.style.display = 'none';
    const resultOverlay = document.getElementById('result-overlay');
    if (resultOverlay) resultOverlay.classList.remove('active');
    
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
    
    const choiceBar = document.getElementById('my-choice-bar');
    const choiceMsg = document.getElementById('choice-submitted-msg');
    const btnReveal = document.getElementById('btn-reveal-all');
    const waitMsg = document.getElementById('player-waiting-reveal-msg');
    
    if (isSpectator) {
        if (statusText) statusText.textContent = 'Bạn đang quan sát trận đấu...';
        if (choiceBar) choiceBar.classList.add('hidden');
        if (btnReveal) btnReveal.classList.add('hidden');
        if (waitMsg) {
            waitMsg.classList.remove('hidden');
            waitMsg.innerHTML = `
                <div class="waiting-spinner"></div>
                <p>Bạn đang xem trận đấu...</p>
            `;
        }
    } else if (isSafe) {
        if (statusText) statusText.textContent = 'Bạn đã AN TOÀN! Đang đợi các người chơi khác...';
        if (choiceBar) choiceBar.classList.add('hidden');
        if (btnReveal) btnReveal.classList.add('hidden');
        if (waitMsg) {
            waitMsg.classList.remove('hidden');
            waitMsg.innerHTML = `
                <div class="waiting-spinner"></div>
                <p>Bạn đã AN TOÀN! Đang xem trận đấu...</p>
            `;
        }
    } else {
        // Active player!
        if (statusText) statusText.textContent = 'Đang đợi bạn bè đưa ra lựa chọn...';
        if (choiceBar) choiceBar.classList.remove('hidden');
        if (choiceMsg) choiceMsg.classList.add('hidden');
        
        updateChoiceChangesUI();
        
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

export function executeRevealCountdown() {
    STATE.isCountingDown = true;

    // Hide reveal buttons during countdown
    const btnReveal = document.getElementById('btn-reveal-all');
    if (btnReveal) btnReveal.classList.add('hidden');
    const waitMsg = document.getElementById('player-waiting-reveal-msg');
    if (waitMsg) waitMsg.classList.add('hidden');
    
    // Bottom selection bar hide
    const choiceBar = document.getElementById('my-choice-bar');
    if (choiceBar) choiceBar.classList.add('hidden');

    const countdownText = document.getElementById('countdown-text');
    if (countdownText) {
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
}

export function revealOutcomes(isTie, results, ultimateLoserId, roundNumber, roundType) {
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
                if (badge) badge.textContent = 'AN TOÀN';
                
                // Explode colored confetti from safe player's hand card!
                const rect = node.getBoundingClientRect();
                const canvasRect = CONFETTI.canvas.getBoundingClientRect();
                const rx = rect.left + rect.width/2 - canvasRect.left;
                const ry = rect.top + rect.height/2 - canvasRect.top;
                
                CONFETTI.spawnAround(rx, ry, 22);
            } else if (res.status === 'loser') {
                node.classList.add('is-loser');
                if (badge) badge.textContent = 'BỊ CHỌN';
            }
        });
        
        // Show result spotlight dialog modal after 1.2s
        setTimeout(() => {
            triggerResultOverlay(isTie, results, ultimateLoserId, roundNumber, roundType);
        }, 1200);

    }, 800);
}

export function triggerResultOverlay(isTie, results, ultimateLoserId, roundNumber, roundType) {
    const overlay = document.getElementById('result-overlay');
    const tieBox = document.getElementById('tie-result-container');
    const decisiveBox = document.getElementById('decisive-result-container');
    const title = document.getElementById('result-title');
    const iconBg = document.getElementById('result-status-icon-bg');
    const icon = document.getElementById('result-status-icon');
    const loserName = document.getElementById('loser-name-display');
    const summaryList = document.getElementById('result-summary-list');

    if (!overlay || !summaryList) return;

    summaryList.innerHTML = '';

    // Render Host vs Player Action control buttons
    const hostBtns = document.getElementById('host-result-controls');
    const playerMsg = document.getElementById('player-result-controls');

    if (STATE.myPlayer.isHost) {
        if (hostBtns) hostBtns.classList.remove('hidden');
        if (playerMsg) playerMsg.classList.add('hidden');
    } else {
        if (hostBtns) hostBtns.classList.add('hidden');
        if (playerMsg) playerMsg.classList.remove('hidden');
    }

    const btnPlayAgain = document.getElementById('btn-play-again');

    if (isTie) {
        SOUNDS.playTie();
        if (tieBox) tieBox.classList.remove('hidden');
        if (decisiveBox) decisiveBox.classList.add('hidden');
        
        if (title) title.textContent = 'Kết quả: HÒA RỒI!';
        if (iconBg) {
            iconBg.style.background = 'linear-gradient(135deg, #ffdf00 0%, #ff8c00 100%)';
            iconBg.style.boxShadow = '0 0 25px rgba(255, 223, 0, 0.35)';
        }
        if (icon) icon.textContent = 'handshake';

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
        if (tieBox) tieBox.classList.add('hidden');
        if (decisiveBox) decisiveBox.classList.remove('hidden');

        const loserHandIcon = decisiveBox ? decisiveBox.querySelector('.loser-hand-icon') : null;

        if (ultimateLoserId !== null && ultimateLoserId !== undefined) {
            // Tournament is over! Ultimate loser found!
            SOUNDS.playLose(); // play game over/lose sound
            
            if (title) title.textContent = '💀 TRẬN ĐẤU KẾT THÚC 💀';
            if (iconBg) {
                iconBg.style.background = 'linear-gradient(135deg, #ff3131 0%, #000000 100%)';
                iconBg.style.boxShadow = '0 0 35px rgba(255, 49, 49, 0.6)';
            }
            if (icon) icon.textContent = 'skull';

            if (loserHandIcon) {
                loserHandIcon.textContent = 'skull';
            }

            const decisiveTitle = decisiveBox ? decisiveBox.querySelector('.result-subtitle') : null;
            if (decisiveTitle) {
                decisiveTitle.textContent = 'NGƯỜI THUA CHUNG CUỘC';
            }

            const loserBadge = decisiveBox ? decisiveBox.querySelector('.loser-badge') : null;
            if (loserBadge) {
                loserBadge.textContent = 'CHUNG CUỘC';
            }

            const ultimateLoser = results.find(r => r.id === ultimateLoserId);
            if (ultimateLoser && loserName) {
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
            if (title) title.textContent = `Kết quả Vòng ${displayRound}`;
            if (iconBg) {
                iconBg.style.background = 'linear-gradient(135deg, #bd00ff 0%, #00f0ff 100%)';
                iconBg.style.boxShadow = '0 0 25px rgba(189, 0, 255, 0.45)';
            }
            if (icon) icon.textContent = 'check_circle';

            if (loserHandIcon) {
                loserHandIcon.textContent = 'sentiment_very_dissatisfied';
            }

            const decisiveTitle = decisiveBox ? decisiveBox.querySelector('.result-subtitle') : null;
            if (decisiveTitle) {
                decisiveTitle.textContent = 'NGƯỜI CHƠI CHƯA AN TOÀN';
            }

            const loserBadge = decisiveBox ? decisiveBox.querySelector('.loser-badge') : null;
            if (loserBadge) {
                loserBadge.textContent = 'CHƯA AN TOÀN';
            }

            const losers = results.filter(r => r.status === 'loser');
            const loserText = losers.map(l => l.name).join(', ');
            
            if (loserName) {
                loserName.textContent = loserText;
                if (losers.length > 0) {
                    loserName.style.color = losers[0].color.value;
                }
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

        if (roundType === 'oan-tu-ti') {
            // Group players for Oẳn Tù Tì Grid
            const buaPlayers = [];
            const keoPlayers = [];
            const baoPlayers = [];
            const nonContenders = [];

            results.forEach(res => {
                if (res.isSpectator) {
                    nonContenders.push(res);
                } else if (res.choice === 'búa') {
                    buaPlayers.push(res);
                } else if (res.choice === 'kéo') {
                    keoPlayers.push(res);
                } else if (res.choice === 'bao') {
                    baoPlayers.push(res);
                } else {
                    nonContenders.push(res);
                }
            });

            const isBuaSafe = buaPlayers.length > 0 && buaPlayers.some(p => p.status === 'safe');
            const buaStatusText = isBuaSafe ? 'AN TOÀN ✓' : 'CHƯA AN TOÀN ✗';
            const buaStatusClass = isBuaSafe ? 'status-safe' : 'status-danger';
            const buaColumnSafeClass = isBuaSafe ? 'safe-col' : '';

            const isKeoSafe = keoPlayers.length > 0 && keoPlayers.some(p => p.status === 'safe');
            const keoStatusText = isKeoSafe ? 'AN TOÀN ✓' : 'CHƯA AN TOÀN ✗';
            const keoStatusClass = isKeoSafe ? 'status-safe' : 'status-danger';
            const keoColumnSafeClass = isKeoSafe ? 'safe-col' : '';

            const isBaoSafe = baoPlayers.length > 0 && baoPlayers.some(p => p.status === 'safe');
            const baoStatusText = isBaoSafe ? 'AN TOÀN ✓' : 'CHƯA AN TOÀN ✗';
            const baoStatusClass = isBaoSafe ? 'status-safe' : 'status-danger';
            const baoColumnSafeClass = isBaoSafe ? 'safe-col' : '';

            const gridHtml = `
            <div class="oan-tu-ti-grid animate-fade-in">
                <!-- BÚA COLUMN -->
                <div class="choice-column choice-bua-column ${buaColumnSafeClass}">
                    <div class="choice-column-header">
                        <span class="choice-symbol">✊</span>
                        <h3>BÚA</h3>
                        <span class="column-status-badge ${buaStatusClass}">${buaStatusText}</span>
                    </div>
                    <div class="choice-column-players">
                        ${buaPlayers.length > 0 ? buaPlayers.map(p => `
                            <div class="choice-player-card">
                                <div class="player-avatar-circle" style="background: ${p.color.value}; box-shadow: 0 0 10px ${p.color.value}40; width: 24px; height: 24px; font-size: 0.75rem; line-height: 24px;">
                                    ${p.name.charAt(0).toUpperCase()}
                                </div>
                                <span class="choice-player-name" style="color: ${p.color.value}">${p.name}</span>
                            </div>
                        `).join('') : '<div class="no-player-text" style="color: rgba(255,255,255,0.2); font-size: 0.8rem; font-style: italic; text-align: center; margin: auto;">Trống</div>'}
                    </div>
                </div>

                <!-- ARROW BÚA -> KÉO -->
                <div class="choice-relation-arrow arrow-horizontal bua-keo">
                    <svg viewBox="0 0 40 20">
                        <defs>
                            <linearGradient id="grad-bua-keo-ui" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#bd00ff" />
                                <stop offset="100%" stop-color="#ff3131" />
                            </linearGradient>
                        </defs>
                        <path d="M 5,10 L 30,10" stroke="url(#grad-bua-keo-ui)" stroke-width="2" fill="none" />
                        <polygon points="30,7 37,10 30,13" fill="#ff3131" />
                    </svg>
                </div>
                <div class="choice-relation-arrow arrow-vertical bua-keo">
                    <svg viewBox="0 0 40 20">
                        <path d="M 5,10 L 30,10" stroke="#ff3131" stroke-width="2" fill="none" />
                        <polygon points="30,7 37,10 30,13" fill="#ff3131" />
                    </svg>
                </div>

                <!-- KÉO COLUMN -->
                <div class="choice-column choice-keo-column ${keoColumnSafeClass}">
                    <div class="choice-column-header">
                        <span class="choice-symbol">✌️</span>
                        <h3>KÉO</h3>
                        <span class="column-status-badge ${keoStatusClass}">${keoStatusText}</span>
                    </div>
                    <div class="choice-column-players">
                        ${keoPlayers.length > 0 ? keoPlayers.map(p => `
                            <div class="choice-player-card">
                                <div class="player-avatar-circle" style="background: ${p.color.value}; box-shadow: 0 0 10px ${p.color.value}40; width: 24px; height: 24px; font-size: 0.75rem; line-height: 24px;">
                                    ${p.name.charAt(0).toUpperCase()}
                                </div>
                                <span class="choice-player-name" style="color: ${p.color.value}">${p.name}</span>
                            </div>
                        `).join('') : '<div class="no-player-text" style="color: rgba(255,255,255,0.2); font-size: 0.8rem; font-style: italic; text-align: center; margin: auto;">Trống</div>'}
                    </div>
                </div>

                <!-- ARROW KÉO -> BAO -->
                <div class="choice-relation-arrow arrow-horizontal keo-bao">
                    <svg viewBox="0 0 40 20">
                        <defs>
                            <linearGradient id="grad-keo-bao-ui" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#ff3131" />
                                <stop offset="100%" stop-color="#39ff14" />
                            </linearGradient>
                        </defs>
                        <path d="M 5,10 L 30,10" stroke="url(#grad-keo-bao-ui)" stroke-width="2" fill="none" />
                        <polygon points="30,7 37,10 30,13" fill="#39ff14" />
                    </svg>
                </div>
                <div class="choice-relation-arrow arrow-vertical keo-bao">
                    <svg viewBox="0 0 40 20">
                        <path d="M 5,10 L 30,10" stroke="#39ff14" stroke-width="2" fill="none" />
                        <polygon points="30,7 37,10 30,13" fill="#39ff14" />
                    </svg>
                </div>

                <!-- BAO COLUMN -->
                <div class="choice-column choice-bao-column ${baoColumnSafeClass}">
                    <div class="choice-column-header">
                        <span class="choice-symbol">✋</span>
                        <h3>BAO</h3>
                        <span class="column-status-badge ${baoStatusClass}">${baoStatusText}</span>
                    </div>
                    <div class="choice-column-players">
                        ${baoPlayers.length > 0 ? baoPlayers.map(p => `
                            <div class="choice-player-card">
                                <div class="player-avatar-circle" style="background: ${p.color.value}; box-shadow: 0 0 10px ${p.color.value}40; width: 24px; height: 24px; font-size: 0.75rem; line-height: 24px;">
                                    ${p.name.charAt(0).toUpperCase()}
                                </div>
                                <span class="choice-player-name" style="color: ${p.color.value}">${p.name}</span>
                            </div>
                        `).join('') : '<div class="no-player-text" style="color: rgba(255,255,255,0.2); font-size: 0.8rem; font-style: italic; text-align: center; margin: auto;">Trống</div>'}
                    </div>
                </div>

                <!-- CURVED ARROW BAO -> BÚA -->
                <div class="choice-relation-arrow arrow-curved-bao-bua">
                    <svg viewBox="0 0 400 40" class="curved-arrow-svg">
                        <defs>
                            <linearGradient id="grad-bao-bua-ui" x1="100%" y1="0%" x2="0%" y2="0%">
                                <stop offset="0%" stop-color="#39ff14" />
                                <stop offset="100%" stop-color="#bd00ff" />
                            </linearGradient>
                        </defs>
                        <path d="M 350,10 Q 200,32 50,10" stroke="url(#grad-bao-bua-ui)" stroke-width="2" fill="none" stroke-dasharray="4 4" class="pulsing-path" />
                        <polygon points="50,14 39,10 50,6" fill="#bd00ff" />
                        <text x="200" y="24" fill="rgba(255,255,255,0.5)" font-size="8" text-anchor="middle" font-weight="bold">Bao khắc chế Búa</text>
                    </svg>
                </div>
            </div>
            `;

            summaryList.innerHTML = gridHtml;

            const safeFromPrev = nonContenders.filter(p => !p.isSpectator);
            const spectatorsOnly = nonContenders.filter(p => p.isSpectator);

            if (safeFromPrev.length > 0) {
                const safeGroup = document.createElement('div');
                safeGroup.className = 'result-group safe animate-fade-in';
                safeGroup.style.marginTop = '15px';
                safeGroup.innerHTML = `
                    <div class="result-group-title">
                        <span class="material-symbols-rounded">shield</span>
                        <span>Đã An Toàn Từ Vòng Trước (${safeFromPrev.length})</span>
                    </div>
                    <div class="safe-pills-container">
                        ${safeFromPrev.map(p => `
                            <div class="safe-player-pill">
                                <span class="safe-pill-name" style="color: ${p.color.value}" title="${p.name}">${p.name}</span>
                                <span class="safe-pill-check">✓</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                summaryList.appendChild(safeGroup);
            }

            if (spectatorsOnly.length > 0) {
                const specGroup = document.createElement('div');
                specGroup.className = 'result-group spectators animate-fade-in';
                specGroup.style.marginTop = '15px';
                specGroup.innerHTML = `
                    <div class="result-group-title">
                        <span class="material-symbols-rounded">visibility</span>
                        <span>Quan Sát Viên (${spectatorsOnly.length})</span>
                    </div>
                    <div class="spectators-container">
                        ${spectatorsOnly.map(p => `
                            <div class="spectator-pill">${p.name}</div>
                        `).join('')}
                    </div>
                `;
                summaryList.appendChild(specGroup);
            }
        } else {
            // Group players into 3 categories: unsafe/danger, safe, spectators
            const unsafePlayers = [];
            const safePlayers = [];
            const spectatorPlayers = [];

            results.forEach(res => {
                if (res.isSpectator) {
                    spectatorPlayers.push(res);
                } else if (res.status === 'loser') {
                    unsafePlayers.push(res);
                } else {
                    safePlayers.push(res);
                }
            });

            // Helper for choice display names
            const getChoiceDisplayName = (choice) => {
                if (!choice) return 'Không Chọn ❌';
                const mapping = {
                    'sap': 'Sấp 🤚',
                    'ngua': 'Ngửa 🖐️',
                    'keo': 'Kéo ✌️',
                    'bua': 'Búa ✊',
                    'bao': 'Bao 🖐️'
                };
                return mapping[choice] || choice.toUpperCase();
            };

            // Helper for choice neon border color
            const getChoiceAccentColor = (choice) => {
                const mapping = {
                    'sap': '#00f0ff',
                    'ngua': '#ffdf00',
                    'keo': '#ff3131',
                    'bua': '#bd00ff',
                    'bao': '#39ff14'
                };
                return mapping[choice] || 'rgba(255,255,255,0.2)';
            };

            // 1. Render Unsafe/Danger section if not empty
            if (unsafePlayers.length > 0) {
                const dangerGroup = document.createElement('div');
                dangerGroup.className = 'result-group danger animate-fade-in';
                dangerGroup.innerHTML = `
                    <div class="result-group-title">
                        <span class="material-symbols-rounded">gavel</span>
                        <span>Nhóm Chưa An Toàn (${unsafePlayers.length})</span>
                    </div>
                    <div class="danger-cards-container"></div>
                `;
                const container = dangerGroup.querySelector('.danger-cards-container');
                unsafePlayers.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'danger-player-card';
                    
                    const initials = p.name ? p.name.charAt(0).toUpperCase() : '?';
                    const accent = getChoiceAccentColor(p.choice);
                    
                    card.innerHTML = `
                        <div class="danger-player-info">
                            <div class="player-avatar-circle" style="background: ${p.color.value}; box-shadow: 0 0 10px ${p.color.value}40">
                                ${initials}
                            </div>
                            <span class="danger-player-name" style="color: ${p.color.value}">${p.name}</span>
                        </div>
                        <div class="danger-player-choice-badge" style="border-color: ${accent}; box-shadow: 0 0 8px ${accent}30">
                            <span style="color: ${accent}">${getChoiceDisplayName(p.choice)}</span>
                        </div>
                    `;
                    container.appendChild(card);
                });
                summaryList.appendChild(dangerGroup);
            }

            // 2. Render Safe section if not empty
            if (safePlayers.length > 0) {
                const safeGroup = document.createElement('div');
                safeGroup.className = 'result-group safe animate-fade-in';
                safeGroup.innerHTML = `
                    <div class="result-group-title">
                        <span class="material-symbols-rounded">shield</span>
                        <span>Nhóm Đã An Toàn (${safePlayers.length})</span>
                    </div>
                    <div class="safe-pills-container"></div>
                `;
                const container = safeGroup.querySelector('.safe-pills-container');
                safePlayers.forEach(p => {
                    const pill = document.createElement('div');
                    pill.className = 'safe-player-pill';
                    
                    pill.innerHTML = `
                        <span class="safe-pill-name" style="color: ${p.color.value}" title="${p.name}">${p.name}</span>
                        <span class="safe-pill-choice">(${p.choice ? p.choice.toUpperCase() : 'N/A'})</span>
                        <span class="safe-pill-check">✓</span>
                    `;
                    container.appendChild(pill);
                });
                summaryList.appendChild(safeGroup);
            }

            // 3. Render Spectators section if not empty
            if (spectatorPlayers.length > 0) {
                const specGroup = document.createElement('div');
                specGroup.className = 'result-group spectators animate-fade-in';
                specGroup.innerHTML = `
                    <div class="result-group-title">
                        <span class="material-symbols-rounded">visibility</span>
                        <span>Quan Sát Viên (${spectatorPlayers.length})</span>
                    </div>
                    <div class="spectators-container"></div>
                `;
                const container = specGroup.querySelector('.spectators-container');
                spectatorPlayers.forEach(p => {
                    const pill = document.createElement('div');
                    pill.className = 'spectator-pill';
                    pill.textContent = p.name;
                    container.appendChild(pill);
                });
            }
        }
    }

    overlay.classList.add('active');
}

export function updateSelectionTimerUI(timeLeft) {
    const countdownText = document.getElementById('countdown-text');
    if (!countdownText) return;

    if (timeLeft !== null && timeLeft <= 10 && timeLeft > 0) {
        countdownText.style.display = 'block';
        countdownText.textContent = timeLeft;
        countdownText.classList.add('blinking-timer');
        
        // Hide Host reveal button and waiting spinner to prevent overlapping when countdown is active
        const btnReveal = document.getElementById('btn-reveal-all');
        if (btnReveal) btnReveal.classList.add('hidden');
        const waitMsg = document.getElementById('player-waiting-reveal-msg');
        if (waitMsg) waitMsg.classList.add('hidden');
    } else {
        countdownText.style.display = 'none';
        countdownText.classList.remove('blinking-timer');
        
        // Restore Host reveal button/waiting spinner if not counting down reveal
        if (!STATE.isCountingDown && document.getElementById('play-screen').classList.contains('active')) {
            const isSpectator = STATE.myPlayer.isSpectator;
            const isSafe = STATE.myPlayer.isSafe;
            const btnReveal = document.getElementById('btn-reveal-all');
            const waitMsg = document.getElementById('player-waiting-reveal-msg');
            
            if (isSpectator) {
                if (btnReveal) btnReveal.classList.add('hidden');
                if (waitMsg) {
                    waitMsg.classList.remove('hidden');
                    waitMsg.innerHTML = `
                        <div class="waiting-spinner"></div>
                        <p>Bạn đang xem trận đấu...</p>
                    `;
                }
            } else if (isSafe) {
                if (btnReveal) btnReveal.classList.add('hidden');
                if (waitMsg) {
                    waitMsg.classList.remove('hidden');
                    waitMsg.innerHTML = `
                        <div class="waiting-spinner"></div>
                        <p>Bạn đã AN TOÀN! Đang xem trận đấu...</p>
                    `;
                }
            } else {
                if (STATE.myPlayer.isHost) {
                    if (btnReveal) btnReveal.classList.remove('hidden');
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
        }
    }
}

export function updateAutoRevealTimerUI(timeLeft) {
    const btnReveal = document.getElementById('btn-reveal-all');
    const waitMsg = document.getElementById('player-waiting-reveal-msg');

    if (STATE.myPlayer.isHost) {
        if (btnReveal) {
            btnReveal.classList.remove('hidden');
            // Host is allowed to manually trigger reveal even during countdown!
            const unchosenCount = STATE.players.filter(p => !p.isSpectator && !p.isSafe && !p.hasChosen).length;
            if (unchosenCount === 0) {
                btnReveal.classList.remove('disabled');
                btnReveal.disabled = false;
            }
            btnReveal.textContent = `LẬT TAY! (${timeLeft})`;
        }
        if (waitMsg) waitMsg.classList.add('hidden');
    } else {
        if (btnReveal) btnReveal.classList.add('hidden');
        if (waitMsg) {
            waitMsg.classList.remove('hidden');
            const pEl = waitMsg.querySelector('p');
            if (pEl) {
                pEl.textContent = `Tự động lật tay sau ${timeLeft}s...`;
            } else {
                waitMsg.innerHTML = `
                    <div class="waiting-spinner"></div>
                    <p>Tự động lật tay sau ${timeLeft}s...</p>
                `;
            }
        }
    }
}

export function cancelAutoRevealTimerUI() {
    const btnReveal = document.getElementById('btn-reveal-all');
    const waitMsg = document.getElementById('player-waiting-reveal-msg');

    if (STATE.myPlayer.isHost) {
        if (btnReveal) {
            btnReveal.textContent = 'LẬT TAY!';
            // Also re-disable if unchosenCount > 0
            const unchosenCount = STATE.players.filter(p => !p.isSpectator && !p.isSafe && !p.hasChosen).length;
            if (unchosenCount > 0) {
                btnReveal.classList.add('disabled');
                btnReveal.disabled = true;
            } else {
                btnReveal.classList.remove('disabled');
                btnReveal.disabled = false;
            }
        }
    } else {
        if (waitMsg) {
            const pEl = waitMsg.querySelector('p');
            const isSpectator = STATE.myPlayer.isSpectator;
            const isSafe = STATE.myPlayer.isSafe;
            if (pEl) {
                if (isSpectator) {
                    pEl.textContent = 'Bạn đang xem trận đấu...';
                } else if (isSafe) {
                    pEl.textContent = 'Bạn đã AN TOÀN! Đang xem trận đấu...';
                } else {
                    pEl.textContent = 'Đợi lật tay...';
                }
            }
        }
    }
}
