const WebSocket = require('ws');

// Helper to delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log("=== BẮT ĐẦU KIỂM THỬ THAY ĐỔI LỰA CHỌN & CẤU HÌNH PHÒNG ===");

    // Host
    const host = new WebSocket('ws://localhost:3000');
    // Player 2
    const p2 = new WebSocket('ws://localhost:3000');
    // Player 3
    const p3 = new WebSocket('ws://localhost:3000');

    let roomCode = null;
    let hostPlayerId = null;
    let p2PlayerId = null;
    let p3PlayerId = null;

    let configUpdatedSuccess = false;
    let configUpdatedMsg = null;

    let p2ChoiceAcceptedCount = 0;
    let p2ChoiceChanges = 0;
    let p2MaxChangesReceived = null;
    let p2ReceivedError = null;

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
        } else if (msg.type === 'ERROR') {
            console.error(`[Host - ERROR]:`, msg.message);
        }
    });

    p2.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        console.log(`[Player 2] nhận:`, msg.type);
        if (msg.type === 'ROOM_JOINED') {
            p2PlayerId = msg.player.id;
        } else if (msg.type === 'ROOM_CONFIG_UPDATED') {
            configUpdatedSuccess = true;
            configUpdatedMsg = msg;
            console.log(`-> Player 2 nhận cấu hình mới: gameMode=${msg.gameMode}, maxChanges=${msg.maxChanges}`);
        } else if (msg.type === 'CHOICE_ACCEPTED') {
            p2ChoiceAcceptedCount++;
            p2ChoiceChanges = msg.choiceChanges;
            p2MaxChangesReceived = msg.maxChanges;
            console.log(`-> Player 2 CHOICE_ACCEPTED: choice=${msg.choice}, choiceChanges=${msg.choiceChanges}, maxChanges=${msg.maxChanges}`);
        } else if (msg.type === 'ERROR') {
            p2ReceivedError = msg.message;
            console.log(`-> Player 2 nhận lỗi từ Server: "${msg.message}"`);
        }
    });

    p3.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        console.log(`[Player 3] nhận:`, msg.type);
        if (msg.type === 'ROOM_JOINED') {
            p3PlayerId = msg.player.id;
        }
    });

    // Wait for host connection
    await sleep(500);

    // 1. Host creates room
    send(host, 'CREATE_ROOM', { hostName: 'Chủ phòng', gameMode: 'majority-out' });
    await sleep(500);

    // 2. Player 2 and 3 join room
    send(p2, 'JOIN_ROOM', { playerName: 'Người chơi A', roomCode: roomCode });
    send(p3, 'JOIN_ROOM', { playerName: 'Người chơi B', roomCode: roomCode });
    await sleep(500);

    // 3. Host updates config (maxChanges = 1, gameMode = 'white-out')
    console.log("\n--- CHỦ PHÒNG THAY ĐỔI CẤU HÌNH (maxChanges = 1, gameMode = white-out) ---");
    send(host, 'UPDATE_ROOM_CONFIG', { gameMode: 'white-out', maxChanges: 1 });
    await sleep(500);

    // Verify config update was received by others
    if (configUpdatedSuccess && configUpdatedMsg.maxChanges === 1 && configUpdatedMsg.gameMode === 'white-out') {
        console.log("✅ OK: Cập nhật cấu hình phòng được truyền phát đồng bộ thành công!");
    } else {
        console.error("❌ LỖI: Cập nhật cấu hình phòng không hoạt động!");
    }

    // 4. Host starts game
    console.log("\n--- BẮT ĐẦU CHƠI ---");
    send(host, 'START_GAME');
    await sleep(500);

    // 5. Test Choice and Changes Limit
    // 5.1 First choice (choiceChanges should be 0, no error)
    console.log("\n--- THỬ ĐẶT LỰA CHỌN LẦN ĐẦU (SẤP) ---");
    send(p2, 'SUBMIT_CHOICE', { choice: 'sấp' });
    await sleep(500);

    if (p2ChoiceAcceptedCount === 1 && p2ChoiceChanges === 0) {
        console.log("✅ OK: Lựa chọn lần đầu thành công!");
    } else {
        console.error("❌ LỖI: Lựa chọn lần đầu không thành công hoặc sai số lần đổi!");
    }

    // 5.2 Second choice (choiceChanges should become 1, success)
    console.log("\n--- THỬ THAY ĐỔI LỰA CHỌN LẦN 1 (NGỬA) ---");
    send(p2, 'SUBMIT_CHOICE', { choice: 'ngửa' });
    await sleep(500);

    if (p2ChoiceAcceptedCount === 2 && p2ChoiceChanges === 1) {
        console.log("✅ OK: Thay đổi lựa chọn lần 1 thành công (choiceChanges = 1)!");
    } else {
        console.error("❌ LỖI: Thay đổi lựa chọn lần 1 không thành công hoặc sai số lần đổi!");
    }

    // 5.3 Third choice (should be blocked since maxChanges = 1 and we already have 1 change)
    console.log("\n--- THỬ THAY ĐỔI LỰA CHỌN LẦN 2 (SẤP - PHẢI BỊ CHẶN) ---");
    p2ReceivedError = null;
    send(p2, 'SUBMIT_CHOICE', { choice: 'sấp' });
    await sleep(500);

    if (p2ReceivedError && p2ReceivedError.includes("hết lượt")) {
        console.log("✅ OK: Server chặn đổi lựa chọn vượt quá giới hạn thành công!");
    } else {
        console.error("❌ LỖI: Server không chặn hoặc không phản hồi lỗi chính xác khi vượt giới hạn đổi!");
    }

    // 6. Complete round choices for other players
    send(host, 'SUBMIT_CHOICE', { choice: 'sấp' });
    send(p3, 'SUBMIT_CHOICE', { choice: 'ngửa' });
    await sleep(500);

    // 7. Host triggers reveal
    console.log("\n--- LẬT TAY ---");
    send(host, 'TRIGGER_REVEAL');
    await sleep(4500); // Wait for reveal countdown (4s total)

    // 8. Host triggers play again (should reset choiceChanges to 0)
    console.log("\n--- BẮT ĐẦU VÒNG TIẾP THEO (PLAY AGAIN) ---");
    p2ChoiceAcceptedCount = 0;
    p2ChoiceChanges = 0;
    send(host, 'PLAY_AGAIN');
    await sleep(500);

    // Verify choiceChanges reset. We try to select and change choice.
    console.log("\n--- CHỌN LẦN ĐẦU Ở VÒNG MỚI (SẤP) ---");
    send(p2, 'SUBMIT_CHOICE', { choice: 'sấp' });
    await sleep(500);

    if (p2ChoiceAcceptedCount === 1 && p2ChoiceChanges === 0) {
        console.log("✅ OK: Reset số lần đổi lựa chọn về 0 ở vòng mới thành công!");
    } else {
        console.error("❌ LỖI: Không reset số lần đổi về 0 ở vòng mới!");
    }

    // Clean up
    host.close();
    p2.close();
    p3.close();

    console.log("\n=== HOÀN THÀNH KIỂM THỬ THAY ĐỔI LỰA CHỌN & CẤU HÌNH ===");
    
    if (configUpdatedSuccess && p2ChoiceAcceptedCount === 1 && p2ChoiceChanges === 0 && p2ReceivedError) {
        console.log("\n⭐️⭐️⭐️ TẤT CẢ CÁC BÀI KIỂM THỬ THAY ĐỔI LỰA CHỌN ĐỀU THÀNH CÔNG! ⭐️⭐️⭐️");
        process.exit(0);
    } else {
        console.error("\n❌ CÓ BÀI KIỂM THỬ THẤT BẠI.");
        process.exit(1);
    }
}

runTest().catch(console.error);
