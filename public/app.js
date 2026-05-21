/* ==========================================================================
   MAIN ENTRY POINT (ES MODULE BOOTSTRAPPER)
   ========================================================================== */
import { STATE } from './js/state.js';
import { HAND_SVGS } from './js/assets.js';
import { SOUNDS } from './js/sounds.js';
import { CONFETTI } from './js/confetti.js';
import { showToast, showModalAlert, showScreen } from './js/ui_common.js';
import {
    loadStoredHistoryAndStats,
    openHistoryDetailModal,
    closeHistoryDetailModal
} from './js/history.js';
import {
    updateChoiceChangesUI
} from './js/game.js';
import {
    initWebSocket,
    sendToServer,
    updateLobbyConfigText,
    updateLobbyControls,
    clearSession
} from './js/socket.js';

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
        const directHeader = document.getElementById('direct-join-header');
        const directActions = document.getElementById('direct-join-actions-container');
        const roomText = document.getElementById('direct-join-room-code-text');
        
        if (directHeader) directHeader.style.display = 'block';
        if (directActions) directActions.style.display = 'block';
        if (roomText) roomText.textContent = roomParam.toUpperCase();
        
        const joinCodeInput = document.getElementById('join-room-code');
        if (joinCodeInput) joinCodeInput.value = roomParam.toUpperCase();
        
        // Visual focus on name input to guide
        const joinNameInput = document.getElementById('join-player-name');
        if (joinNameInput) joinNameInput.focus();
    }

    // Direct Join Back Button Listener
    const directJoinBackBtn = document.getElementById('direct-join-back-btn');
    if (directJoinBackBtn) {
        directJoinBackBtn.addEventListener('click', () => {
            SOUNDS.playClick();
            
            // Remove query parameter cleanly from address bar
            window.history.pushState({}, document.title, window.location.pathname);
            
            // Restore standard grid view
            const setupGrid = document.querySelector('.setup-layout-grid');
            if (setupGrid) {
                setupGrid.classList.remove('direct-join-mode');
            }
            const directHeader = document.getElementById('direct-join-header');
            const directActions = document.getElementById('direct-join-actions-container');
            const joinCodeInput = document.getElementById('join-room-code');
            
            if (directHeader) directHeader.style.display = 'none';
            if (directActions) directActions.style.display = 'none';
            if (joinCodeInput) joinCodeInput.value = '';
        });
    }

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
    const btnCreateRoom = document.getElementById('btn-create-room');
    if (btnCreateRoom) {
        btnCreateRoom.addEventListener('click', () => {
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
    }

    // Join Room click
    const btnJoinRoom = document.getElementById('btn-join-room');
    if (btnJoinRoom) {
        btnJoinRoom.addEventListener('click', () => {
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
    }

    // Lobby Copy Room Code click (Copy code ONLY)
    const copyRoomCodeBtn = document.getElementById('copy-room-code-btn');
    if (copyRoomCodeBtn) {
        copyRoomCodeBtn.addEventListener('click', () => {
            SOUNDS.playClick();
            if (!STATE.roomCode) return;
            
            navigator.clipboard.writeText(STATE.roomCode).then(() => {
                showToast(`Đã sao chép Mã phòng: ${STATE.roomCode}`, 'success');
            }).catch(err => {
                console.error('Copy room code failed:', err);
                showModalAlert('Mã Phòng Chơi', `Mã phòng chơi của bạn là: ${STATE.roomCode}\n(Không thể tự động sao chép)`, 'content_copy');
            });
        });
    }

    // Lobby Copy Room Direct Link click
    const copyRoomLinkBtn = document.getElementById('copy-room-link-btn');
    if (copyRoomLinkBtn) {
        copyRoomLinkBtn.addEventListener('click', () => {
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
    }

    // Host Start Game click
    const btnHostStart = document.getElementById('btn-host-start');
    if (btnHostStart) {
        btnHostStart.addEventListener('click', () => {
            SOUNDS.playClick();
            sendToServer({ type: 'START_GAME' });
        });
    }

    // Submitting secret choices
    const btnChoiceSap = document.getElementById('btn-choice-sap');
    if (btnChoiceSap) {
        btnChoiceSap.addEventListener('click', () => {
            SOUNDS.playClick();
            sendToServer({ type: 'SUBMIT_CHOICE', choice: 'sấp' });
        });
    }
    const btnChoiceNgua = document.getElementById('btn-choice-ngua');
    if (btnChoiceNgua) {
        btnChoiceNgua.addEventListener('click', () => {
            SOUNDS.playClick();
            sendToServer({ type: 'SUBMIT_CHOICE', choice: 'ngửa' });
        });
    }
    const btnChoiceKeo = document.getElementById('btn-choice-keo');
    if (btnChoiceKeo) {
        btnChoiceKeo.addEventListener('click', () => {
            SOUNDS.playClick();
            sendToServer({ type: 'SUBMIT_CHOICE', choice: 'kéo' });
        });
    }
    const btnChoiceBua = document.getElementById('btn-choice-bua');
    if (btnChoiceBua) {
        btnChoiceBua.addEventListener('click', () => {
            SOUNDS.playClick();
            sendToServer({ type: 'SUBMIT_CHOICE', choice: 'búa' });
        });
    }
    const btnChoiceBao = document.getElementById('btn-choice-bao');
    if (btnChoiceBao) {
        btnChoiceBao.addEventListener('click', () => {
            SOUNDS.playClick();
            sendToServer({ type: 'SUBMIT_CHOICE', choice: 'bao' });
        });
    }

    // Host trigger reveal click
    const btnRevealAll = document.getElementById('btn-reveal-all');
    if (btnRevealAll) {
        btnRevealAll.addEventListener('click', () => {
            SOUNDS.playClick();
            sendToServer({ type: 'TRIGGER_REVEAL' });
        });
    }

    // Host reset / play again click
    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
        btnPlayAgain.addEventListener('click', () => {
            SOUNDS.playClick();
            sendToServer({ type: 'PLAY_AGAIN' });
        });
    }

    // Host back to lobby click from overlay
    const btnBackSetup = document.getElementById('btn-back-setup');
    if (btnBackSetup) {
        btnBackSetup.addEventListener('click', () => {
            SOUNDS.playClick();
            if (STATE.myPlayer && STATE.myPlayer.isHost) {
                sendToServer({ type: 'BACK_TO_LOBBY' });
            } else {
                const overlay = document.getElementById('result-overlay');
                if (overlay) overlay.classList.remove('active');
                showScreen('lobby-screen');
                CONFETTI.stop();
            }
        });
    }

    // Audio volume toggle click
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    if (btnToggleSound) {
        btnToggleSound.addEventListener('click', () => {
            STATE.soundEnabled = !STATE.soundEnabled;
            const icon = document.getElementById('sound-icon');
            if (STATE.soundEnabled) {
                if (icon) icon.textContent = 'volume_up';
                SOUNDS.playClick();
            } else {
                if (icon) icon.textContent = 'volume_off';
            }
        });
    }

    // Audio Autoplay policy bypass
    document.body.addEventListener('click', () => {
        SOUNDS.init();
        const banner = document.getElementById('sound-init-banner');
        if (banner) banner.classList.add('hidden');
    }, { once: true });

    // Load static SVG hand details inside choice panel bottom bars
    const choiceSap = document.getElementById('svg-choice-sap-container');
    const choiceNgua = document.getElementById('svg-choice-ngua-container');
    const choiceKeo = document.getElementById('svg-choice-keo-container');
    const choiceBua = document.getElementById('svg-choice-bua-container');
    const choiceBao = document.getElementById('svg-choice-bao-container');

    if (choiceSap) choiceSap.innerHTML = HAND_SVGS.sấp;
    if (choiceNgua) choiceNgua.innerHTML = HAND_SVGS.ngửa;
    if (choiceKeo) choiceKeo.innerHTML = HAND_SVGS.kéo;
    if (choiceBua) choiceBua.innerHTML = HAND_SVGS.búa;
    if (choiceBao) choiceBao.innerHTML = HAND_SVGS.bao;

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
        if (!chatWrapper) return;
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
        if (!chatInput) return;
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
    if (btnCreateRoom) {
        btnCreateRoom.addEventListener('click', () => {
            const hostName = document.getElementById('create-host-name').value.trim();
            if (hostName) {
                localStorage.setItem('playerName', hostName);
            }
        });
    }

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
            SOUNDS.playClick();
        });

        tabLogBtn.addEventListener('click', () => {
            tabLogBtn.classList.add('active');
            tabStatsBtn.classList.remove('active');
            tabLogContent.style.display = 'block';
            tabStatsContent.style.display = 'none';
            SOUNDS.playClick();
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
                    // Clear match history from localStorage
                    if (STATE.roomCode) {
                        localStorage.removeItem(`matchHistory_${STATE.roomCode}`);
                        localStorage.removeItem(`playerStats_${STATE.roomCode}`);
                    }
                    // Clear session data so auto-reconnect won't fire
                    clearSession();
                    // Send LEAVE_ROOM to server (server will respond with LEAVE_CONFIRMED)
                    sendToServer({ type: 'LEAVE_ROOM' });
                },
                true,
                () => {
                    // Cancel leave: do nothing
                }
            );
        });
    });
});
