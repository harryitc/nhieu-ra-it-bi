const WebSocket = require('ws');

// Helper to delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log("=== BẮT ĐẦU KIỂM THỬ GIẢI ĐẤU (ELIMINATION TOURNAMENT INTEGRATION TEST) ===");

    const host = new WebSocket('ws://localhost:3000');
    const p2 = new WebSocket('ws://localhost:3000');
    const p3 = new WebSocket('ws://localhost:3000');
    const p4 = new WebSocket('ws://localhost:3000');
    const p5 = new WebSocket('ws://localhost:3000');

    let roomCode = null;
    let hostId = null, p2Id = null, p3Id = null, p4Id = null, p5Id = null;

    let round1ResultsReceived = false;
    let round2ResultsReceived = false;
    let round2TypeVerified = false;
    let ultimateLoserVerified = false;
    let tournamentResetVerified = false;

    // Helper to send messages
    const send = (ws, type, data = {}) => {
        ws.send(JSON.stringify({ type, ...data }));
    };

    // Store references to all clients for easy iteration
    const clients = [
        { name: 'Host', ws: host },
        { name: 'P2', ws: p2 },
        { name: 'P3', ws: p3 },
        { name: 'P4', ws: p4 },
        { name: 'P5', ws: p5 }
    ];

    host.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        if (msg.type === 'ROOM_CREATED') {
            roomCode = msg.roomCode;
            hostId = msg.player.id;
            console.log(`[Host] Phòng được tạo thành công: ${roomCode}`);
        } else if (msg.type === 'ERROR') {
            console.error(`[Host - ERROR]:`, msg.message);
        }
    });

    p2.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        if (msg.type === 'ROOM_JOINED') {
            p2Id = msg.player.id;
        }
    });

    p3.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        if (msg.type === 'ROOM_JOINED') {
            p3Id = msg.player.id;
        }
    });

    p4.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        if (msg.type === 'ROOM_JOINED') {
            p4Id = msg.player.id;
        }
    });

    p5.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        if (msg.type === 'ROOM_JOINED') {
            p5Id = msg.player.id;
        }
    });

    // Listen to reveal result on P2 to verify state changes
    p2.on('message', (msgStr) => {
        const msg = JSON.parse(msgStr);
        if (msg.type === 'REVEAL_RESULTS') {
            console.log(`\n[P2 nhận REVEAL_RESULTS] Vòng: ${msg.roundNumber}, Kiểu: ${msg.roundType}, Tie: ${msg.isTie}`);
            
            if (msg.roundNumber === 1 && msg.roundType === 'nhieu-ra-it-bi') {
                round1ResultsReceived = true;
                // Host, P2, P3 chose 'sấp' -> majority-out makes them 'safe'
                // P4, P5 chose 'ngửa' -> minority makes them 'loser'
                const hostRes = msg.results.find(r => r.id === hostId);
                const p2Res = msg.results.find(r => r.id === p2Id);
                const p3Res = msg.results.find(r => r.id === p3Id);
                const p4Res = msg.results.find(r => r.id === p4Id);
                const p5Res = msg.results.find(r => r.id === p5Id);

                console.log(`-> Host choice: ${hostRes.choice}, status: ${hostRes.status}, isSafe: ${hostRes.isSafe}`);
                console.log(`-> P2 choice: ${p2Res.choice}, status: ${p2Res.status}, isSafe: ${p2Res.isSafe}`);
                console.log(`-> P3 choice: ${p3Res.choice}, status: ${p3Res.status}, isSafe: ${p3Res.isSafe}`);
                console.log(`-> P4 choice: ${p4Res.choice}, status: ${p4Res.status}, isSafe: ${p4Res.isSafe}`);
                console.log(`-> P5 choice: ${p5Res.choice}, status: ${p5Res.status}, isSafe: ${p5Res.isSafe}`);

                if (hostRes.status === 'safe' && p2Res.status === 'safe' && p3Res.status === 'safe' &&
                    p4Res.status === 'loser' && p5Res.status === 'loser') {
                    console.log("✅ OK: Vòng 1 Nhiều Ra Ít Bị phân định thắng thua chuẩn xác!");
                } else {
                    console.error("❌ LỖI: Vòng 1 phân định an toàn/bị sai lệch!");
                }
            } else if (msg.roundNumber === 2 && msg.roundType === 'oan-tu-ti') {
                round2ResultsReceived = true;
                const p4Res = msg.results.find(r => r.id === p4Id);
                const p5Res = msg.results.find(r => r.id === p5Id);

                console.log(`-> P4 choice: ${p4Res.choice}, status: ${p4Res.status}, isSafe: ${p4Res.isSafe}`);
                console.log(`-> P5 choice: ${p5Res.choice}, status: ${p5Res.status}, isSafe: ${p5Res.isSafe}`);
                console.log(`-> Người thua chung cuộc (ultimateLoserId): ${msg.ultimateLoserId}`);

                if (msg.ultimateLoserId === p5Id && p4Res.status === 'safe' && p5Res.status === 'loser') {
                    ultimateLoserVerified = true;
                    console.log("✅ OK: Oẳn Tù Tì tìm thấy người thua cuộc cuối cùng (P5) chính xác!");
                } else {
                    console.error("❌ LỖI: Oẳn Tù Tì phân định thắng thua chung kết sai lệch!");
                }
            }
        } else if (msg.type === 'ROUND_RESET') {
            console.log(`\n[P2 nhận ROUND_RESET] Vòng tiếp theo: Vòng ${msg.roundNumber}, Thể loại: ${msg.roundType}`);
            if (msg.roundNumber === 2 && msg.roundType === 'oan-tu-ti') {
                round2TypeVerified = true;
                console.log("✅ OK: Đã tự động chuyển đổi sang Chung kết Oẳn Tù Tì cho 2 người chơi!");
            }
        } else if (msg.type === 'GAME_STARTED') {
            console.log(`\n[P2 nhận GAME_STARTED] Trận đấu mới bắt đầu! Vòng: ${msg.roundNumber}, Trạng thái loser: ${msg.ultimateLoserId}`);
            if (msg.roundNumber === 1 && msg.ultimateLoserId === null) {
                tournamentResetVerified = true;
                console.log("✅ OK: Reset giải đấu thành công! Bắt đầu lại từ Vòng 1 Nhiều Ra Ít Bị.");
            }
        }
    });

    // Wait for ws connections
    await sleep(500);

    // 1. Host creates room (gameMode: majority-out, 5 players)
    send(host, 'CREATE_ROOM', { hostName: 'Chủ phòng', gameMode: 'majority-out' });
    await sleep(500);

    // 2. Other 4 players join the room
    send(p2, 'JOIN_ROOM', { playerName: 'Đồng đội A', roomCode });
    send(p3, 'JOIN_ROOM', { playerName: 'Đồng đội B', roomCode });
    send(p4, 'JOIN_ROOM', { playerName: 'Đồng đội C', roomCode });
    send(p5, 'JOIN_ROOM', { playerName: 'Đồng đội D', roomCode });
    await sleep(800);

    // 3. Host starts game
    console.log("\n--- BẮT ĐẦU VÒNG 1 (NHIỀU RA ÍT BỊ) ---");
    send(host, 'START_GAME');
    await sleep(500);

    // 4. Submit choices (Host, P2, P3: sấp [majority]; P4, P5: ngửa [minority])
    send(host, 'SUBMIT_CHOICE', { choice: 'sấp' });
    send(p2, 'SUBMIT_CHOICE', { choice: 'sấp' });
    send(p3, 'SUBMIT_CHOICE', { choice: 'sấp' });
    send(p4, 'SUBMIT_CHOICE', { choice: 'ngửa' });
    send(p5, 'SUBMIT_CHOICE', { choice: 'ngửa' });
    await sleep(500);

    // 5. Host triggers reveal
    console.log("\n--- LẬT TAY VÒNG 1 ---");
    send(host, 'TRIGGER_REVEAL');
    // Wait for reveal delay
    await sleep(4500);

    // 6. Host starts next round (only P4 and P5 remain active, so it switches to Rock-Paper-Scissors)
    console.log("\n--- THIẾT LẬP VÒNG 2 ---");
    send(host, 'PLAY_AGAIN');
    await sleep(500);

    // 7. Round 2: P4 and P5 submit Rock-Paper-Scissors choices
    // P4: búa, P5: kéo (P4 wins, P5 is ultimate loser)
    console.log("\n--- GỬI LỰA CHỌN OẰN TÙ TÌ VÒNG 2 ---");
    send(p4, 'SUBMIT_CHOICE', { choice: 'búa' });
    send(p5, 'SUBMIT_CHOICE', { choice: 'kéo' });
    await sleep(500);

    // 8. Host triggers reveal
    console.log("\n--- LẬT TAY VÒNG 2 (CHUNG KẾT OẰN TÙ TÌ) ---");
    send(host, 'TRIGGER_REVEAL');
    // Wait for reveal delay
    await sleep(4500);

    // 9. Start a brand new tournament
    console.log("\n--- BẮT ĐẦU TRẬN MỚI ---");
    send(host, 'PLAY_AGAIN');
    await sleep(800);

    // Clean up
    clients.forEach(c => c.ws.close());
    await sleep(200);

    console.log("\n=== TỔNG KẾT BÀI KIỂM THỬ GIẢI ĐẤU ===");
    const allPassed = round1ResultsReceived && round2ResultsReceived && round2TypeVerified && ultimateLoserVerified && tournamentResetVerified;

    if (allPassed) {
        console.log("\n⭐️⭐️⭐️ TẤT CẢ CÁC BÀI KIỂM THỬ GIẢI ĐẤU ĐỀU THÀNH CÔNG RỰC RỠ! ⭐️⭐️⭐️");
        process.exit(0);
    } else {
        console.error("\n❌ CÓ BÀI KIỂM THỬ GIẢI ĐẤU THẤT BẠI.");
        console.log(`round1ResultsReceived: ${round1ResultsReceived}`);
        console.log(`round2ResultsReceived: ${round2ResultsReceived}`);
        console.log(`round2TypeVerified: ${round2TypeVerified}`);
        console.log(`ultimateLoserVerified: ${ultimateLoserVerified}`);
        console.log(`tournamentResetVerified: ${tournamentResetVerified}`);
        process.exit(1);
    }
}

runTest().catch(console.error);
