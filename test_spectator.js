const WebSocket = require('ws');

// Helper to delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log("=== BẮT ĐẦU KIỂM THỬ CHẾ ĐỘ QUAN SÁT (SPECTATOR MODE) ===");

    // Host
    const client1 = new WebSocket('ws://localhost:3000');
    // Active player 2
    const client2 = new WebSocket('ws://localhost:3000');
    // Active player 3
    const client3 = new WebSocket('ws://localhost:3000');
    // Late-joining spectator player 4
    let client4 = null;

    let roomCode = null;
    let client1PlayerId = null;
    let client2PlayerId = null;
    let client3PlayerId = null;
    let client4PlayerId = null;

    let spectatorJoinedSuccess = false;
    let spectatorReceivedErrorOnChoice = false;
    let spectatorPromotedSuccess = false;

    // Helper to send messages
    const send = (ws, type, data = {}) => {
        ws.send(JSON.stringify({ type, ...data }));
    };

    client1.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        console.log(`[Host - Player 1] nhận:`, msg.type);
        if (msg.type === 'ROOM_CREATED') {
            roomCode = msg.roomCode;
            client1PlayerId = msg.player.id;
            console.log(`-> Phòng được tạo: ${roomCode}`);
        } else if (msg.type === 'ERROR') {
            console.error(`[Host - ERROR]:`, msg.message);
        }
    });

    client2.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        console.log(`[Player 2] nhận:`, msg.type);
        if (msg.type === 'ROOM_JOINED') {
            client2PlayerId = msg.player.id;
        }
    });

    client3.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        console.log(`[Player 3] nhận:`, msg.type);
        if (msg.type === 'ROOM_JOINED') {
            client3PlayerId = msg.player.id;
        }
    });

    // Wait for client1 (Host) to connect
    await sleep(500);

    // 1. Host creates room
    send(client1, 'CREATE_ROOM', { hostName: 'Chủ phòng', gameMode: 'majority-out' });
    await sleep(500);

    // 2. Player 2 and 3 join room
    send(client2, 'JOIN_ROOM', { playerName: 'Người chơi A', roomCode: roomCode });
    send(client3, 'JOIN_ROOM', { playerName: 'Người chơi B', roomCode: roomCode });
    await sleep(500);

    // 3. Host starts game
    console.log("\n--- BẮT ĐẦU CHƠI ---");
    send(client1, 'START_GAME');
    await sleep(500);

    // 4. Late joiner (Player 4) joins during gameplay
    console.log("\n--- NGƯỜI CHƠI C VÀO PHÒNG MUỘN (SPECTATOR) ---");
    client4 = new WebSocket('ws://localhost:3000');
    
    client4.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        console.log(`[Spectator Player 4] nhận:`, msg.type);
        
        if (msg.type === 'ROOM_JOINED') {
            client4PlayerId = msg.player.id;
            spectatorJoinedSuccess = msg.player.isSpectator;
            console.log(`-> Trạng thái quan sát viên: ${msg.player.isSpectator ? "ĐÚNG" : "SAI"}`);
        } else if (msg.type === 'ERROR') {
            console.log(`-> Nhận lỗi hệ thống từ Spectator: "${msg.message}"`);
            if (msg.message.includes('quan sát') || msg.message.includes('người quan sát')) {
                spectatorReceivedErrorOnChoice = true;
            }
        } else if (msg.type === 'PLAYER_LIST_UPDATE') {
            const me = msg.players.find(p => p.id === client4PlayerId);
            if (me && me.isSpectator === false) {
                spectatorPromotedSuccess = true;
            }
        }
    });

    await sleep(200);
    send(client4, 'JOIN_ROOM', { playerName: 'Người chơi C', roomCode: roomCode });
    await sleep(500);

    // Verify late joiner joined as spectator successfully
    if (spectatorJoinedSuccess) {
        console.log("✅ OK: Quan sát viên gia nhập phòng chơi đang hoạt động thành công!");
    } else {
        console.error("❌ LỖI: Quan sát viên không có cờ `isSpectator = true`!");
    }

    // 5. Spectator tries to submit choice (should be blocked)
    console.log("\n--- THỬ GỬI LỰA CHỌN TỪ QUAN SÁT VIÊN (PHẢI BỊ CHẶN) ---");
    send(client4, 'SUBMIT_CHOICE', { choice: 'sấp' });
    await sleep(500);

    if (spectatorReceivedErrorOnChoice) {
        console.log("✅ OK: Server đã chặn lựa chọn từ quan sát viên thành công!");
    } else {
        console.error("❌ LỖI: Server không chặn hoặc không phản hồi lỗi khi quan sát viên gửi lựa chọn!");
    }

    // 6. Active players submit choices
    console.log("\n--- NGƯỜI CHƠI CHÍNH THỨC GỬI LỰA CHỌN ---");
    send(client1, 'SUBMIT_CHOICE', { choice: 'sấp' });
    send(client2, 'SUBMIT_CHOICE', { choice: 'ngửa' });
    send(client3, 'SUBMIT_CHOICE', { choice: 'sấp' });
    await sleep(500);

    // 7. Host triggers reveal (should succeed as only active players choice is checked)
    console.log("\n--- LẬT TAY ---");
    send(client1, 'TRIGGER_REVEAL');
    // Wait for countdown + reveal delay
    await sleep(4500);

    // 8. Host starts new round (should promote spectator to active player)
    console.log("\n--- CHƠI TIẾP VÒNG MỚI (PLAY AGAIN) ---");
    send(client1, 'PLAY_AGAIN');
    await sleep(500);

    if (spectatorPromotedSuccess) {
        console.log("✅ OK: Quan sát viên đã tự động được thăng cấp thành người chơi chính thức ở vòng tiếp theo!");
    } else {
        console.error("❌ LỖI: Quan sát viên không được thăng cấp thành người chơi chính thức!");
    }

    // Clean up
    client1.close();
    client2.close();
    client3.close();
    client4.close();

    console.log("\n=== HOÀN THÀNH KIỂM THỬ ===");
    
    if (spectatorJoinedSuccess && spectatorReceivedErrorOnChoice && spectatorPromotedSuccess) {
        console.log("\n⭐️⭐️⭐️ TẤT CẢ CÁC BÀI KIỂM THỬ SPECTATOR ĐỀU THÀNH CÔNG! ⭐️⭐️⭐️");
        process.exit(0);
    } else {
        console.error("\n❌ CÓ BÀI KIỂM THỬ THẤT BẠI.");
        process.exit(1);
    }
}

runTest().catch(console.error);
