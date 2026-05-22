# AI Agent Workspace Instructions - Nhieu Ra It Bi Online

Welcome! This workspace contains a real-time multiplayer folk game ("Nhiều Ra Ít Bị") utilizing WebSockets (`ws`), React 19, Vite, and Zustand.

This guide helps AI agents get up to speed with development, architecture, testing, and common project conventions.

---

## 🚀 Quick Commands and Scripts

All commands are executed from the project root:

| Command | Description |
|---|---|
| `npm run start` or `npm run dev:server` | Starts the Express + WebSocket server locally on port 3000 (default) |
| `npm run dev:client` | Launches the client development server with Vite (proxies WebSocket calls) |
| `npm run build` | Installs client dependencies and builds the Vite production bundle into `client/dist` |
| `node <test_file.js>` | Runs custom socket integration and scenario test scripts (e.g., `node test_timer.js`) |

---

## 🏗️ Architecture & Boundaries

The codebase is split into three main structures:

1. **Backend Server (`server.js`)**:
   - Built with Express and the native `ws` module.
   - Manages state entirely in-memory using `lobbies`. There is no persistent database.
   - Implements room creations, player states, timers (selection + countdown auto-reveal), chat logs, and game logic rules (majorities vs. safe/elimination logic).

2. **Frontend client (`client/`)**:
   - Powered by React 19, React Router, Vite, and Zustand.
   - Multi-screen setup: `welcome`, `lobby`, and `play` screens managed via `client/src/store/gameStore.js`.
   - Built assets are served statically by Express (`client/dist`).

3. **In-Memory Testing Suite**:
   - Custom test scripts (`test_*.js`, `cdp_test.js`) mimic socket clients using the `ws` module to automate multiplayer lobbies, scenario matching, AFK timer counts, and reconnects.

---

## 🛠️ Essential Conventions & Rules

- **WebSocket State Scope**:
  - Avoid binding WebSocket sockets to React state to prevent unnecessary component re-renders. A global, module-level socket is initialized and accessed within `client/src/hooks/useWebSocket.js`.
- **UI & Multi-language Support**:
  - The game is targeted at Vietnamese players. All system-generated text, notifications, choices description ("búa", "kéo", "bao", etc.), color palettes, and interactive prompts must be phrased in natural, friendly Vietnamese.
- **Port Bindings**:
  - The server port binds dynamically to `process.env.PORT || 3000`. Do not hardcode host URLs in client code; use relative websocket routing / Vite proxies.
- **Auto-Timers Rules**:
  - Once all players have chosen, the room defaults to an automatic countdown before lật tay (auto-reveal) in 5 seconds.
  - Round timer limits default to 30 seconds for AFK player auto-submit action rules.

---

## 🔍 Key Files of Reference

- **Server Entrypoint**: `server.js` (Coordinates socket connections and lobby game loops)
- **Websocket Logic**: `client/src/hooks/useWebSocket.js` (Dispatches message types to Zustand actions)
- **State Store**: `client/src/store/gameStore.js` (Client-side game loop state, UI configurations)
- **Integration Tests**: `test_timer.js` (Good pattern reference for mocked multiplayer events)
