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

// ==========================================================================
// SURVIVAL GAME — 4 modes: classic | battle | race | hunger
// ==========================================================================
const SURV = {
    WORLD: 6000,
    MAX_FOOD:            { classic: 350, battle: 280 },
    FOOD_MASS:           1,
    START_MASS:          15,
    MIN_MASS:            3,
    TICK_RATE:           30,
    BASE_SPEED:          140,
    // Battle Royale
    BATTLE_ZONE_START:   25,
    BATTLE_ZONE_SHRINK:  170,
    BATTLE_ZONE_INIT:    0.68,
    BATTLE_ZONE_MIN:     120,
    BATTLE_ZONE_DMG:     1,         // 1 mass/sec outside zone
    BATTLE_RESET_DELAY:  6,
    // Weapons (battle)
    MAX_WEAPON_BOXES:    8,
    BULLET_SPEED:        500,
    BULLET_LIFETIME:     45,        // ticks
    BULLET_DAMAGE:       5,
    GUN_FIRE_TICKS:      25,
    MAX_WEAPON_LEVEL:    4,
    // Mana / Sprint (battle)
    MANA_MAX:            100,
    MANA_REGEN:          12,        // per sec
    MANA_DRAIN:          20,        // per sec when sprinting
    SPRINT_MULT:         1.6,
    COLORS: ['#ff4757','#2ed573','#1e90ff','#ffa502','#ff6b81','#a29bfe',
             '#00cec9','#fd79a8','#e17055','#6c5ce7','#00b894','#fdcb6e',
             '#55efc4','#74b9ff','#dfe6e9','#fab1a0']
};

const SURV_VALID_MODES = new Set(['classic','battle']);

function survRadius(mass) { return Math.sqrt(mass) * 5; }
function survSpeed(mass)  { return SURV.BASE_SPEED / Math.max(1, Math.pow(mass / SURV.START_MASS, 0.35)); }
function survRandPos()    { return 200 + Math.random() * (SURV.WORLD - 400); }

function createSurvWorld(mode) {
    return {
        mode,
        players:      new Map(),
        food:         new Map(),
        bullets:      mode === 'battle' ? new Map() : null,
        weaponBoxes:  mode === 'battle' ? new Map() : null,
        nextFoodId:   0,
        nextBulletId: 0,
        nextWBoxId:   0,
        tick:         0,
        interval:     null,
        roundNum:     1,
        winner:       null,
        resetAt:      0,
        zone: mode === 'battle' ? {
            cx: SURV.WORLD / 2, cy: SURV.WORLD / 2,
            r:  SURV.WORLD * SURV.BATTLE_ZONE_INIT,
            minR: SURV.BATTLE_ZONE_MIN,
            startTick: SURV.BATTLE_ZONE_START * SURV.TICK_RATE,
            shrinkRate: (SURV.WORLD * SURV.BATTLE_ZONE_INIT - SURV.BATTLE_ZONE_MIN)
                        / (SURV.BATTLE_ZONE_SHRINK * SURV.TICK_RATE)
        } : null
    };
}

// Lazily created world instances (one per mode)
const survWorlds = {};
function getSurvWorld(mode) {
    if (!survWorlds[mode]) survWorlds[mode] = createSurvWorld(mode);
    return survWorlds[mode];
}

function getGunAngles(level, aimAngle = 0) {
    const spreads = [null, [0], [-0.2, 0.2], [-0.28, 0, 0.28], [-0.4, -0.13, 0.13, 0.4]];
    const sp = spreads[Math.min(level, 4)] || [0];
    return sp.map(s => aimAngle + s);
}

function survSpawnWeaponBoxes(world) {
    if (!world.weaponBoxes) return;
    while (world.weaponBoxes.size < SURV.MAX_WEAPON_BOXES) {
        const id = 'wb' + world.nextWBoxId++;
        world.weaponBoxes.set(id, {
            id,
            x: 400 + Math.random() * (SURV.WORLD - 800),
            y: 400 + Math.random() * (SURV.WORLD - 800),
        });
    }
}

function survSpawnFood(world) {
    const cap = SURV.MAX_FOOD[world.mode] || 350;
    while (world.food.size < cap) {
        const id = 'f' + world.nextFoodId++;
        world.food.set(id, {
            id,
            x: 50 + Math.random() * (SURV.WORLD - 100),
            y: 50 + Math.random() * (SURV.WORLD - 100),
            color: SURV.COLORS[Math.floor(Math.random() * SURV.COLORS.length)]
        });
    }
}

function survResetRound(world) {
    world.winner  = null;
    world.resetAt = 0;
    world.roundNum++;
    if (world.zone) {
        world.zone.r         = SURV.WORLD * SURV.BATTLE_ZONE_INIT;
        world.zone.startTick = world.tick + SURV.BATTLE_ZONE_START * SURV.TICK_RATE;
    }
    if (world.bullets) world.bullets.clear();
    for (const p of world.players.values()) {
        p.x = survRandPos(); p.y = survRandPos();
        p.mass = SURV.START_MASS; p.r = survRadius(SURV.START_MASS);
        p.dx = 0; p.dy = 0; p.alive = true;
        p.weaponLevel = 0; p.mana = SURV.MANA_MAX; p.shootTimer = 0; p.aimAngle = 0; p.shooting = false;
        delete p.respawnAt;
    }
    console.log(`[SURVIVAL:${world.mode}] Round ${world.roundNum} started`);
}

function survKillPlayer(world, p, killedBy) {
    p.alive = false;
    if (p.ws) {
        sendToPlayer(p.ws, {
            type: 'SURVIVAL_DIED',
            killedBy,
            mass: Math.floor(p.mass),
            mode: world.mode
        });
    }
}

function survTick(world) {
    const DT = 1 / SURV.TICK_RATE;
    world.tick++;

    // ── Auto-reset countdown ─────────────────────────────────────────────
    if (world.resetAt > 0 && world.tick >= world.resetAt) {
        survResetRound(world);
    }

    // ── Mana regen/drain (battle) ─────────────────────────────────────────
    if (world.mode === 'battle') {
        for (const p of world.players.values()) {
            if (!p.alive) continue;
            if (p.sprint && p.mana > 0) {
                p.mana = Math.max(0, p.mana - SURV.MANA_DRAIN * DT);
            } else {
                p.mana = Math.min(SURV.MANA_MAX, p.mana + SURV.MANA_REGEN * DT);
            }
        }
    }

    // ── Move players ──────────────────────────────────────────────────────
    for (const p of world.players.values()) {
        if (!p.alive) continue;
        const isSprinting = world.mode === 'battle' && p.sprint && p.mana > 0;
        const spd = survSpeed(p.mass) * (isSprinting ? SURV.SPRINT_MULT : 1);
        const len = Math.sqrt(p.dx * p.dx + p.dy * p.dy);
        if (len > 0.01) {
            p.x = Math.max(p.r, Math.min(SURV.WORLD - p.r, p.x + (p.dx / len) * spd * DT));
            p.y = Math.max(p.r, Math.min(SURV.WORLD - p.r, p.y + (p.dy / len) * spd * DT));
        }
    }

    // ── Battle: zone shrink + zone damage ────────────────────────────────
    if (world.mode === 'battle' && world.zone && !world.winner) {
        const z = world.zone;
        if (world.tick >= z.startTick && z.r > z.minR) {
            z.r = Math.max(z.minR, z.r - z.shrinkRate);
        }
        for (const p of world.players.values()) {
            if (!p.alive) continue;
            const dx = p.x - z.cx, dy = p.y - z.cy;
            if (dx * dx + dy * dy > z.r * z.r) {
                p.mass -= SURV.BATTLE_ZONE_DMG * DT;
                p.r = survRadius(Math.max(1, p.mass));
                if (p.mass < SURV.MIN_MASS) survKillPlayer(world, p, 'vùng nguy hiểm');
            }
        }
    }

    // ── Battle: weapon box pickup ─────────────────────────────────────────
    if (world.mode === 'battle' && world.weaponBoxes) {
        for (const p of world.players.values()) {
            if (!p.alive) continue;
            for (const [wbId, wb] of world.weaponBoxes) {
                const ddx = p.x - wb.x, ddy = p.y - wb.y;
                if (ddx * ddx + ddy * ddy < (p.r + 22) * (p.r + 22)) {
                    if (p.weaponLevel < SURV.MAX_WEAPON_LEVEL) p.weaponLevel++;
                    world.weaponBoxes.delete(wbId);
                    setTimeout(() => {
                        if (world.weaponBoxes && world.interval) {
                            const rid = 'wb' + world.nextWBoxId++;
                            world.weaponBoxes.set(rid, {
                                id: rid,
                                x: 400 + Math.random() * (SURV.WORLD - 800),
                                y: 400 + Math.random() * (SURV.WORLD - 800),
                            });
                        }
                    }, 12000);
                    break;
                }
            }
        }
    }

    // ── Battle: guns fire bullets (left-click triggered) ─────────────────
    if (world.mode === 'battle' && world.bullets) {
        for (const p of world.players.values()) {
            if (!p.alive || p.weaponLevel === 0 || !p.shooting) continue;
            if (world.tick - p.shootTimer < SURV.GUN_FIRE_TICKS) continue;
            p.shootTimer = world.tick;
            const angles = getGunAngles(p.weaponLevel, p.aimAngle);
            for (const angle of angles) {
                const bid = 'b' + world.nextBulletId++;
                world.bullets.set(bid, {
                    id: bid, shooterId: p.id, shooterName: p.name, color: p.color,
                    x: p.x + Math.cos(angle) * p.r,
                    y: p.y + Math.sin(angle) * p.r,
                    vx: Math.cos(angle) * SURV.BULLET_SPEED,
                    vy: Math.sin(angle) * SURV.BULLET_SPEED,
                    life: SURV.BULLET_LIFETIME,
                });
            }
        }
    }

    // ── Battle: move bullets + collision ──────────────────────────────────
    if (world.mode === 'battle' && world.bullets) {
        for (const [bid, b] of world.bullets) {
            b.x += b.vx * DT; b.y += b.vy * DT; b.life--;
            if (b.life <= 0 || b.x < 0 || b.x > SURV.WORLD || b.y < 0 || b.y > SURV.WORLD) {
                world.bullets.delete(bid); continue;
            }
            let hit = false;
            for (const p of world.players.values()) {
                if (!p.alive || p.id === b.shooterId) continue;
                const ddx = b.x - p.x, ddy = b.y - p.y;
                if (ddx * ddx + ddy * ddy < p.r * p.r) {
                    p.mass = Math.max(SURV.MIN_MASS, p.mass - SURV.BULLET_DAMAGE);
                    p.r = survRadius(p.mass);
                    if (p.mass <= SURV.MIN_MASS) survKillPlayer(world, p, b.shooterName + ' (súng)');
                    hit = true; break;
                }
            }
            if (hit) world.bullets.delete(bid);
        }
    }

    // ── Players eat food ──────────────────────────────────────────────────
    for (const p of world.players.values()) {
        if (!p.alive) continue;
        const rSq = p.r * p.r;
        for (const [fid, f] of world.food) {
            const dx = p.x - f.x, dy = p.y - f.y;
            if (dx * dx + dy * dy < rSq) {
                p.mass += SURV.FOOD_MASS;
                p.r = survRadius(p.mass);
                world.food.delete(fid);
            }
        }
    }

    // ── Players eat players ────────────────────────────────────────────────
    const alive = [...world.players.values()].filter(p => p.alive);
    for (let i = 0; i < alive.length; i++) {
        for (let j = i + 1; j < alive.length; j++) {
            const a = alive[i], b = alive[j];
            if (!a.alive || !b.alive) continue;
            const dx = a.x - b.x, dy = a.y - b.y;
            const dSq = dx * dx + dy * dy;
            if (a.r > b.r * 1.1 && dSq < a.r * a.r) {
                a.mass += b.mass; a.r = survRadius(a.mass);
                survKillPlayer(world, b, a.name);
            } else if (b.r > a.r * 1.1 && dSq < b.r * b.r) {
                b.mass += a.mass; b.r = survRadius(b.mass);
                survKillPlayer(world, a, b.name);
            }
        }
    }

    // ── Win condition (battle) ────────────────────────────────────────────
    if (world.mode === 'battle' && !world.winner && world.resetAt === 0) {
        const stillAlive = [...world.players.values()].filter(p => p.alive);
        if (world.players.size >= 2 && stillAlive.length <= 1) {
            const w = stillAlive[0];
            world.winner = w
                ? { name: w.name, color: w.color, mass: Math.floor(w.mass) }
                : { name: 'Không ai', color: '#aaa', mass: 0 };
            world.resetAt = world.tick + SURV.BATTLE_RESET_DELAY * SURV.TICK_RATE;
        }
    }

    survSpawnFood(world);

    // ── Build leaderboard ─────────────────────────────────────────────────
    const leaderboard = [...world.players.values()]
        .filter(p => p.alive)
        .sort((a, b) => b.mass - a.mass)
        .slice(0, 10)
        .map(p => ({ id: p.id, name: p.name, mass: Math.floor(p.mass), color: p.color }));

    const zoneData = world.zone
        ? { cx: Math.round(world.zone.cx), cy: Math.round(world.zone.cy), r: Math.round(world.zone.r) }
        : null;

    const resetCountdown = world.resetAt > 0
        ? Math.ceil((world.resetAt - world.tick) / SURV.TICK_RATE)
        : 0;

    const stateMsg = JSON.stringify({
        type:        'SURVIVAL_STATE',
        mode:        world.mode,
        tick:        world.tick,
        roundNum:    world.roundNum,
        players:     [...world.players.values()].map(p => ({
            id: p.id, name: p.name,
            x: Math.round(p.x), y: Math.round(p.y), r: Math.round(p.r),
            color: p.color, alive: p.alive,
            weaponLevel: p.weaponLevel || 0,
            mana: world.mode === 'battle' ? Math.round(p.mana) : undefined,
            aimAngle: p.aimAngle || 0,
        })),
        food:        [...world.food.values()],
        leaderboard,
        zone:        zoneData,
        winner:      world.winner,
        resetCountdown,
        bullets:     world.bullets ? [...world.bullets.values()].map(b => ({
            id: b.id, x: Math.round(b.x), y: Math.round(b.y), color: b.color
        })) : null,
        weaponBoxes: world.weaponBoxes ? [...world.weaponBoxes.values()].map(wb => ({
            id: wb.id, x: Math.round(wb.x), y: Math.round(wb.y)
        })) : null,
    });

    for (const p of world.players.values()) {
        if (p.ws && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(stateMsg);
        }
    }
}

function survStart(world) {
    if (world.interval) return;
    survSpawnFood(world);
    if (world.mode === 'battle') survSpawnWeaponBoxes(world);
    world.interval = setInterval(() => survTick(world), 1000 / SURV.TICK_RATE);
    console.log(`[SURVIVAL:${world.mode}] Game loop started`);
}

function survStop(world) {
    if (!world.interval) return;
    clearInterval(world.interval);
    world.interval = null;
    console.log(`[SURVIVAL:${world.mode}] Game loop stopped`);
}

function survPlayerLeave(mode, playerId) {
    const world = survWorlds[mode];
    if (!world) return;
    world.players.delete(playerId);
    if (world.players.size === 0) survStop(world);
}
// ==========================================================================

// ==========================================================================
// PAPER.IO — territory-claiming arena (grid-based, players + bots)
// ==========================================================================
const PIO = {
    GRID:               60,        // grid width/height in cells
    CELL:               32,        // pixel size of one cell (client uses this)
    TICK_RATE:          15,        // ticks per second (= cell moves per second)
    BROADCAST_EVERY:    1,         // broadcast every N ticks
    START_AREA:         3,         // size of starting territory square (3x3)
    MIN_PLAYERS:        4,         // bots fill up to this count when humans <4
    MAX_PLAYERS:        12,
    MAX_BOTS:           6,
    BOT_NAMES: ['Linh','Minh','Hà','Long','Vy','Tú','Hân','Bảo','Khôi','Trí','Nga','Lan','Phong','Đạt','Quyên'],
    COLORS: ['#ff4757','#2ed573','#1e90ff','#ffa502','#ff6b81','#a29bfe',
             '#00cec9','#fd79a8','#e17055','#6c5ce7','#00b894','#fdcb6e',
             '#55efc4','#74b9ff','#dfe6e9','#fab1a0'],
    DIR_DX: { up: 0, down: 0, left: -1, right: 1 },
    DIR_DY: { up: -1, down: 1, left: 0, right: 0 },
    OPPOSITE: { up: 'down', down: 'up', left: 'right', right: 'left' },
    ROUND_END_DELAY:   8,          // seconds to show winner before reset
    AUTO_WIN_PCT:      1.0         // must own 100% of map (every cell) to win
};

// Slot index 0..(MAX_PLAYERS-1) → playerId. Used as compact grid encoding (byte per cell).
// owner byte:  0=empty, 1..MAX_PLAYERS=playerSlot+1
// trail byte:  0=no trail, 1..MAX_PLAYERS=playerSlot+1
let pioWorld = null;

function pioCreateWorld() {
    const N = PIO.GRID;
    return {
        owner:      new Uint8Array(N * N),   // ownership grid
        trail:      new Uint8Array(N * N),   // trail grid
        players:    new Map(),                // id -> player
        slots:      new Array(PIO.MAX_PLAYERS).fill(null),  // slot -> id (or null)
        tick:       0,
        interval:   null,
        roundNum:   1,
        winner:     null,                     // { name, color, slot, pct }
        resetAt:    0,
        events:     []                        // claim events for client SFX
    };
}

function pioCellIdx(x, y) { return y * PIO.GRID + x; }
function pioInBounds(x, y) { return x >= 0 && y >= 0 && x < PIO.GRID && y < PIO.GRID; }

function pioAllocSlot(world) {
    for (let i = 0; i < PIO.MAX_PLAYERS; i++) {
        if (world.slots[i] === null) return i;
    }
    return -1;
}

function pioFindFreeSpawn(world) {
    // try up to 40 random spots that don't collide with existing territories
    const N = PIO.GRID, A = PIO.START_AREA, M = 2;
    for (let attempt = 0; attempt < 40; attempt++) {
        const gx = M + Math.floor(Math.random() * (N - A - M * 2));
        const gy = M + Math.floor(Math.random() * (N - A - M * 2));
        let clear = true;
        // check small expanded box for collision with other territories
        for (let y = gy - 1; y < gy + A + 1 && clear; y++) {
            for (let x = gx - 1; x < gx + A + 1 && clear; x++) {
                if (pioInBounds(x, y) && world.owner[pioCellIdx(x, y)] !== 0) clear = false;
            }
        }
        if (clear) return { gx, gy };
    }
    return { gx: M, gy: M };
}

function pioPaintStartArea(world, slot, gx, gy) {
    const A = PIO.START_AREA;
    const slotByte = slot + 1;
    for (let y = gy; y < gy + A; y++) {
        for (let x = gx; x < gx + A; x++) {
            if (pioInBounds(x, y)) world.owner[pioCellIdx(x, y)] = slotByte;
        }
    }
}

function pioCreatePlayer(world, name, color, isBot, ws) {
    const slot = pioAllocSlot(world);
    if (slot < 0) return null;
    const id  = (isBot ? 'pb-' : 'pp-') + Date.now() + '-' + Math.floor(Math.random() * 9999);
    const sp  = pioFindFreeSpawn(world);
    const cx  = sp.gx + Math.floor(PIO.START_AREA / 2);
    const cy  = sp.gy + Math.floor(PIO.START_AREA / 2);
    const p = {
        id, name, color, slot, isBot, ws,
        gx: cx, gy: cy,
        dir: ['up','down','left','right'][Math.floor(Math.random()*4)],
        nextDir: null,
        alive: true,
        respawnAt: 0,
        // bot AI state
        botGoal: null,
        botStepsSinceTurn: 0
    };
    pioPaintStartArea(world, slot, sp.gx, sp.gy);
    world.players.set(id, p);
    world.slots[slot] = id;
    return p;
}

function pioKillPlayer(world, p, killedByName) {
    if (!p.alive) return;
    p.alive = false;
    // clear their trail from grid
    const slotByte = p.slot + 1;
    for (let i = 0; i < world.trail.length; i++) {
        if (world.trail[i] === slotByte) world.trail[i] = 0;
    }
    if (p.ws) {
        sendToPlayer(p.ws, { type: 'PAPERIO_DIED', killedBy: killedByName || 'va chạm' });
    }
    if (p.isBot) {
        // bots respawn after 3s
        p.respawnAt = world.tick + 3 * PIO.TICK_RATE;
    }
}

function pioRespawnBot(world, p) {
    // clear any leftover owned cells (death of bot = release territory back to empty)
    const slotByte = p.slot + 1;
    for (let i = 0; i < world.owner.length; i++) {
        if (world.owner[i] === slotByte) world.owner[i] = 0;
        if (world.trail[i] === slotByte) world.trail[i] = 0;
    }
    const sp = pioFindFreeSpawn(world);
    p.gx = sp.gx + Math.floor(PIO.START_AREA / 2);
    p.gy = sp.gy + Math.floor(PIO.START_AREA / 2);
    p.dir = ['up','down','left','right'][Math.floor(Math.random()*4)];
    p.nextDir = null;
    p.alive = true;
    p.respawnAt = 0;
    pioPaintStartArea(world, p.slot, sp.gx, sp.gy);
}

// Flood fill from grid boundary across cells that are NOT walls (= this player's owner or trail).
// All cells not reached become owned by slot (= the enclosed region + the wall trail itself).
function pioClaimEnclosed(world, p) {
    const N = PIO.GRID;
    const slotByte = p.slot + 1;
    const visited = new Uint8Array(N * N);
    const stack = [];
    const isWall = (idx) => world.owner[idx] === slotByte || world.trail[idx] === slotByte;

    // seed boundary cells that aren't walls
    for (let x = 0; x < N; x++) {
        const i0 = pioCellIdx(x, 0), i1 = pioCellIdx(x, N - 1);
        if (!isWall(i0)) { visited[i0] = 1; stack.push([x, 0]); }
        if (!isWall(i1)) { visited[i1] = 1; stack.push([x, N - 1]); }
    }
    for (let y = 0; y < N; y++) {
        const i0 = pioCellIdx(0, y), i1 = pioCellIdx(N - 1, y);
        if (!isWall(i0)) { visited[i0] = 1; stack.push([0, y]); }
        if (!isWall(i1)) { visited[i1] = 1; stack.push([N - 1, y]); }
    }

    while (stack.length) {
        const [x, y] = stack.pop();
        const nbrs = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
        for (const [nx, ny] of nbrs) {
            if (!pioInBounds(nx, ny)) continue;
            const idx = pioCellIdx(nx, ny);
            if (visited[idx]) continue;
            if (isWall(idx)) continue;
            visited[idx] = 1;
            stack.push([nx, ny]);
        }
    }

    // Cells not reached = enclosed region or the trail/owner walls themselves → become owned by this player.
    let claimed = 0;
    for (let i = 0; i < N * N; i++) {
        if (!visited[i]) {
            const prev = world.owner[i];
            if (prev !== slotByte) {
                world.owner[i] = slotByte;
                claimed++;
            }
            // clear any trail bit inside the claimed region (including other players' trails)
            world.trail[i] = 0;
        }
    }

    if (claimed > 0) {
        world.events.push({ type: 'claim', slot: p.slot, count: claimed });
    }

    return claimed;
}

function pioCountTerritory(world, slot) {
    const b = slot + 1;
    let c = 0;
    for (let i = 0; i < world.owner.length; i++) if (world.owner[i] === b) c++;
    return c;
}

// Simple bot AI: pick next direction
function pioBotDecide(world, p) {
    const slotByte = p.slot + 1;
    const N = PIO.GRID;
    const valid = ['up','down','left','right'].filter(d => d !== PIO.OPPOSITE[p.dir]);

    // score each direction
    const scored = valid.map(d => {
        const dx = PIO.DIR_DX[d], dy = PIO.DIR_DY[d];
        let score = Math.random() * 0.3;
        let lookahead = 0;
        let nx = p.gx, ny = p.gy;
        let safe = true;

        for (let step = 1; step <= 6; step++) {
            nx += dx; ny += dy;
            if (!pioInBounds(nx, ny)) { safe = false; break; }
            const idx = pioCellIdx(nx, ny);
            // own trail = closes a loop & claims (now positive)
            if (world.trail[idx] === slotByte) { score += 1.2; break; }
            // own territory = safe but boring (lower score)
            if (world.owner[idx] === slotByte) score -= 0.05;
            // someone else's trail = great target (cuts them)
            if (world.trail[idx] !== 0 && world.trail[idx] !== slotByte) score += 2.5;
            lookahead++;
        }
        if (!safe) score -= 100;

        // prefer to head back home when far from territory
        // distance to nearest own cell
        // sample nearest cell roughly: scan a few rings
        score += 0.5; // slight bias to keep moving
        return { d, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (best && best.score > -50) {
        const turnChance = (best.d !== p.dir) ? 0.35 : 0.85;
        if (Math.random() < turnChance) p.nextDir = best.d;
    }
}

function pioTick(world) {
    world.tick++;

    // round reset
    if (world.resetAt > 0 && world.tick >= world.resetAt) {
        pioResetRound(world);
    }

    // respawn dead bots
    for (const p of world.players.values()) {
        if (!p.alive && p.isBot && p.respawnAt > 0 && world.tick >= p.respawnAt) {
            pioRespawnBot(world, p);
        }
    }

    // run bot AI every 2 ticks
    if (world.tick % 2 === 0) {
        for (const p of world.players.values()) {
            if (p.alive && p.isBot) pioBotDecide(world, p);
        }
    }

    // move each alive player by 1 cell
    if (!world.winner) {
        for (const p of world.players.values()) {
            if (!p.alive) continue;
            if (p.nextDir && p.nextDir !== PIO.OPPOSITE[p.dir]) {
                p.dir = p.nextDir;
                p.nextDir = null;
            }
            const dx = PIO.DIR_DX[p.dir], dy = PIO.DIR_DY[p.dir];
            const nx = p.gx + dx, ny = p.gy + dy;

            // boundary kill
            if (!pioInBounds(nx, ny)) {
                pioKillPlayer(world, p, 'va biên');
                continue;
            }

            // step onto next cell
            p.gx = nx; p.gy = ny;
            const idx = pioCellIdx(nx, ny);
            const slotByte = p.slot + 1;

            // hit own trail = close loop & claim enclosed area
            if (world.trail[idx] === slotByte) {
                pioClaimEnclosed(world, p);
                if (p.ws) sendToPlayer(p.ws, { type: 'PAPERIO_CLAIMED' });
                continue;
            }

            // hit other player's trail → cut them
            const otherTrailSlot = world.trail[idx];
            if (otherTrailSlot !== 0 && otherTrailSlot !== slotByte) {
                const victimId = world.slots[otherTrailSlot - 1];
                if (victimId) {
                    const victim = world.players.get(victimId);
                    if (victim) pioKillPlayer(world, victim, p.name);
                }
            }

            // determine if currently INSIDE own territory
            const onOwn = world.owner[idx] === slotByte;

            if (!onOwn) {
                // leave trail behind on this cell
                world.trail[idx] = slotByte;
            } else {
                // re-entered own territory → claim if had any trail
                let hadTrail = false;
                for (let i = 0; i < world.trail.length; i++) {
                    if (world.trail[i] === slotByte) { hadTrail = true; break; }
                }
                if (hadTrail) {
                    pioClaimEnclosed(world, p);
                    if (p.ws) sendToPlayer(p.ws, { type: 'PAPERIO_CLAIMED' });
                }
            }
        }
    }

    // head-to-head: anyone OFF their own territory at the shared cell dies.
    // If everyone is off, all of them die.
    if (!world.winner) {
        const alive = [...world.players.values()].filter(p => p.alive);
        const byCell = new Map();
        for (const p of alive) {
            const k = p.gx + ',' + p.gy;
            const list = byCell.get(k) || [];
            list.push(p);
            byCell.set(k, list);
        }
        for (const list of byCell.values()) {
            if (list.length < 2) continue;
            const safe = [];
            const vulnerable = [];
            for (const pp of list) {
                const onOwn = world.owner[pioCellIdx(pp.gx, pp.gy)] === pp.slot + 1;
                (onOwn ? safe : vulnerable).push(pp);
            }
            if (safe.length > 0) {
                const killerName = safe[0].name;
                for (const v of vulnerable) pioKillPlayer(world, v, killerName);
            } else {
                for (const pp of list) pioKillPlayer(world, pp, 'va chạm');
            }
        }
    }

    // win condition: someone owns >= AUTO_WIN_PCT of map
    if (!world.winner && world.resetAt === 0) {
        const total = PIO.GRID * PIO.GRID;
        for (const p of world.players.values()) {
            if (!p.alive) continue;
            const cnt = pioCountTerritory(world, p.slot);
            if (cnt / total >= PIO.AUTO_WIN_PCT) {
                world.winner = { name: p.name, color: p.color, slot: p.slot, pct: Math.round(cnt * 100 / total) };
                world.resetAt = world.tick + PIO.ROUND_END_DELAY * PIO.TICK_RATE;
                break;
            }
        }
    }

    // refill bots if humans + bots < MIN_PLAYERS
    const humanCount = [...world.players.values()].filter(p => !p.isBot).length;
    const botCount   = [...world.players.values()].filter(p => p.isBot).length;
    const needBots   = Math.min(PIO.MAX_BOTS, Math.max(0, PIO.MIN_PLAYERS - humanCount) - botCount);
    if (humanCount > 0 && needBots > 0 && world.tick % 30 === 0) {
        for (let i = 0; i < needBots; i++) {
            const usedNames = new Set([...world.players.values()].map(p => p.name));
            const candidates = PIO.BOT_NAMES.filter(n => !usedNames.has(n));
            const name = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)]
                                            : 'Bot' + Math.floor(Math.random() * 99);
            const usedColors = new Set([...world.players.values()].map(p => p.color));
            const palette = PIO.COLORS.filter(c => !usedColors.has(c));
            const color = palette.length ? palette[Math.floor(Math.random() * palette.length)] : PIO.COLORS[0];
            pioCreatePlayer(world, name, color, true, null);
        }
    }

    // ── Broadcast state ──
    if (world.tick % PIO.BROADCAST_EVERY !== 0) return;

    const playerStates = [...world.players.values()].map(p => ({
        id: p.id, name: p.name, color: p.color, slot: p.slot,
        gx: p.gx, gy: p.gy, dir: p.dir, alive: p.alive,
        isBot: p.isBot,
        ter: pioCountTerritory(world, p.slot)
    }));

    const leaderboard = playerStates
        .filter(p => p.alive)
        .sort((a, b) => b.ter - a.ter)
        .slice(0, 10)
        .map(p => ({ id: p.id, name: p.name, color: p.color, ter: p.ter, slot: p.slot }));

    const ownerB64 = Buffer.from(world.owner).toString('base64');
    const trailB64 = Buffer.from(world.trail).toString('base64');

    const total = PIO.GRID * PIO.GRID;
    const resetCountdown = world.resetAt > 0
        ? Math.ceil((world.resetAt - world.tick) / PIO.TICK_RATE) : 0;

    const events = world.events;
    world.events = [];

    const msg = JSON.stringify({
        type: 'PAPERIO_STATE',
        tick: world.tick,
        roundNum: world.roundNum,
        grid: PIO.GRID,
        cell: PIO.CELL,
        owner: ownerB64,
        trail: trailB64,
        players: playerStates,
        leaderboard,
        total,
        winner: world.winner,
        resetCountdown,
        events
    });

    for (const p of world.players.values()) {
        if (p.ws && p.ws.readyState === WebSocket.OPEN) p.ws.send(msg);
    }
}

function pioResetRound(world) {
    world.owner.fill(0);
    world.trail.fill(0);
    world.winner = null;
    world.resetAt = 0;
    world.roundNum++;
    for (const p of world.players.values()) {
        const sp = pioFindFreeSpawn(world);
        p.gx = sp.gx + Math.floor(PIO.START_AREA / 2);
        p.gy = sp.gy + Math.floor(PIO.START_AREA / 2);
        p.dir = ['up','down','left','right'][Math.floor(Math.random()*4)];
        p.nextDir = null;
        p.alive = true;
        p.respawnAt = 0;
        pioPaintStartArea(world, p.slot, sp.gx, sp.gy);
    }
    console.log(`[PAPERIO] Round ${world.roundNum} started`);
}

function pioStart() {
    if (!pioWorld) pioWorld = pioCreateWorld();
    if (pioWorld.interval) return;
    pioWorld.interval = setInterval(() => pioTick(pioWorld), 1000 / PIO.TICK_RATE);
    console.log('[PAPERIO] Game loop started');
}

function pioStop() {
    if (!pioWorld || !pioWorld.interval) return;
    clearInterval(pioWorld.interval);
    pioWorld.interval = null;
    console.log('[PAPERIO] Game loop stopped');
}

function pioPlayerLeave(playerId) {
    if (!pioWorld) return;
    const p = pioWorld.players.get(playerId);
    if (!p) return;
    // release ownership and trail
    const b = p.slot + 1;
    for (let i = 0; i < pioWorld.owner.length; i++) {
        if (pioWorld.owner[i] === b) pioWorld.owner[i] = 0;
        if (pioWorld.trail[i] === b) pioWorld.trail[i] = 0;
    }
    pioWorld.slots[p.slot] = null;
    pioWorld.players.delete(playerId);
    // stop loop if no humans left
    const humans = [...pioWorld.players.values()].filter(pp => !pp.isBot);
    if (humans.length === 0) {
        // also drop all bots
        for (const bp of [...pioWorld.players.values()]) {
            if (bp.isBot) {
                const bb = bp.slot + 1;
                for (let i = 0; i < pioWorld.owner.length; i++) {
                    if (pioWorld.owner[i] === bb) pioWorld.owner[i] = 0;
                    if (pioWorld.trail[i] === bb) pioWorld.trail[i] = 0;
                }
                pioWorld.slots[bp.slot] = null;
                pioWorld.players.delete(bp.id);
            }
        }
        pioStop();
    }
}
// ==========================================================================

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
        if (lobby.autoPlayAgainTimeout) {
            clearTimeout(lobby.autoPlayAgainTimeout);
            lobby.autoPlayAgainTimeout = null;
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
    if (lobby.autoPlayAgainTimeout) {
        clearTimeout(lobby.autoPlayAgainTimeout);
        lobby.autoPlayAgainTimeout = null;
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

// Helper: Reset and move to next round or complete new tournament/match (trận mới)
function executePlayAgain(lobby, roomCode) {
    if (lobby.autoPlayAgainTimeout) {
        clearTimeout(lobby.autoPlayAgainTimeout);
        lobby.autoPlayAgainTimeout = null;
    }

    if (lobby.ultimateLoserId === null) {
        // Tournament is still in progress -> NEXT ROUND!
        lobby.gameState = 'playing';
        lobby.roundNumber = (lobby.roundNumber || 1) + 1;

        lobby.players.forEach(p => {
            if (p.isSpectator) {
                p.isSpectator = false; // Promote spectators to active players when the round transitions!
            }
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
        broadcastToLobby(roomCode, {
            type: 'PLAYER_LIST_UPDATE',
            players: getSanitizedPlayers(lobby)
        });

        broadcastToLobby(roomCode, { 
            type: 'ROUND_RESET',
            roundNumber: lobby.roundNumber,
            roundType: lobby.roundType
        });
        startSelectionTimer(lobby, roomCode);
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
        broadcastToLobby(roomCode, {
            type: 'PLAYER_LIST_UPDATE',
            players: getSanitizedPlayers(lobby)
        });

        broadcastToLobby(roomCode, { 
            type: 'GAME_STARTED',
            gameMode: lobby.gameMode,
            roundNumber: lobby.roundNumber,
            roundType: lobby.roundType,
            ultimateLoserId: lobby.ultimateLoserId
        });
        startSelectionTimer(lobby, roomCode);
    }
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

        // Auto play again 5s after publish results
        if (lobby.autoPlayAgainTimeout) {
            clearTimeout(lobby.autoPlayAgainTimeout);
        }
        lobby.autoPlayAgainTimeout = setTimeout(() => {
            if (!lobbies[roomCode] || lobby.gameState !== 'revealed') return;
            console.log(`Auto-play-again triggering for room ${roomCode}`);
            executePlayAgain(lobby, roomCode);
        }, 5000);
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
    const offlineActivePlayers = lobby.players.filter(p => !p.isOnline && !p.isSpectator && !p.isSafe);
    
    // Reset statuses of non-safe non-spectator players
    lobby.players.forEach(p => {
        if (!p.isSafe && !p.isSpectator) {
            p.status = 'none';
        }
    });

    let isTie = false;

    // 1. Handle active players who went offline during the game
    if (offlineActivePlayers.length > 0) {
        offlineActivePlayers.forEach(p => {
            p.status = 'loser';
            p.isSafe = false;
        });
        activePlayers.forEach(p => {
            p.status = 'safe';
            p.isSafe = true;
        });
        lobby.ultimateLoserId = offlineActivePlayers[0].id;
        
        return {
            isTie: false,
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

    // 2. Handle scenario where only 1 online active player remains
    if (activePlayers.length === 1) {
        const lonePlayer = activePlayers[0];
        lonePlayer.status = 'loser';
        lobby.ultimateLoserId = lonePlayer.id;

        return {
            isTie: false,
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
    let currentSurvivalId = null;
    let currentSurvivalMode = null;
    let currentPaperioId = null;

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
                        if (!lobbies[currentRoomCode]) return;
                        broadcastToLobby(currentRoomCode, {
                            type: 'REVEAL_RESULTS',
                            isTie: outcome.isTie,
                            results: outcome.results,
                            ultimateLoserId: lobby.ultimateLoserId,
                            roundNumber: lobby.roundNumber,
                            roundType: currentRoundType
                        });

                        // Auto play again 5s after publish results
                        if (lobby.autoPlayAgainTimeout) {
                            clearTimeout(lobby.autoPlayAgainTimeout);
                        }
                        lobby.autoPlayAgainTimeout = setTimeout(() => {
                            if (!lobbies[currentRoomCode] || lobby.gameState !== 'revealed') return;
                            console.log(`Auto-play-again triggering for room ${currentRoomCode}`);
                            executePlayAgain(lobby, currentRoomCode);
                        }, 5000);
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

                    executePlayAgain(lobby, currentRoomCode);
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

                // =================== SURVIVAL GAME ===================
                case 'SURVIVAL_JOIN': {
                    const sMode = SURV_VALID_MODES.has(data.mode) ? data.mode : 'classic';
                    const sName = String(data.playerName || 'Player').trim().slice(0, 15) || 'Player';
                    const sId   = 'sp-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
                    const world = getSurvWorld(sMode);
                    const sColor = SURV.COLORS[world.players.size % SURV.COLORS.length];
                    world.players.set(sId, {
                        id: sId, name: sName,
                        x: survRandPos(), y: survRandPos(),
                        mass: SURV.START_MASS, r: survRadius(SURV.START_MASS),
                        dx: 0, dy: 0, color: sColor, alive: true, ws,
                        weaponLevel: 0, mana: SURV.MANA_MAX, sprint: false, shootTimer: 0, aimAngle: 0, shooting: false,
                    });
                    currentSurvivalId   = sId;
                    currentSurvivalMode = sMode;
                    sendToPlayer(ws, { type: 'SURVIVAL_JOINED', playerId: sId, worldSize: SURV.WORLD, color: sColor, mode: sMode });
                    survStart(world);
                    break;
                }

                case 'SURVIVAL_INPUT': {
                    if (!currentSurvivalMode || !currentSurvivalId) break;
                    const sp = survWorlds[currentSurvivalMode]?.players.get(currentSurvivalId);
                    if (sp && sp.alive) {
                        sp.dx = Math.max(-1, Math.min(1, Number(data.dx) || 0));
                        sp.dy = Math.max(-1, Math.min(1, Number(data.dy) || 0));
                        if (typeof data.sprint === 'boolean') sp.sprint = data.sprint;
                        if (typeof data.shooting === 'boolean') sp.shooting = data.shooting;
                        if (typeof data.aimAngle === 'number' && isFinite(data.aimAngle)) sp.aimAngle = data.aimAngle;
                    }
                    break;
                }

                case 'SURVIVAL_RESPAWN': {
                    if (!currentSurvivalMode || !currentSurvivalId) break;
                    const sp = survWorlds[currentSurvivalMode]?.players.get(currentSurvivalId);
                    if (sp && currentSurvivalMode === 'classic') {
                        sp.x = survRandPos(); sp.y = survRandPos();
                        sp.mass = SURV.START_MASS; sp.r = survRadius(SURV.START_MASS);
                        sp.dx = 0; sp.dy = 0; sp.alive = true; sp.ws = ws;
                    }
                    break;
                }

                case 'SURVIVAL_LEAVE': {
                    if (currentSurvivalId && currentSurvivalMode) {
                        survPlayerLeave(currentSurvivalMode, currentSurvivalId);
                        currentSurvivalId   = null;
                        currentSurvivalMode = null;
                    }
                    break;
                }
                // ======================================================

                // =================== PAPER.IO GAME ===================
                case 'PAPERIO_JOIN': {
                    if (!pioWorld) pioWorld = pioCreateWorld();
                    if (pioWorld.players.size >= PIO.MAX_PLAYERS) {
                        sendToPlayer(ws, { type: 'PAPERIO_FULL' });
                        break;
                    }
                    const pName = String(data.playerName || 'Player').trim().slice(0, 15) || 'Player';
                    // pick a color not taken
                    const used = new Set([...pioWorld.players.values()].map(pp => pp.color));
                    const pColor = (data.color && PIO.COLORS.includes(data.color) && !used.has(data.color))
                        ? data.color
                        : (PIO.COLORS.find(c => !used.has(c)) || PIO.COLORS[0]);
                    const np = pioCreatePlayer(pioWorld, pName, pColor, false, ws);
                    if (!np) { sendToPlayer(ws, { type: 'PAPERIO_FULL' }); break; }
                    currentPaperioId = np.id;
                    sendToPlayer(ws, {
                        type: 'PAPERIO_JOINED',
                        playerId: np.id,
                        slot: np.slot,
                        color: np.color,
                        grid: PIO.GRID,
                        cell: PIO.CELL,
                        tickRate: PIO.TICK_RATE,
                        autoWinPct: PIO.AUTO_WIN_PCT
                    });
                    pioStart();
                    break;
                }

                case 'PAPERIO_INPUT': {
                    if (!currentPaperioId || !pioWorld) break;
                    const pp = pioWorld.players.get(currentPaperioId);
                    if (!pp || !pp.alive) break;
                    const d = data.dir;
                    if (['up','down','left','right'].includes(d) && d !== PIO.OPPOSITE[pp.dir]) {
                        pp.nextDir = d;
                    }
                    break;
                }

                case 'PAPERIO_RESPAWN': {
                    if (!currentPaperioId || !pioWorld) break;
                    const pp = pioWorld.players.get(currentPaperioId);
                    if (!pp || pp.alive) break;
                    // human respawn: reset position with fresh starting square
                    const sp = pioFindFreeSpawn(pioWorld);
                    pp.gx = sp.gx + Math.floor(PIO.START_AREA / 2);
                    pp.gy = sp.gy + Math.floor(PIO.START_AREA / 2);
                    pp.dir = ['up','down','left','right'][Math.floor(Math.random()*4)];
                    pp.nextDir = null;
                    pp.alive = true;
                    pp.respawnAt = 0;
                    pp.ws = ws;
                    pioPaintStartArea(pioWorld, pp.slot, sp.gx, sp.gy);
                    break;
                }

                case 'PAPERIO_LEAVE': {
                    if (currentPaperioId) {
                        pioPlayerLeave(currentPaperioId);
                        currentPaperioId = null;
                    }
                    break;
                }
                // ======================================================
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
        // Survival cleanup
        if (currentSurvivalId && currentSurvivalMode) {
            survPlayerLeave(currentSurvivalMode, currentSurvivalId);
            currentSurvivalId   = null;
            currentSurvivalMode = null;
        }

        // Paper.io cleanup
        if (currentPaperioId) {
            pioPlayerLeave(currentPaperioId);
            currentPaperioId = null;
        }

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
