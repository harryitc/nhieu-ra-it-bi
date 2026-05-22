const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const wsUrl = process.env.AGY_BROWSER_WS_URL || 'ws://127.0.0.1:52595/devtools/browser/48d1ab38-3db5-4a63-afb8-57042fc8b994';
console.log('Connecting to browser DevTools at:', wsUrl);

const ws = new WebSocket(wsUrl);

let msgId = 1;
const pendingRequests = new Map();
const consoleLogs = [];

function sendCommand(method, params = {}, sessionId = undefined) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const message = { id, method, params };
    if (sessionId) {
      message.sessionId = sessionId;
    }
    pendingRequests.set(id, { resolve, reject });
    ws.send(JSON.stringify(message));
  });
}

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.id) {
    const req = pendingRequests.get(msg.id);
    if (req) {
      pendingRequests.delete(msg.id);
      if (msg.error) {
        req.reject(msg.error);
      } else {
        req.resolve(msg.result);
      }
    }
  } else {
    // Event received
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
      consoleLogs.push(`[Console ${type}] ${text}`);
      console.log(`[Browser Console ${type}]`, text);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const exceptionDetails = msg.params.exceptionDetails;
      const desc = exceptionDetails.exception ? (exceptionDetails.exception.description || exceptionDetails.exception.value) : exceptionDetails.text;
      consoleLogs.push(`[Console Error] ${desc}`);
      console.error(`[Browser Exception]`, desc);
    }
  }
});

ws.on('open', async () => {
  console.log('Browser socket connected.');
  try {
    // 1. Create a new target page at http://localhost:3000/
    console.log('Creating new tab at http://localhost:3000/ ...');
    const target = await sendCommand('Target.createTarget', { url: 'http://localhost:3000/' });
    const targetId = target.targetId;
    console.log('Created target page. ID:', targetId);

    // 2. Attach to target
    console.log('Attaching to target page...');
    const attach = await sendCommand('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = attach.sessionId;
    console.log('Attached to target. Session ID:', sessionId);

    // 3. Enable Runtime and Page domains
    await sendCommand('Runtime.enable', {}, sessionId);
    await sendCommand('Page.enable', {}, sessionId);
    console.log('Runtime and Page domains enabled.');

    // 4. Wait for #create-host-name to appear
    console.log('Waiting for elements to load in the page...');
    let loaded = false;
    for (let i = 0; i < 30; i++) {
      const check = await sendCommand('Runtime.evaluate', {
        expression: `!!document.getElementById('create-host-name')`,
        returnByValue: true
      }, sessionId);
      if (check.result && check.result.value) {
        loaded = true;
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    if (!loaded) {
      throw new Error('Timeout waiting for page to load.');
    }
    console.log('Page is loaded and ready.');

    // 5. Fill input, select rule, click create button
    console.log('Filling form and selecting rules...');
    const automationResult = await sendCommand('Runtime.evaluate', {
      expression: `
        (function() {
          const nameInput = document.getElementById('create-host-name');
          if (!nameInput) return { success: false, error: 'create-host-name input not found' };
          
          // Enter name
          nameInput.value = 'Antigravity Tester';
          
          // Select "majority-out" rule (Nhiều Ra, Ít Bị)
          const ruleOption = document.querySelector('.mode-select-item[data-mode="majority-out"]');
          if (!ruleOption) return { success: false, error: 'majority-out rule option not found' };
          ruleOption.click();
          
          // Click Create Room button
          const createBtn = document.getElementById('btn-create-room');
          if (!createBtn) return { success: false, error: 'btn-create-room button not found' };
          createBtn.click();
          
          return { success: true };
        })()
      `,
      returnByValue: true
    }, sessionId);

    console.log('Automation action executed:', automationResult.result.value);

    // 6. Wait for lobby transition
    console.log('Waiting for lobby screen to become active...');
    let transitioned = false;
    let lobbyInfo = {};
    for (let i = 0; i < 25; i++) {
      const checkLobby = await sendCommand('Runtime.evaluate', {
        expression: `
          (function() {
            const welcome = document.getElementById('welcome-screen');
            const lobby = document.getElementById('lobby-screen');
            return {
              welcomeActive: welcome ? welcome.classList.contains('active') : false,
              lobbyActive: lobby ? lobby.classList.contains('active') : false,
              roomCode: document.getElementById('lobby-room-code') ? document.getElementById('lobby-room-code').innerText : '----',
              modeName: document.getElementById('lobby-mode-name') ? document.getElementById('lobby-mode-name').innerText : ''
            };
          })()
        `,
        returnByValue: true
      }, sessionId);

      lobbyInfo = checkLobby.result.value;
      if (lobbyInfo.lobbyActive && lobbyInfo.roomCode !== '----') {
        transitioned = true;
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    if (!transitioned) {
      console.warn('Lobby screen is not yet active or room code not loaded. Current state:', lobbyInfo);
    } else {
      console.log('Lobby screen is successfully active!');
      console.log('Lobby details:', lobbyInfo);
    }

    // 7. Capture screenshot of the lobby
    console.log('Capturing page screenshot...');
    const screenshot = await sendCommand('Page.captureScreenshot', { format: 'png' }, sessionId);
    const screenshotPath = 'C:/Users/User/.gemini/antigravity/brain/64e6a5cd-0e33-4373-8b66-f21b90b43747/lobby_screenshot.png';
    
    // Ensure the folder exists (just in case)
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Screenshot successfully saved to:', screenshotPath);

    // 8. Clean up
    console.log('Closing target tab...');
    await sendCommand('Target.closeTarget', { targetId });
    console.log('Target tab closed.');

    console.log('--- SYSTEM RESULT ---');
    console.log(JSON.stringify({
      success: transitioned,
      lobbyDetails: lobbyInfo,
      screenshotPath,
      consoleLogs
    }, null, 2));

  } catch (error) {
    console.error('Automation failed with error:', error);
  } finally {
    ws.close();
    console.log('Socket closed.');
  }
});

ws.on('error', (err) => {
  console.error('WebSocket connection error:', err);
});
