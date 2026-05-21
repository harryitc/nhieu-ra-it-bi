const WebSocket = require('ws');

// Helper to delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log("=== BẮT ĐẦU KIỂM THỬ TÍNH NĂNG REAL-TIME CHAT & EMOJI REACTION ===");

    // Host
    const host = new WebSocket('ws://localhost:3000');
    // Player 2
    const p2 = new WebSocket('ws://localhost:3000');

    let roomCode = null;
    let hostPlayerId = null;
    let p2PlayerId = null;

    let chatMessageReceived = false;
    let chatMsgData = null;

    let reactionReceived = false;
    let reactionData = null;

    // Helper to send messages
    const send = (ws, type, data = {}) => {
        ws.send(JSON.stringify({ type, ...data }));
    };

    host.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        console.log(`[Host] nhận:`, msg.type);
        if (msg.type === 'ROOM_CREATED') {
            roomCode = msg.roomCode;
            hostPlayerId = msg.player.id;
            console.log(`-> Phòng được tạo: ${roomCode}`);
        } else if (msg.type === 'CHAT_MESSAGE') {
            chatMessageReceived = true;
            chatMsgData = msg;
            console.log(`-> Host nhận tin nhắn: [${msg.playerName}]: "${msg.message}"`);
        } else if (msg.type === 'BROADCAST_REACTION') {
            reactionReceived = true;
            reactionData = msg;
            console.log(`-> Host nhận emoji reaction: [${msg.playerName}] thả "${msg.emoji}"`);
        } else if (msg.type === 'ERROR') {
            console.error(`[Host - ERROR]:`, msg.message);
        }
    });

    p2.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        console.log(`[Player 2] nhận:`, msg.type);
        if (msg.type === 'ROOM_JOINED') {
            p2PlayerId = msg.player.id;
            console.log(`-> Player 2 vào phòng chơi thành công!`);
        } else if (msg.type === 'ERROR') {
            console.error(`[Player 2 - ERROR]:`, msg.message);
        }
    });

    // Wait for websocket connections to establish
    await sleep(500);

    // 1. Host creates room
    console.log("\n--- 1. CHỦ PHÒNG TẠO PHÒNG CHƠI ---");
    send(host, 'CREATE_ROOM', { hostName: 'Chủ phòng', gameMode: 'majority-out' });
    await sleep(500);

    // 2. Player 2 joins room
    console.log("\n--- 2. NGƯỜI CHƠI 2 GIA NHẬP PHÒNG CHƠI ---");
    send(p2, 'JOIN_ROOM', { playerName: 'Người chơi A', roomCode: roomCode });
    await sleep(500);

    // 3. Host starts game (Validates 2 players min requirement works!)
    console.log("\n--- 3. BẮT ĐẦU CHƠI (TỐI THIỂU 2 NGƯỜI) ---");
    send(host, 'START_GAME');
    await sleep(500);

    // 4. Player 2 sends a chat message
    console.log("\n--- 4. NGƯỜI CHƠI 2 GỬI TIN NHẮN CHAT ---");
    send(p2, 'SEND_CHAT', { message: 'Xin chào phòng chơi!' });
    await sleep(500);

    // Verify chat message broadcast received
    if (chatMessageReceived && chatMsgData && chatMsgData.message === 'Xin chào phòng chơi!' && chatMsgData.playerId === p2PlayerId) {
        console.log("✅ OK: Truyền phát tin nhắn Chat thời gian thực thành công!");
    } else {
        console.error("❌ LỖI: Truyền phát tin nhắn Chat thất bại hoặc sai thông tin!");
    }

    // 5. Player 2 sends emoji reaction
    console.log("\n--- 5. NGƯỜI CHƠI 2 THẢ EMOJI REACTION (🔥) ---");
    send(p2, 'SEND_REACTION', { emoji: '🔥' });
    await sleep(500);

    // Verify emoji reaction broadcast received
    let untargetedOk = false;
    if (reactionReceived && reactionData && reactionData.emoji === '🔥' && reactionData.playerId === p2PlayerId) {
        console.log("✅ OK: Truyền phát Emoji Reaction thời gian thực thành công!");
        untargetedOk = true;
    } else {
        console.error("❌ LỖI: Truyền phát Emoji Reaction thất bại hoặc sai thông tin!");
    }

    // Reset reaction variables for targeted test
    reactionReceived = false;
    reactionData = null;

    // 6. Player 2 sends targeted emoji reaction to Host
    console.log("\n--- 6. NGƯỜI CHƠI 2 GỬI REACTION BẮN MỤC TIÊU (🎉) TỚI CHỦ PHÒNG ---");
    send(p2, 'SEND_REACTION', { 
        emoji: '🎉', 
        targetPlayerId: hostPlayerId, 
        targetPlayerName: 'Chủ phòng' 
    });
    await sleep(500);

    // Verify targeted emoji reaction broadcast received
    let targetedOk = false;
    if (reactionReceived && reactionData && reactionData.emoji === '🎉' && reactionData.playerId === p2PlayerId && reactionData.targetPlayerId === hostPlayerId && reactionData.targetPlayerName === 'Chủ phòng') {
        console.log("✅ OK: Truyền phát Targeted Emoji Reaction (bắn mục tiêu) thành công!");
        targetedOk = true;
    } else {
        console.error("❌ LỖI: Truyền phát Targeted Emoji Reaction thất bại hoặc sai thông tin mục tiêu!");
    }

    // Clean up
    host.close();
    p2.close();

    console.log("\n=== HOÀN THÀNH KIỂM THỬ CHAT & REACTION ===");
    
    if (chatMessageReceived && untargetedOk && targetedOk) {
        console.log("\n⭐️⭐️⭐️ TẤT CẢ CÁC BÀI KIỂM THỬ CHAT & EMOJI REACTION ĐỀU THÀNH CÔNG! ⭐️⭐️⭐️");
        process.exit(0);
    } else {
        console.error("\n❌ CÓ BÀI KIỂM THỬ THẤT BẠI.");
        process.exit(1);
    }
}

runTest().catch(console.error);
