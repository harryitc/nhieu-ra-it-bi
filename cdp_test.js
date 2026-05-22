const WebSocket = require('ws');

const wsUrl = process.env.AGY_BROWSER_WS_URL || 'ws://127.0.0.1:52595/devtools/browser/48d1ab38-3db5-4a63-afb8-57042fc8b994';
console.log('Connecting to browser WebSocket URL:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('Connected to browser!');
  // Get targets
  const msg = {
    id: 1,
    method: 'Target.getTargets',
    params: {}
  };
  ws.send(JSON.stringify(msg));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Received response:', JSON.stringify(response, null, 2));
  ws.close();
});

ws.on('error', (err) => {
  console.error('Socket error:', err);
});
