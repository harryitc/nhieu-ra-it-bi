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

function waitForType(client, type, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${type}`)), timeout);
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
    console.log('=== BẮT ĐẦU KIỂM THỬ KẾT NỐI LẠI & PHỤC HỒI PHIÊN (RECONNECTION & SESSION RECOVERY) ===\n');

    // --- TEST 1: Disconnect + REJOIN_ROOM ---
    console.log('--- TEST 1: Người chơi mất kết nối, sau đó kết nối lại bằng REJOIN_ROOM ---');

    const host = await createClient();
    host.ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        hostName: 'Host Test',
        gameMode: 'majority-out'
    }));

    const roomCreated = await waitForType(host, 'ROOM_CREATED');
    const roomCode = roomCreated.roomCode;
    const hostId = roomCreated.player.id;
    console.log(`[Host] Phòng được tạo: ${roomCode}`);

    // Player 2 joins
    const p2 = await createClient();
    p2.ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: roomCode,
        playerName: 'Người Chơi B'
    }));

    const p2Joined = await waitForType(p2, 'ROOM_JOINED');
    const p2Id = p2Joined.player.id;
    console.log(`[P2] Vào phòng thành công, id: ${p2Id}`);

    await sleep(200);
    host.messages.length = 0;

    // P2 disconnects (simulating F5/network loss)
    console.log('[P2] Đang mô phỏng mất kết nối...');
    p2.ws.close();
    
    // Host should receive system message about disconnection
    await sleep(500);
    const disconnectChat = host.messages.find(m => m.type === 'CHAT_MESSAGE' && m.message.includes('mất kết nối'));
    if (disconnectChat) {
        console.log(`✅ OK: Host nhận thông báo mất kết nối: "${disconnectChat.message}"`);
    } else {
        console.log('❌ FAIL: Host không nhận thông báo mất kết nối!');
        process.exit(1);
    }

    // Host should receive updated player list (P2 removed from online view)
    const listUpdate = host.messages.find(m => m.type === 'PLAYER_LIST_UPDATE');
    if (listUpdate && listUpdate.players.length === 1) {
        console.log(`✅ OK: Danh sách chỉ còn ${listUpdate.players.length} người chơi online sau khi P2 mất kết nối.`);
    } else {
        console.log('❌ FAIL: Danh sách người chơi không cập nhật đúng!');
        process.exit(1);
    }
    host.messages.length = 0;

    // P2 reconnects via REJOIN_ROOM
    console.log('[P2] Đang kết nối lại bằng REJOIN_ROOM...');
    const p2Reconnect = await createClient();
    p2Reconnect.ws.send(JSON.stringify({
        type: 'REJOIN_ROOM',
        roomCode: roomCode,
        playerId: p2Id,
        playerName: 'Người Chơi B'
    }));

    const rejoinResult = await waitForType(p2Reconnect, 'ROOM_JOINED');
    if (rejoinResult && rejoinResult.player.id === p2Id && rejoinResult.isReconnect === true) {
        console.log(`✅ OK: P2 kết nối lại thành công! ID giữ nguyên: ${rejoinResult.player.id}, isReconnect: true`);
    } else {
        console.log('❌ FAIL: Kết nối lại thất bại hoặc không đúng dữ liệu!');
        process.exit(1);
    }

    // Host should receive reconnection chat message
    await sleep(300);
    const reconnectChat = host.messages.find(m => m.type === 'CHAT_MESSAGE' && m.message.includes('kết nối lại'));
    if (reconnectChat) {
        console.log(`✅ OK: Host nhận thông báo kết nối lại: "${reconnectChat.message}"`);
    } else {
        console.log('❌ FAIL: Host không nhận thông báo kết nối lại!');
        process.exit(1);
    }

    // Host should see 2 players online again
    const listAfterReconnect = host.messages.filter(m => m.type === 'PLAYER_LIST_UPDATE').pop();
    if (listAfterReconnect && listAfterReconnect.players.length === 2) {
        console.log(`✅ OK: Danh sách lại có ${listAfterReconnect.players.length} người chơi online!\n`);
    } else {
        console.log('❌ FAIL: Danh sách người chơi không phục hồi đúng!');
        process.exit(1);
    }

    // Cleanup test 1
    host.ws.close();
    p2Reconnect.ws.close();
    await sleep(500);

    // --- TEST 2: JOIN_ROOM auto-reclaim by name ---
    console.log('--- TEST 2: Người chơi mất kết nối, vào lại bằng JOIN_ROOM (khớp tên) ---');

    const host2 = await createClient();
    host2.ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        hostName: 'Host Phòng 2',
        gameMode: 'majority-out'
    }));

    const room2Created = await waitForType(host2, 'ROOM_CREATED');
    const roomCode2 = room2Created.roomCode;
    console.log(`[Host2] Phòng được tạo: ${roomCode2}`);

    const playerC = await createClient();
    playerC.ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: roomCode2,
        playerName: 'Người Chơi C'
    }));

    const cJoined = await waitForType(playerC, 'ROOM_JOINED');
    const cId = cJoined.player.id;
    console.log(`[C] Vào phòng thành công, id: ${cId}`);

    await sleep(200);
    host2.messages.length = 0;

    // C disconnects
    console.log('[C] Mô phỏng mất kết nối...');
    playerC.ws.close();
    await sleep(500);

    // C reconnects with the same name via JOIN_ROOM (not REJOIN_ROOM)
    console.log('[C] Vào lại phòng bằng JOIN_ROOM với cùng tên...');
    const cReconnect = await createClient();
    cReconnect.ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: roomCode2,
        playerName: 'Người Chơi C'
    }));

    const cRejoinedViaJoin = await waitForType(cReconnect, 'ROOM_JOINED');
    if (cRejoinedViaJoin && cRejoinedViaJoin.player.id === cId && cRejoinedViaJoin.isReconnect === true) {
        console.log(`✅ OK: C kết nối lại qua JOIN_ROOM thành công! ID giữ nguyên: ${cRejoinedViaJoin.player.id}`);
    } else {
        console.log('❌ FAIL: JOIN_ROOM không tự động khớp người chơi offline!');
        process.exit(1);
    }

    // Cleanup test 2
    host2.ws.close();
    cReconnect.ws.close();
    await sleep(500);

    // --- TEST 3: LEAVE_ROOM deliberate leave ---
    console.log('\n--- TEST 3: Người chơi chủ động rời phòng bằng LEAVE_ROOM ---');

    const host3 = await createClient();
    host3.ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        hostName: 'Host Phòng 3',
        gameMode: 'majority-out'
    }));

    const room3Created = await waitForType(host3, 'ROOM_CREATED');
    const roomCode3 = room3Created.roomCode;
    console.log(`[Host3] Phòng được tạo: ${roomCode3}`);

    const playerD = await createClient();
    playerD.ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: roomCode3,
        playerName: 'Người Chơi D'
    }));

    const dJoined = await waitForType(playerD, 'ROOM_JOINED');
    const dId = dJoined.player.id;
    console.log(`[D] Vào phòng thành công, id: ${dId}`);

    await sleep(200);
    host3.messages.length = 0;

    // D sends LEAVE_ROOM
    console.log('[D] Gửi LEAVE_ROOM (chủ động rời phòng)...');
    playerD.ws.send(JSON.stringify({ type: 'LEAVE_ROOM' }));

    const leaveConfirmed = await waitForType(playerD, 'LEAVE_CONFIRMED');
    if (leaveConfirmed) {
        console.log('✅ OK: D nhận LEAVE_CONFIRMED!');
    } else {
        console.log('❌ FAIL: D không nhận LEAVE_CONFIRMED!');
        process.exit(1);
    }

    // Host should get system message "rời phòng"
    await sleep(300);
    const leaveChat = host3.messages.find(m => m.type === 'CHAT_MESSAGE' && m.message.includes('rời phòng'));
    if (leaveChat) {
        console.log(`✅ OK: Host nhận thông báo rời phòng: "${leaveChat.message}"`);
    } else {
        console.log('❌ FAIL: Host không nhận thông báo rời phòng!');
        process.exit(1);
    }

    // After deliberate leave, D cannot rejoin with same ID (slot is removed)
    console.log('[D] Thử REJOIN_ROOM sau khi đã chủ động rời phòng...');
    const dRejoiner = await createClient();
    dRejoiner.ws.send(JSON.stringify({
        type: 'REJOIN_ROOM',
        roomCode: roomCode3,
        playerId: dId,
        playerName: 'Người Chơi D'
    }));

    const rejoinFailed = await waitForType(dRejoiner, 'REJOIN_FAILED');
    if (rejoinFailed) {
        console.log(`✅ OK: REJOIN_ROOM thất bại đúng kỳ vọng: "${rejoinFailed.message}"`);
    } else {
        console.log('❌ FAIL: REJOIN_ROOM không trả về REJOIN_FAILED!');
        process.exit(1);
    }

    // Cleanup test 3
    host3.ws.close();
    playerD.ws.close();
    dRejoiner.ws.close();
    await sleep(500);

    // --- TEST 4: Host disconnect + reconnect, host transfer ---
    console.log('\n--- TEST 4: Chủ phòng mất kết nối, quyền Host chuyển cho người khác, chủ phòng cũ kết nối lại ---');

    const host4 = await createClient();
    host4.ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        hostName: 'Host Gốc',
        gameMode: 'majority-out'
    }));

    const room4Created = await waitForType(host4, 'ROOM_CREATED');
    const roomCode4 = room4Created.roomCode;
    const host4Id = room4Created.player.id;
    console.log(`[Host4] Phòng được tạo: ${roomCode4}, id: ${host4Id}`);

    const playerE = await createClient();
    playerE.ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: roomCode4,
        playerName: 'Người Chơi E'
    }));

    const eJoined = await waitForType(playerE, 'ROOM_JOINED');
    console.log(`[E] Vào phòng thành công`);

    await sleep(200);
    playerE.messages.length = 0;

    // Host disconnects
    console.log('[Host4] Mô phỏng mất kết nối...');
    host4.ws.close();
    await sleep(500);

    // E should now be host
    const listAfterHostDC = playerE.messages.filter(m => m.type === 'PLAYER_LIST_UPDATE').pop();
    if (listAfterHostDC) {
        const ePlayer = listAfterHostDC.players.find(p => p.name === 'Người Chơi E');
        if (ePlayer && ePlayer.isHost) {
            console.log('✅ OK: Quyền Host đã chuyển cho E sau khi Host gốc mất kết nối!');
        } else {
            console.log('❌ FAIL: Quyền Host không chuyển đúng!');
            process.exit(1);
        }
    }

    // Old host reconnects via REJOIN_ROOM
    console.log('[Host4] Kết nối lại bằng REJOIN_ROOM...');
    const host4Reconnect = await createClient();
    host4Reconnect.ws.send(JSON.stringify({
        type: 'REJOIN_ROOM',
        roomCode: roomCode4,
        playerId: host4Id,
        playerName: 'Host Gốc'
    }));

    const host4Rejoined = await waitForType(host4Reconnect, 'ROOM_JOINED');
    if (host4Rejoined && host4Rejoined.player.id === host4Id) {
        console.log(`✅ OK: Host gốc kết nối lại thành công! ID: ${host4Rejoined.player.id}, isHost: ${host4Rejoined.player.isHost}`);
        // Note: Host rights were transferred to E, so old host should NOT be host anymore
        if (!host4Rejoined.player.isHost) {
            console.log('✅ OK: Host gốc không còn là Host (quyền đã chuyển cho E) - ĐÚNG!');
        }
    } else {
        console.log('❌ FAIL: Host gốc kết nối lại thất bại!');
        process.exit(1);
    }

    // Cleanup test 4
    host4Reconnect.ws.close();
    playerE.ws.close();
    await sleep(300);

    console.log('\n=== TỔNG KẾT BÀI KIỂM THỬ KẾT NỐI LẠI ===\n');
    console.log('⭐️⭐️⭐️ TẤT CẢ CÁC BÀI KIỂM THỬ RECONNECTION ĐỀU THÀNH CÔNG RỰC RỠ! ⭐️⭐️⭐️\n');
    process.exit(0);
}

runTests().catch(err => {
    console.error('Lỗi kiểm thử:', err);
    process.exit(1);
});
