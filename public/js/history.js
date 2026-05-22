/* ==========================================================================
   MATCH HISTORY & DATA PERSISTENCE SERVICES
   ========================================================================== */
import { STATE } from './state.js';
import { SOUNDS } from './sounds.js';
import { escapeHtml } from './ui_common.js';

export function loadStoredHistoryAndStats() {
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

export function recordMatchHistory(isTie, results, ultimateLoserId, roundNumber, roundType) {
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
        gameMode: STATE.currentMode,
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

export function renderTransparentHistoryList() {
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

export function renderHistoryModal() {
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

        let modeName = 'Nhiều Ra Ít Bị';
        if (round.roundType === 'oan-tu-ti') {
            modeName = 'Oẳn Tù Tì';
        } else if (round.gameMode === 'minority-out') {
            modeName = 'Ít Ra Nhiều Bị';
        }

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

export function openHistoryDetailModal() {
    const modal = document.getElementById('history-detail-modal');
    if (modal) {
        renderHistoryModal();
        modal.style.display = 'flex';
        SOUNDS.playClick();
    }
}

export function closeHistoryDetailModal() {
    const modal = document.getElementById('history-detail-modal');
    if (modal) {
        modal.style.display = 'none';
        SOUNDS.playClick();
    }
}
