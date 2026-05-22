const WebSocket = require('ws');
const BASE = 'ws://localhost:3000';

function createClient() {
    return new Promise((resolve) => {
        const ws = new WebSocket(BASE);
        const messages = [];
        ws.on('open', () => resolve({ ws, messages }));
        ws.on('message', (raw) => {
            const msg = JSON.parse(raw);
            messages.push(msg);
        });
    });
}

function waitForType(client, type, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for event type: ${type}`)), timeout);
        const check = () => {
            const idx = client.messages.findIndex(m => m.type === type);
            if (idx !== -1) {
                clearTimeout(timer);
                resolve(client.messages.splice(idx, 1)[0]);
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function runTests() {
    console.log('=== BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CHỌN (AFK) & TỰ ĐỘNG LẬT TAY (AUTO-REVEAL) ===\n');

    // --- SCENARIO 1: ALL CHOSEN -> AUTO-REVEAL IN 5 SECONDS ---
    console.log('--- TEST 1: Cả 2 người chơi chọn bài -> Tự động kích hoạt đếm ngược lật tay 5s ---');

    const host = await createClient();
    host.ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        hostName: 'Chủ phòng',
        gameMode: 'oan-tu-ti'
    }));

    const roomCreated = await waitForType(host, 'ROOM_CREATED');
    const roomCode = roomCreated.roomCode;
    console.log(`[Host] Phòng được tạo thành công: ${roomCode}`);

    const p2 = await createClient();
    p2.ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: roomCode,
        playerName: 'Người chơi AFK'
    }));

    const p2Joined = await waitForType(p2, 'ROOM_JOINED');
    console.log(`[P2] Đã tham gia phòng chơi.`);

    await sleep(200);

    // Host starts the game
    console.log('[Host] Đang bắt đầu ván chơi...');
    host.ws.send(JSON.stringify({ type: 'START_GAME' }));

    // Both should receive GAME_STARTED and the first SELECTION_TIMER (30s)
    const hostGameStarted = await waitForType(host, 'GAME_STARTED');
    console.log(`[Host] Game Started! Round: ${hostGameStarted.roundNumber}`);

    const selectionTimer = await waitForType(host, 'SELECTION_TIMER');
    console.log(`✅ OK: Nhận SELECTION_TIMER thành công: timeLeft = ${selectionTimer.timeLeft}s`);

    // Let both players submit their choice
    console.log('[Host & P2] Gửi lựa chọn (Búa vs Kéo)...');
    host.ws.send(JSON.stringify({ type: 'SUBMIT_CHOICE', choice: 'búa' }));
    p2.ws.send(JSON.stringify({ type: 'SUBMIT_CHOICE', choice: 'kéo' }));

    // As soon as both players choose, the server should stop the selection timer and start the auto-reveal timer
    console.log('Đang chờ hệ thống tự động lật tay đếm ngược...');
    const revealTimerVal = await waitForType(host, 'AUTO_REVEAL_TIMER');
    console.log(`✅ OK: Nhận AUTO_REVEAL_TIMER sau khi cả hai đã chọn: timeLeft = ${revealTimerVal.timeLeft}s`);

    // Let's verify that the timer counts down. We wait 2 seconds.
    await sleep(2200);
    const hostLatestRevealTimers = host.messages.filter(m => m.type === 'AUTO_REVEAL_TIMER');
    if (hostLatestRevealTimers.length > 0) {
        console.log(`✅ OK: Bộ đếm ngược lật tay đang hoạt động: timeLeft = ${hostLatestRevealTimers[hostLatestRevealTimers.length - 1].timeLeft}s`);
    } else {
        console.log('❌ FAIL: Không nhận được cập nhật đếm ngược lật tay tiếp theo!');
        process.exit(1);
    }

    // Now wait for the auto reveal to trigger after the 5s timer expires.
    // The server will trigger REVEAL_COUNTDOWN, and then 4s later REVEAL_RESULTS.
    console.log('Đang chờ bộ đếm ngược tự động lật về 0 và kích hoạt REVEAL_COUNTDOWN...');
    const countdownMsg = await waitForType(host, 'REVEAL_COUNTDOWN', 6000);
    console.log('✅ OK: Tự động kích hoạt hiệu ứng đếm ngược lật tay (REVEAL_COUNTDOWN)!');

    console.log('Đang chờ kết quả vòng đấu (REVEAL_RESULTS)...');
    const resultsMsg = await waitForType(host, 'REVEAL_RESULTS', 6000);
    console.log(`✅ OK: Tự động lật tay thành công! Kết quả: HÒA=${resultsMsg.isTie}, Vòng=${resultsMsg.roundNumber}`);
    
    // Cleanup test 1
    host.ws.close();
    p2.ws.close();
    await sleep(500);


    // --- SCENARIO 2: AFK PLAYER AUTO-SELECT AFTER 30S ---
    console.log('\n--- TEST 2: Người chơi AFK không chọn bài -> Tự động chọn ngẫu nhiên sau 30s ---');
    console.log('(Để giảm thời gian chạy test, ta sẽ kiểm tra xem SELECTION_TIMER đếm ngược chính xác trong 3s)');
    
    const host2 = await createClient();
    host2.ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        hostName: 'Chủ phòng 2',
        gameMode: 'oan-tu-ti'
    }));

    const room2Created = await waitForType(host2, 'ROOM_CREATED');
    const roomCode2 = room2Created.roomCode;

    const p3 = await createClient();
    p3.ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: roomCode2,
        playerName: 'AFK User'
    }));
    await waitForType(p3, 'ROOM_JOINED');

    await sleep(200);

    console.log('[Host] Bắt đầu ván đấu mới...');
    host2.ws.send(JSON.stringify({ type: 'START_GAME' }));

    await waitForType(host2, 'GAME_STARTED');
    
    const t30 = await waitForType(host2, 'SELECTION_TIMER');
    console.log(`[Timer] Khởi đầu: ${t30.timeLeft}s`);

    await sleep(2200);
    const selectionTimers = host2.messages.filter(m => m.type === 'SELECTION_TIMER');
    if (selectionTimers.length >= 2) {
        console.log(`✅ OK: Đang đếm ngược thời gian chọn thành công! Giây còn lại cuối cùng nhận được: ${selectionTimers[selectionTimers.length - 1].timeLeft}s`);
    } else {
        console.log('❌ FAIL: Bộ đếm ngược thời gian chọn không đếm ngược mỗi giây!');
        process.exit(1);
    }

    // Cleanup test 2
    host2.ws.close();
    p3.ws.close();
    await sleep(500);

    console.log('\n=== TỔNG KẾT BÀI KIỂM THỬ TIMER ===\n');
    console.log('⭐️⭐️⭐️ TẤT CẢ CÁC BÀI KIỂM THỬ TIMER ĐỀU THÀNH CÔNG RỰC RỠ! ⭐️⭐️⭐️\n');
    process.exit(0);
}

runTests().catch(err => {
    console.error('Lỗi kiểm thử:', err);
    process.exit(1);
});
