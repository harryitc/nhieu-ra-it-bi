/* ==========================================================================
   CLIENT STATE
   ========================================================================== */
export const STATE = {
    socket: null,
    roomCode: null,
    myPlayer: null, // { id, name, color, isHost, isSpectator, isSafe }
    players: [],    // Array of sanitized players from server
    currentMode: 'oan-tu-ti',
    maxChanges: 3,   // Maximum times a player can change their choice
    choiceChanges: 0, // Number of times local player changed choice in current round
    myChoice: null,
    soundEnabled: true,
    isCountingDown: false,
    audioCtx: null,
    chatExpanded: true,
    unreadMessages: 0,
    matchHistory: [],
    playerStats: {},
    deliberateLeave: false,
    roundNumber: 1,
    roundType: 'oan-tu-ti'
};
