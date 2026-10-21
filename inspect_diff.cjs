const { spawn } = require('child_process');
const fs = require('fs');

const html = `
<!DOCTYPE html>
<html>
<body>
  <img id="target" src="http://localhost:5173/products/target_mockup.jpg" />
  <img id="render" src="http://localhost:5173/products/final_render.png" />
  <canvas id="c1"></canvas>
  <canvas id="c2"></canvas>
</body>
</html>
`;
fs.writeFileSync('public/test_diff.html', html);

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9227',
  '--user-data-dir=C:\\Users\\punna\\AppData\\Local\\Temp\\chrome_dev_temp_diff',
  '--no-first-run',
  '--window-size=1200,800',
  'http://localhost:5173/test_diff.html'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9227/json');
    const tabs = await res.json();
    const target = tabs.find(t => t.url.includes('test_diff'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const curId = id++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(msg);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    ws.onopen = async () => {
      await new Promise(r => setTimeout(r, 1500));
      const info = await send('Runtime.evaluate', {
        expression: `(() => {
          const imgTarget = document.getElementById('target');
          const imgRender = document.getElementById('render');
          return {
            target: { naturalWidth: imgTarget.naturalWidth, naturalHeight: imgTarget.naturalHeight },
            render: { naturalWidth: imgRender.naturalWidth, naturalHeight: imgRender.naturalHeight }
          };
        })()`,
        returnByValue: true
      });
      console.log('Images info:', JSON.stringify(info.result.result.value, null, 2));
      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
