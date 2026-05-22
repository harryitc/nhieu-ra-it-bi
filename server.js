const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from client build
app.use(express.static(path.join(__dirname, 'client/dist')));

// SPA catch-all: serve index.html for any non-file route so React Router works
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

// Port configuration (useful for deployment platforms like Render, Railway, Heroku)
const PORT = process.env.PORT || 3000;

// Lobbies in-memory state
// Structure: { [roomCode]: { code, players: [], gameMode, gameState, cleanupTimer? } }
const lobbies = {};

// Harmonic player color palette matching client
const PALETTE = [
    { name: 'Xanh Neon', value: '#00f0ff', rgb: '0, 240, 255' },
    { name: 'Tím Neon', value: '#bd00ff', rgb: '189, 0, 255' },
    { name: 'Vàng Neon', value: '#ffdf00', rgb: '255, 223, 0' },
    { name: 'Lục Neon', value: '#39ff14', rgb: '57, 255, 20' },
    { name: 'Hồng Neon', value: '#ff007f', rgb: '255, 0, 127' },
    { name: 'Cam Neon', value: '#ff5e00', rgb: '255, 94, 0' },
    { name: 'Lam Đậm', value: '#0070ff', rgb: '0, 112, 255' },
    { name: 'Đỏ Rực', value: '#ff3131', rgb: '255, 49, 49' }
];

// Helper: Generate random 4-letter uppercase code
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O, I, 1, 0
    let code;
    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (lobbies[code]);
    return code;
}

// Helper: Broadcast to all players in a lobby
function broadcastToLobby(roomCode, data) {
    const lobby = lobbies[roomCode];
    if (!lobby) return;

    const message = JSON.stringify(data);
    lobby.players.forEach(player => {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(message);
        }
    });
}

// Helper: Send to single player
function sendToPlayer(ws, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

// Helper: Get sanitized player list for public broadcast (excludes actual choices during gameplay)
function getSanitizedPlayers(lobby) {
    return lobby.players.filter(p => p.isOnline).map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isHost: p.isHost,
        isOnline: p.isOnline,
        hasChosen: p.choice !== null,
        status: p.status,
        isSpectator: p.isSpectator || false,
        isSafe: p.isSafe || false
    }));
}

// Helper: Get full player list INCLUDING offline players (for reconnection-aware views)
function getAllPlayersForBroadcast(lobby) {
    return lobby.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isHost: p.isHost,
        isOnline: p.isOnline,
        hasChosen: p.choice !== null,
        status: p.status,
        isSpectator: p.isSpectator || false,
        isSafe: p.isSafe || false
    }));
}

// Helper: Delete lobby and clear all related timers
function deleteLobby(roomCode) {
    const lobby = lobbies[roomCode];
    if (lobby) {
        if (lobby.selectionInterval) {
            clearInterval(lobby.selectionInterval);
            lobby.selectionInterval = null;
        }
        if (lobby.revealInterval) {
            clearInterval(lobby.revealInterval);
            lobby.revealInterval = null;
        }
        if (lobby.revealTimeout) {
            clearTimeout(lobby.revealTimeout);
            lobby.revealTimeout = null;
        }
        if (lobby.cleanupTimer) {
            clearTimeout(lobby.cleanupTimer);
            lobby.cleanupTimer = null;
        }
        delete lobbies[roomCode];
        console.log(`Lobby ${roomCode} deleted and all timers cleared.`);
    }
}

// Helper: Start the 30-second selection timer for active players
function startSelectionTimer(lobby, roomCode) {
    if (lobby.selectionInterval) {
        clearInterval(lobby.selectionInterval);
        lobby.selectionInterval = null;
    }
    if (lobby.revealInterval) {
        clearInterval(lobby.revealInterval);
        lobby.revealInterval = null;
    }
    if (lobby.revealTimeout) {
        clearTimeout(lobby.revealTimeout);
        lobby.revealTimeout = null;
    }

    lobby.selectionTimeLeft = 30;
    
    // Broadcast initial state
    broadcastToLobby(roomCode, {
        type: 'SELECTION_TIMER',
        timeLeft: lobby.selectionTimeLeft
    });

    lobby.selectionInterval = setInterval(() => {
        if (!lobbies[roomCode] || lobby.gameState !== 'playing') {
            clearInterval(lobby.selectionInterval);
            lobby.selectionInterval = null;
            return;
        }

        lobby.selectionTimeLeft--;

        broadcastToLobby(roomCode, {
            type: 'SELECTION_TIMER',
            timeLeft: lobby.selectionTimeLeft
        });

        if (lobby.selectionTimeLeft <= 0) {
            clearInterval(lobby.selectionInterval);
            lobby.selectionInterval = null;

            // Auto-select for any active players who haven't made a choice
            let autoChosenCount = 0;
            lobby.players.forEach(p => {
                if (p.isOnline && !p.isSpectator && !p.isSafe && p.choice === null) {
                    if (lobby.roundType === 'oan-tu-ti') {
                        const choices = ['búa', 'kéo', 'bao'];
                        p.choice = choices[Math.floor(Math.random() * choices.length)];
                    } else {
                        const choices = ['sấp', 'ngửa'];
                        p.choice = choices[Math.floor(Math.random() * choices.length)];
                    }
                    p.hasChosen = true;
                    p.choiceChanges = 0;
                    autoChosenCount++;
                }
            });

            if (autoChosenCount > 0) {
                broadcastToLobby(roomCode, {
                    type: 'PLAYER_LIST_UPDATE',
                    players: getSanitizedPlayers(lobby)
                });
            }

            triggerReveal(lobby, roomCode);
        }
    }, 1000);
}

// Helper: Trigger immediate reveal (countdown then show results after 4s)
function triggerReveal(lobby, roomCode) {
    if (!lobbies[roomCode]) return;

    // Clear any running selection or reveal timers
    if (lobby.selectionInterval) {
        clearInterval(lobby.selectionInterval);
        lobby.selectionInterval = null;
        lobby.selectionTimeLeft = null;
    }
    if (lobby.revealInterval) {
        clearInterval(lobby.revealInterval);
        lobby.revealInterval = null;
        lobby.revealTimeLeft = null;
    }

    // 1. Send start countdown triggers to everyone
    broadcastToLobby(roomCode, { type: 'REVEAL_COUNTDOWN' });

    // 2. Pre-calculate outcomes
    const currentRoundType = lobby.roundType || 'nhieu-ra-it-bi';
    const outcome = computeLobbyResults(lobby);
    lobby.gameState = 'revealed';

    lobby.revealTimeout = setTimeout(() => {
        if (!lobbies[roomCode]) return;
        broadcastToLobby(roomCode, {
            type: 'REVEAL_RESULTS',
            isTie: outcome.isTie,
            results: outcome.results,
            ultimateLoserId: lobby.ultimateLoserId,
            roundNumber: lobby.roundNumber,
            roundType: currentRoundType
        });
    }, 4000);
}

// Helper: Check if all players have chosen, if so start 5s auto-reveal
function checkAndStartAutoReveal(lobby, roomCode) {
    if (!lobbies[roomCode] || lobby.gameState !== 'playing') return;

    const activeContenders = lobby.players.filter(p => p.isOnline && !p.isSpectator && !p.isSafe);
    const allChosen = activeContenders.every(p => p.choice !== null);

    if (allChosen && activeContenders.length >= 2) {
        // Stop selection timer since everyone has chosen!
        if (lobby.selectionInterval) {
            clearInterval(lobby.selectionInterval);
            lobby.selectionInterval = null;
            lobby.selectionTimeLeft = null;
        }

        if (lobby.revealInterval) return;

        lobby.revealTimeLeft = 5;

        broadcastToLobby(roomCode, {
            type: 'AUTO_REVEAL_TIMER',
            timeLeft: lobby.revealTimeLeft
        });

        lobby.revealInterval = setInterval(() => {
            if (!lobbies[roomCode] || lobby.gameState !== 'playing') {
                clearInterval(lobby.revealInterval);
                lobby.revealInterval = null;
                return;
            }

            lobby.revealTimeLeft--;

            broadcastToLobby(roomCode, {
                type: 'AUTO_REVEAL_TIMER',
                timeLeft: lobby.revealTimeLeft
            });

            if (lobby.revealTimeLeft <= 0) {
                console.log(`Auto-revealing room ${roomCode} due to 5s inactivity.`);
                triggerReveal(lobby, roomCode);
            }
        }, 1000);
    } else {
        // Cancel reveal timer if not all players have choices (e.g. someone reconnected/joined and choice is null)
        if (lobby.revealInterval) {
            clearInterval(lobby.revealInterval);
            lobby.revealInterval = null;
            lobby.revealTimeLeft = null;
            broadcastToLobby(roomCode, {
                type: 'AUTO_REVEAL_CANCELLED'
            });
        }
    }
}

// Helper: Calculate results for a lobby
function computeLobbyResults(lobby) {
    const activePlayers = lobby.players.filter(p => p.isOnline && !p.isSpectator && !p.isSafe);
    
    // Reset statuses of non-safe non-spectator players
    lobby.players.forEach(p => {
        if (!p.isSafe && !p.isSpectator) {
            p.status = 'none';
        }
    });

    let isTie = false;

    // Handle Oẳn Tù Tì
    if (lobby.roundType === 'oan-tu-ti') {
        if (activePlayers.length === 2) {
            const p1 = activePlayers[0];
            const p2 = activePlayers[1];
            const c1 = p1.choice; // 'búa', 'kéo', 'bao'
            const c2 = p2.choice;

            if (c1 === c2) {
                isTie = true;
            } else {
                let p1Wins = false;
                if (c1 === 'búa' && c2 === 'kéo') p1Wins = true;
                else if (c1 === 'kéo' && c2 === 'bao') p1Wins = true;
                else if (c1 === 'bao' && c2 === 'búa') p1Wins = true;

                if (p1Wins) {
                    p1.status = 'safe';
                    p1.isSafe = true;
                    p2.status = 'loser';
                    p2.isSafe = false;
                    lobby.ultimateLoserId = p2.id;
                } else {
                    p2.status = 'safe';
                    p2.isSafe = true;
                    p1.status = 'loser';
                    p1.isSafe = false;
                    lobby.ultimateLoserId = p1.id;
                }
            }
        } else if (activePlayers.length > 2) {
            const choices = activePlayers.map(p => p.choice);
            const uniqueChoices = new Set(choices);

            if (uniqueChoices.size === 1 || uniqueChoices.size === 3) {
                isTie = true;
            } else if (uniqueChoices.size === 2) {
                let winningChoice = '';
                let losingChoice = '';

                if (uniqueChoices.has('búa') && uniqueChoices.has('kéo')) {
                    winningChoice = 'búa';
                    losingChoice = 'kéo';
                } else if (uniqueChoices.has('kéo') && uniqueChoices.has('bao')) {
                    winningChoice = 'kéo';
                    losingChoice = 'bao';
                } else if (uniqueChoices.has('bao') && uniqueChoices.has('búa')) {
                    winningChoice = 'bao';
                    losingChoice = 'búa';
                }

                lobby.players.forEach(p => {
                    if (p.isSpectator || p.isSafe) return;
                    if (p.choice === winningChoice) {
                        p.status = 'safe';
                        p.isSafe = true;
                    } else if (p.choice === losingChoice) {
                        p.status = 'loser';
                    }
                });
            } else {
                isTie = true; // Fallback
            }
        } else {
            isTie = true; // Fallback
        }
    } else {
        // Nhiều Ra Ít Bị mode (majority-out) và Ít Ra Nhiều Bị mode (minority-out)
        let sấpCount = 0;
        let ngửaCount = 0;

        activePlayers.forEach(p => {
            if (p.choice === 'sấp') sấpCount++;
            if (p.choice === 'ngửa') ngửaCount++;
        });

        if (lobby.gameMode === 'majority-out') {
            if (sấpCount === ngửaCount || sấpCount === 0 || ngửaCount === 0) {
                isTie = true;
            } else if (sấpCount > ngửaCount) {
                // 'sấp' is majority -> they are safe!
                lobby.players.forEach(p => {
                    if (p.isSpectator || p.isSafe) return;
                    if (p.choice === 'sấp') {
                        p.status = 'safe';
                        p.isSafe = true;
                    } else if (p.choice === 'ngửa') {
                        p.status = 'loser';
                    }
                });
            } else {
                // 'ngửa' is majority -> they are safe!
                lobby.players.forEach(p => {
                    if (p.isSpectator || p.isSafe) return;
                    if (p.choice === 'ngửa') {
                        p.status = 'safe';
                        p.isSafe = true;
                    } else if (p.choice === 'sấp') {
                        p.status = 'loser';
                    }
                });
            }
        } else if (lobby.gameMode === 'minority-out') {
            if (sấpCount === ngửaCount || sấpCount === 0 || ngửaCount === 0) {
                isTie = true;
            } else if (sấpCount < ngửaCount) {
                // 'sấp' is minority -> they are safe!
                lobby.players.forEach(p => {
                    if (p.isSpectator || p.isSafe) return;
                    if (p.choice === 'sấp') {
                        p.status = 'safe';
                        p.isSafe = true;
                    } else if (p.choice === 'ngửa') {
                        p.status = 'loser';
                    }
                });
            } else {
                // 'ngửa' is minority -> they are safe!
                lobby.players.forEach(p => {
                    if (p.isSpectator || p.isSafe) return;
                    if (p.choice === 'ngửa') {
                        p.status = 'safe';
                        p.isSafe = true;
                    } else if (p.choice === 'sấp') {
                        p.status = 'loser';
                    }
                });
            }
        } else {
            isTie = true; // Fallback
        }
    }

    // Tie reset & tournament progress check for ALL modes
    if (isTie) {
        lobby.players.forEach(p => {
            if (!p.isSafe && !p.isSpectator) {
                p.status = 'none';
            }
        });
    } else {
        // Determine tournament progress if not a tie
        const remainingActive = lobby.players.filter(p => p.isOnline && !p.isSpectator && !p.isSafe);
        if (remainingActive.length === 1) {
            lobby.ultimateLoserId = remainingActive[0].id;
        } else if (lobby.gameMode === 'oan-tu-ti' || remainingActive.length === 2) {
            lobby.roundType = 'oan-tu-ti';
        } else {
            lobby.roundType = 'nhieu-ra-it-bi';
        }
    }

    return {
        isTie,
        results: lobby.players.map(p => ({
            id: p.id,
            name: p.name,
            choice: p.choice,
            status: p.status,
            color: p.color,
            isSpectator: p.isSpectator || false,
            isSafe: p.isSafe || false
        }))
    };
}

// WebSocket Connection Handler
wss.on('error', (err) => console.error('[WSS] Server error:', err.message));

wss.on('connection', (ws) => {
    let currentPlayer = null;
    let currentRoomCode = null;

    ws.on('message', (messageStr) => {
        try {
            const data = JSON.parse(messageStr);
            
            switch (data.type) {
                // ------------------ CREATE ROOM ------------------
                case 'CREATE_ROOM': {
                    const roomCode = generateRoomCode();
                    const hostName = data.hostName.trim();
                    
                    const chosenMode = data.gameMode || 'oan-tu-ti';
                    const startingRoundType = chosenMode === 'oan-tu-ti' ? 'oan-tu-ti' : 'nhieu-ra-it-bi';

                    lobbies[roomCode] = {
                        code: roomCode,
                        players: [],
                        gameMode: chosenMode,
                        gameState: 'waiting', // 'waiting' | 'playing' | 'revealed'
                        maxChanges: 3, // Default: 3 changes allowed
                        roundNumber: 1,
                        ultimateLoserId: null,
                        roundType: startingRoundType
                    };

                    currentPlayer = {
                        id: 'player-' + Date.now() + '-' + Math.floor(Math.random()*1000),
                        name: hostName,
                        color: PALETTE[0],
                        choice: null,
                        choiceChanges: 0,
                        status: 'none',
                        isHost: true,
                        isOnline: true,
                        ws: ws,
                        isSpectator: false,
                        isSafe: false
                    };

                    lobbies[roomCode].players.push(currentPlayer);
                    currentRoomCode = roomCode;

                    sendToPlayer(ws, {
                        type: 'ROOM_CREATED',
                        roomCode: roomCode,
                        maxChanges: 3,
                        roundNumber: 1,
                        ultimateLoserId: null,
                        gameMode: chosenMode,
                        roundType: startingRoundType,
                        player: {
                            id: currentPlayer.id,
                            name: currentPlayer.name,
                            color: currentPlayer.color,
                            isHost: true,
                            isSpectator: false,
                            isSafe: false
                        }
                    });

                    // Broadcast initial list
                    broadcastToLobby(roomCode, {
                        type: 'PLAYER_LIST_UPDATE',
                        players: getSanitizedPlayers(lobbies[roomCode])
                    });
                    break;
                }

                // ------------------ JOIN ROOM ------------------
                case 'JOIN_ROOM': {
                    const roomCode = data.roomCode.trim().toUpperCase();
                    const playerName = data.playerName.trim();
                    const lobby = lobbies[roomCode];

                    if (!lobby) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Mã phòng không tồn tại!' });
                        return;
                    }

                    // --- Auto-reclaim: check if there's an offline player with the same name ---
                    const offlineMatch = lobby.players.find(
                        p => p.name.toLowerCase() === playerName.toLowerCase() && !p.isOnline
                    );

                    if (offlineMatch) {
                        // Re-attach this socket to the offline player slot
                        offlineMatch.ws = ws;
                        offlineMatch.isOnline = true;
                        currentPlayer = offlineMatch;
                        currentRoomCode = roomCode;

                        // Cancel lobby cleanup timer if it was set
                        if (lobby.cleanupTimer) {
                            clearTimeout(lobby.cleanupTimer);
                            lobby.cleanupTimer = null;
                        }

                        console.log(`Player ${offlineMatch.name} reclaimed offline slot in Lobby ${roomCode} via JOIN_ROOM.`);

                        sendToPlayer(ws, {
                            type: 'ROOM_JOINED',
                            roomCode: roomCode,
                            gameMode: lobby.gameMode,
                            gameState: lobby.gameState,
                            maxChanges: typeof lobby.maxChanges === 'number' ? lobby.maxChanges : 3,
                            roundNumber: lobby.roundNumber || 1,
                            ultimateLoserId: lobby.ultimateLoserId || null,
                            roundType: lobby.roundType || 'nhieu-ra-it-bi',
                            isReconnect: true,
                            selectionTimeLeft: lobby.selectionInterval ? lobby.selectionTimeLeft : null,
                            revealTimeLeft: lobby.revealInterval ? lobby.revealTimeLeft : null,
                            player: {
                                id: offlineMatch.id,
                                name: offlineMatch.name,
                                color: offlineMatch.color,
                                isHost: offlineMatch.isHost,
                                isSpectator: offlineMatch.isSpectator || false,
                                isSafe: offlineMatch.isSafe || false
                            }
                        });

                        // Broadcast system reconnect notification
                        broadcastToLobby(roomCode, {
                            type: 'CHAT_MESSAGE',
                            playerId: 'system',
                            playerName: 'Hệ thống',
                            playerColor: { value: '#39ff14' },
                            message: `Người chơi ${offlineMatch.name} đã kết nối lại! 🔗`
                        });

                        // Broadcast updated player list
                        broadcastToLobby(roomCode, {
                            type: 'PLAYER_LIST_UPDATE',
                            players: getSanitizedPlayers(lobby)
                        });
                        break;
                    }

                    // --- Normal new join ---
                    const onlineCount = lobby.players.filter(p => p.isOnline).length;
                    if (onlineCount >= 15) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Phòng đã đầy!' });
                        return;
                    }

                    // Check duplicate name among ONLINE players
                    const nameExists = lobby.players.some(p => p.name.toLowerCase() === playerName.toLowerCase() && p.isOnline);
                    if (nameExists) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Tên này đã được sử dụng trong phòng!' });
                        return;
                    }

                    const isSpectator = lobby.gameState !== 'waiting';

                    currentPlayer = {
                        id: 'player-' + Date.now() + '-' + Math.floor(Math.random()*1000),
                        name: playerName,
                        color: PALETTE[lobby.players.filter(p => p.isOnline).length % PALETTE.length],
                        choice: null,
                        choiceChanges: 0,
                        status: 'none',
                        isHost: false,
                        isOnline: true,
                        ws: ws,
                        isSpectator: isSpectator,
                        isSafe: false
                    };

                    lobby.players.push(currentPlayer);
                    currentRoomCode = roomCode;

                    sendToPlayer(ws, {
                        type: 'ROOM_JOINED',
                        roomCode: roomCode,
                        gameMode: lobby.gameMode,
                        gameState: lobby.gameState,
                        maxChanges: typeof lobby.maxChanges === 'number' ? lobby.maxChanges : 3,
                        roundNumber: lobby.roundNumber || 1,
                        ultimateLoserId: lobby.ultimateLoserId || null,
                        roundType: lobby.roundType || 'nhieu-ra-it-bi',
                        selectionTimeLeft: lobby.selectionInterval ? lobby.selectionTimeLeft : null,
                        revealTimeLeft: lobby.revealInterval ? lobby.revealTimeLeft : null,
                        player: {
                            id: currentPlayer.id,
                            name: currentPlayer.name,
                            color: currentPlayer.color,
                            isHost: false,
                            isSpectator: isSpectator,
                            isSafe: false
                        }
                    });

                    // Broadcast updated list to room
                    broadcastToLobby(roomCode, {
                        type: 'PLAYER_LIST_UPDATE',
                        players: getSanitizedPlayers(lobby)
                    });
                    break;
                }

                // ------------------ REJOIN ROOM (Auto-reconnect) ------------------
                case 'REJOIN_ROOM': {
                    const roomCode = data.roomCode.trim().toUpperCase();
                    const playerId = data.playerId;
                    const playerName = data.playerName.trim();
                    const lobby = lobbies[roomCode];

                    if (!lobby) {
                        // Room no longer exists, tell client to clear session
                        sendToPlayer(ws, { type: 'REJOIN_FAILED', message: 'Phòng không còn tồn tại!' });
                        return;
                    }

                    // Try to find the offline player by ID first, then by name
                    let offlinePlayer = lobby.players.find(p => p.id === playerId && !p.isOnline);
                    if (!offlinePlayer) {
                        offlinePlayer = lobby.players.find(
                            p => p.name.toLowerCase() === playerName.toLowerCase() && !p.isOnline
                        );
                    }

                    if (!offlinePlayer) {
                        // Player slot is gone or already online
                        sendToPlayer(ws, { type: 'REJOIN_FAILED', message: 'Không tìm thấy phiên chơi cũ!' });
                        return;
                    }

                    // Re-attach socket
                    offlinePlayer.ws = ws;
                    offlinePlayer.isOnline = true;
                    currentPlayer = offlinePlayer;
                    currentRoomCode = roomCode;

                    // Cancel lobby cleanup timer if it was set
                    if (lobby.cleanupTimer) {
                        clearTimeout(lobby.cleanupTimer);
                        lobby.cleanupTimer = null;
                    }

                    console.log(`Player ${offlinePlayer.name} reconnected to Lobby ${roomCode} via REJOIN_ROOM.`);

                    sendToPlayer(ws, {
                        type: 'ROOM_JOINED',
                        roomCode: roomCode,
                        gameMode: lobby.gameMode,
                        gameState: lobby.gameState,
                        maxChanges: typeof lobby.maxChanges === 'number' ? lobby.maxChanges : 3,
                        roundNumber: lobby.roundNumber || 1,
                        ultimateLoserId: lobby.ultimateLoserId || null,
                        roundType: lobby.roundType || 'nhieu-ra-it-bi',
                        isReconnect: true,
                        selectionTimeLeft: lobby.selectionInterval ? lobby.selectionTimeLeft : null,
                        revealTimeLeft: lobby.revealInterval ? lobby.revealTimeLeft : null,
                        player: {
                            id: offlinePlayer.id,
                            name: offlinePlayer.name,
                            color: offlinePlayer.color,
                            isHost: offlinePlayer.isHost,
                            isSpectator: offlinePlayer.isSpectator || false,
                            isSafe: offlinePlayer.isSafe || false
                        }
                    });

                    // Broadcast system reconnect notification
                    broadcastToLobby(roomCode, {
                        type: 'CHAT_MESSAGE',
                        playerId: 'system',
                        playerName: 'Hệ thống',
                        playerColor: { value: '#39ff14' },
                        message: `Người chơi ${offlinePlayer.name} đã kết nối lại! 🔗`
                    });

                    // Broadcast updated player list
                    broadcastToLobby(roomCode, {
                        type: 'PLAYER_LIST_UPDATE',
                        players: getSanitizedPlayers(lobby)
                    });
                    break;
                }

                // ------------------ UPDATE ROOM CONFIG ------------------
                case 'UPDATE_ROOM_CONFIG': {
                    if (!currentRoomCode || !lobbies[currentRoomCode]) return;
                    const lobby = lobbies[currentRoomCode];
                    if (!currentPlayer.isHost) return;
                    if (lobby.gameState !== 'waiting') return;

                    lobby.gameMode = data.gameMode || lobby.gameMode;
                    lobby.maxChanges = typeof data.maxChanges === 'number' ? data.maxChanges : lobby.maxChanges;

                    broadcastToLobby(currentRoomCode, {
                        type: 'ROOM_CONFIG_UPDATED',
                        gameMode: lobby.gameMode,
                        maxChanges: lobby.maxChanges
                    });
                    break;
                }

                // ------------------ START GAME ------------------
                case 'START_GAME': {
                    if (!currentRoomCode || !lobbies[currentRoomCode]) return;
                    const lobby = lobbies[currentRoomCode];

                    if (!currentPlayer.isHost) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Chỉ chủ phòng mới có quyền bắt đầu chơi!' });
                        return;
                    }

                    if (lobby.players.filter(p => p.isOnline).length < 2) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Cần ít nhất 2 người chơi trực tuyến để bắt đầu!' });
                        return;
                    }

                    lobby.gameState = 'playing';
                    lobby.roundNumber = 1;
                    lobby.ultimateLoserId = null;
                    
                    // Reset round stats and reset spectator status for active start
                    lobby.players.forEach(p => {
                        p.choice = null;
                        p.choiceChanges = 0;
                        p.status = 'none';
                        p.isSpectator = false;
                        p.isSafe = false;
                    });

                    // Determine starting round type
                    const activePlayersCount = lobby.players.filter(p => p.isOnline && !p.isSpectator).length;
                    if (lobby.gameMode === 'oan-tu-ti' || activePlayersCount === 2) {
                        lobby.roundType = 'oan-tu-ti';
                    } else {
                        lobby.roundType = 'nhieu-ra-it-bi';
                    }

                    // Broadcast the updated list first to sync spectator status to false
                    broadcastToLobby(currentRoomCode, {
                        type: 'PLAYER_LIST_UPDATE',
                        players: getSanitizedPlayers(lobby)
                    });

                    broadcastToLobby(currentRoomCode, {
                        type: 'GAME_STARTED',
                        gameMode: lobby.gameMode,
                        roundNumber: lobby.roundNumber,
                        roundType: lobby.roundType,
                        ultimateLoserId: lobby.ultimateLoserId
                    });
                    startSelectionTimer(lobby, currentRoomCode);
                    break;
                }

                // ------------------ SUBMIT CHOICE ------------------
                case 'SUBMIT_CHOICE': {
                    if (!currentRoomCode || !lobbies[currentRoomCode] || !currentPlayer) return;
                    const lobby = lobbies[currentRoomCode];

                    if (lobby.gameState !== 'playing') {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Trò chơi chưa ở trạng thái đặt cược!' });
                        return;
                    }

                    if (currentPlayer.isSpectator) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Bạn đang là người quan sát, không thể đặt cược!' });
                        return;
                    }

                    if (currentPlayer.isSafe) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Bạn đã an toàn, không thể đặt cược tiếp!' });
                        return;
                    }

                    // Validate choices based on round type
                    if (lobby.roundType === 'oan-tu-ti') {
                        if (!['búa', 'kéo', 'bao'].includes(data.choice)) {
                            sendToPlayer(ws, { type: 'ERROR', message: 'Lựa chọn Oẳn Tù Tì không hợp lệ!' });
                            return;
                        }
                    } else {
                        if (!['sấp', 'ngửa'].includes(data.choice)) {
                            sendToPlayer(ws, { type: 'ERROR', message: 'Lựa chọn Sấp Ngửa không hợp lệ!' });
                            return;
                        }
                    }

                    const isChanging = currentPlayer.choice !== null;
                    const maxChanges = typeof lobby.maxChanges === 'number' ? lobby.maxChanges : 3;

                    if (isChanging) {
                        if (maxChanges !== 999 && currentPlayer.choiceChanges >= maxChanges) {
                            sendToPlayer(ws, { type: 'ERROR', message: `Bạn đã hết lượt đổi lựa chọn (Tối đa ${maxChanges} lần)!` });
                            return;
                        }
                        currentPlayer.choiceChanges++;
                    }

                    currentPlayer.choice = data.choice;

                    sendToPlayer(ws, { 
                        type: 'CHOICE_ACCEPTED', 
                        choice: data.choice,
                        choiceChanges: currentPlayer.choiceChanges || 0,
                        maxChanges: maxChanges
                    });

                    // Broadcast updated choice status
                    broadcastToLobby(currentRoomCode, {
                        type: 'PLAYER_LIST_UPDATE',
                        players: getSanitizedPlayers(lobby)
                    });
                    checkAndStartAutoReveal(lobby, currentRoomCode);
                    break;
                }

                // ------------------ TRIGGER REVEAL ------------------
                case 'TRIGGER_REVEAL': {
                    if (!currentRoomCode || !lobbies[currentRoomCode]) return;
                    const lobby = lobbies[currentRoomCode];

                    if (!currentPlayer.isHost) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Chỉ chủ phòng mới có quyền lật tay!' });
                        return;
                    }

                    // Only count players who are online AND not spectators AND not safe
                    const unchosenCount = lobby.players.filter(p => p.isOnline && !p.isSpectator && !p.isSafe && p.choice === null).length;
                    if (unchosenCount > 0) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Còn người chơi chưa hoàn thành lựa chọn!' });
                        return;
                    }

                    // Clear any running timers
                    if (lobby.selectionInterval) {
                        clearInterval(lobby.selectionInterval);
                        lobby.selectionInterval = null;
                    }
                    if (lobby.revealInterval) {
                        clearInterval(lobby.revealInterval);
                        lobby.revealInterval = null;
                    }

                    // 1. Send start countdown triggers to everyone
                    broadcastToLobby(currentRoomCode, { type: 'REVEAL_COUNTDOWN' });

                    // 2. Pre-calculate outcomes to be broadcast at the end of the 3s countdown
                    const currentRoundType = lobby.roundType || 'nhieu-ra-it-bi';
                    const outcome = computeLobbyResults(lobby);
                    lobby.gameState = 'revealed';

                    setTimeout(() => {
                        broadcastToLobby(currentRoomCode, {
                            type: 'REVEAL_RESULTS',
                            isTie: outcome.isTie,
                            results: outcome.results,
                            ultimateLoserId: lobby.ultimateLoserId,
                            roundNumber: lobby.roundNumber,
                            roundType: currentRoundType
                        });
                    }, 4000); // 4 seconds covers the countdown visual (3s) + lật delay (1s)

                    break;
                }

                // ------------------ PLAY AGAIN ------------------
                case 'PLAY_AGAIN': {
                    if (!currentRoomCode || !lobbies[currentRoomCode]) return;
                    const lobby = lobbies[currentRoomCode];

                    if (!currentPlayer.isHost) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Chỉ chủ phòng mới có quyền thiết lập vòng tiếp theo!' });
                        return;
                    }

                    if (lobby.ultimateLoserId === null) {
                        // Tournament is still in progress -> NEXT ROUND!
                        lobby.gameState = 'playing';
                        lobby.roundNumber = (lobby.roundNumber || 1) + 1;

                        lobby.players.forEach(p => {
                            if (!p.isSafe) {
                                p.choice = null;
                                p.choiceChanges = 0;
                                p.status = 'none';
                            }
                        });

                        // Re-evaluate roundType for remaining active players
                        const activePlayersCount = lobby.players.filter(p => p.isOnline && !p.isSpectator && !p.isSafe).length;
                        if (lobby.gameMode === 'oan-tu-ti' || activePlayersCount === 2) {
                            lobby.roundType = 'oan-tu-ti';
                        } else {
                            lobby.roundType = 'nhieu-ra-it-bi';
                        }

                        // Broadcast the updated player list first to reset all hands to unchosen state
                        broadcastToLobby(currentRoomCode, {
                            type: 'PLAYER_LIST_UPDATE',
                            players: getSanitizedPlayers(lobby)
                        });

                        broadcastToLobby(currentRoomCode, { 
                            type: 'ROUND_RESET',
                            roundNumber: lobby.roundNumber,
                            roundType: lobby.roundType
                        });
                        startSelectionTimer(lobby, currentRoomCode);
                    } else {
                        // Tournament is finished -> BẮT ĐẦU TRẬN MỚI!
                        lobby.gameState = 'playing';
                        lobby.roundNumber = 1;
                        lobby.ultimateLoserId = null;

                        lobby.players.forEach(p => {
                            p.choice = null;
                            p.choiceChanges = 0;
                            p.status = 'none';
                            p.isSpectator = false; // Promote all spectators to active players
                            p.isSafe = false;
                        });

                        const activePlayersCount = lobby.players.filter(p => p.isOnline && !p.isSpectator).length;
                        if (lobby.gameMode === 'oan-tu-ti' || activePlayersCount === 2) {
                            lobby.roundType = 'oan-tu-ti';
                        } else {
                            lobby.roundType = 'nhieu-ra-it-bi';
                        }

                        // Broadcast the updated player list first to reset all hands to unchosen state
                        broadcastToLobby(currentRoomCode, {
                            type: 'PLAYER_LIST_UPDATE',
                            players: getSanitizedPlayers(lobby)
                        });

                        broadcastToLobby(currentRoomCode, { 
                            type: 'GAME_STARTED',
                            gameMode: lobby.gameMode,
                            roundNumber: lobby.roundNumber,
                            roundType: lobby.roundType,
                            ultimateLoserId: lobby.ultimateLoserId
                        });
                        startSelectionTimer(lobby, currentRoomCode);
                    }
                    break;
                }

                // ------------------ BACK TO LOBBY ------------------
                case 'BACK_TO_LOBBY': {
                    if (!currentRoomCode || !lobbies[currentRoomCode]) return;
                    const lobby = lobbies[currentRoomCode];

                    if (!currentPlayer.isHost) {
                        sendToPlayer(ws, { type: 'ERROR', message: 'Chỉ chủ phòng mới có quyền đưa phòng về phòng chờ!' });
                        return;
                    }

                    lobby.gameState = 'waiting';
                    lobby.roundNumber = 1;
                    lobby.ultimateLoserId = null;
                    lobby.roundType = lobby.gameMode === 'oan-tu-ti' ? 'oan-tu-ti' : 'nhieu-ra-it-bi';
                    
                    lobby.players.forEach(p => {
                        p.choice = null;
                        p.choiceChanges = 0;
                        p.status = 'none';
                        p.isSpectator = false; // Promote all spectators to active players!
                        p.isSafe = false;
                    });

                    // Broadcast to go to lobby
                    broadcastToLobby(currentRoomCode, { type: 'GO_TO_LOBBY' });

                    // Broadcast the updated player list
                    broadcastToLobby(currentRoomCode, {
                        type: 'PLAYER_LIST_UPDATE',
                        players: getSanitizedPlayers(lobby)
                    });
                    break;
                }

                // ------------------ SEND CHAT ------------------
                case 'SEND_CHAT': {
                    if (!currentRoomCode || !lobbies[currentRoomCode] || !currentPlayer) return;
                    
                    broadcastToLobby(currentRoomCode, {
                        type: 'CHAT_MESSAGE',
                        playerId: currentPlayer.id,
                        playerName: currentPlayer.name,
                        playerColor: currentPlayer.color,
                        message: data.message.substring(0, 100), // Secure message length
                        timestamp: Date.now()
                    });
                    break;
                }

                // ------------------ SEND REACTION ------------------
                case 'SEND_REACTION': {
                    if (!currentRoomCode || !lobbies[currentRoomCode] || !currentPlayer) return;
                    
                    broadcastToLobby(currentRoomCode, {
                        type: 'BROADCAST_REACTION',
                        playerId: currentPlayer.id,
                        playerName: currentPlayer.name,
                        playerColor: currentPlayer.color,
                        emoji: data.emoji,
                        targetPlayerId: data.targetPlayerId,
                        targetPlayerName: data.targetPlayerName
                    });
                    break;
                }

                // ------------------ LEAVE ROOM (Deliberate) ------------------
                case 'LEAVE_ROOM': {
                    if (!currentRoomCode || !lobbies[currentRoomCode] || !currentPlayer) return;
                    const lobby = lobbies[currentRoomCode];
                    const leavingName = currentPlayer.name;
                    const wasHost = currentPlayer.isHost;

                    // Remove player completely from the lobby
                    lobby.players = lobby.players.filter(p => p.id !== currentPlayer.id);

                    const onlinePlayers = lobby.players.filter(p => p.isOnline);

                    if (onlinePlayers.length === 0 && lobby.players.length === 0) {
                        // Nobody left at all, delete lobby
                        deleteLobby(currentRoomCode);
                    } else {
                        // Transfer host if needed
                        if (wasHost && onlinePlayers.length > 0) {
                            const newHost = onlinePlayers[0];
                            newHost.isHost = true;
                            console.log(`Host left deliberately in Lobby ${currentRoomCode}. Assigned Host to ${newHost.name}`);
                        }

                        // Broadcast system message
                        broadcastToLobby(currentRoomCode, {
                            type: 'CHAT_MESSAGE',
                            playerId: 'system',
                            playerName: 'Hệ thống',
                            playerColor: { value: '#ff3131' },
                            message: `Người chơi ${leavingName} đã rời phòng. 👋`
                        });

                        // Broadcast updated player list
                        broadcastToLobby(currentRoomCode, {
                            type: 'PLAYER_LIST_UPDATE',
                            players: getSanitizedPlayers(lobby)
                        });
                    }

                    // Send confirmation to the leaving player
                    sendToPlayer(ws, { type: 'LEAVE_CONFIRMED' });

                    // Clean up connection-level references
                    currentPlayer = null;
                    currentRoomCode = null;
                    break;
                }
            }
        } catch (e) {
            console.error('Error handling WebSocket message:', e);
        }
    });

    ws.on('error', (err) => {
        console.error('[WS] Client error:', err.message);
    });

    // Handle Connection Disconnect
    ws.on('close', () => {
        if (!currentRoomCode || !lobbies[currentRoomCode] || !currentPlayer) return;

        const lobby = lobbies[currentRoomCode];
        const disconnectedName = currentPlayer.name;
        
        // Mark player as offline but KEEP them in the lobby for reconnection
        currentPlayer.isOnline = false;
        currentPlayer.ws = null;
        
        // Find remaining online players
        const onlinePlayers = lobby.players.filter(p => p.isOnline);

        if (onlinePlayers.length === 0) {
            // No one online - set a cleanup timer to delete lobby after 60 seconds
            // This gives players a window to reconnect (e.g., page refresh)
            console.log(`All players offline in Lobby ${currentRoomCode}. Starting 60s cleanup timer...`);
            lobby.cleanupTimer = setTimeout(() => {
                if (lobbies[currentRoomCode]) {
                    const stillOnline = lobbies[currentRoomCode].players.filter(p => p.isOnline);
                    if (stillOnline.length === 0) {
                        deleteLobby(currentRoomCode);
                    }
                }
            }, 60000);
        } else {
            // If host disconnected, pass Host privileges to next online player
            if (currentPlayer.isHost) {
                currentPlayer.isHost = false;
                const newHost = onlinePlayers[0];
                newHost.isHost = true;
                console.log(`Host disconnected in Lobby ${currentRoomCode}. Assigned Host to ${newHost.name}`);
            }

            // Broadcast system message about player disconnecting (not "leaving")
            broadcastToLobby(currentRoomCode, {
                type: 'CHAT_MESSAGE',
                playerId: 'system',
                playerName: 'Hệ thống',
                playerColor: { value: '#ff8c00' },
                message: `Người chơi ${disconnectedName} đã mất kết nối. ⚠️`
            });

            // Re-broadcast updated player list (player is still in list but isOnline=false)
            // getSanitizedPlayers filters out offline players for the active view
            broadcastToLobby(currentRoomCode, {
                type: 'PLAYER_LIST_UPDATE',
                players: getSanitizedPlayers(lobby)
            });
            checkAndStartAutoReveal(lobby, currentRoomCode);
        }
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Multiplayer Server running at http://localhost:${PORT}`);
});
