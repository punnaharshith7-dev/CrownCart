const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9243',
  '--user-data-dir=C:\\Users\\punna\\AppData\\Local\\Temp\\chrome_dev_temp_snap_perf',
  '--no-first-run',
  '--window-size=1024,576',
  'http://localhost:5173/test_shoe_perfect.html'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9243/json');
    const tabs = await res.json();
    const target = tabs.find(t => t.url.includes('test_shoe_perfect'));
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
      await new Promise(r => setTimeout(r, 1200));

      const snap = await send('Page.captureScreenshot');
      fs.writeFileSync('public/test_shoe_rendered.png', Buffer.from(snap.result.data, 'base64'));

      // Check red bounds in the captured screenshot
      const info = await send('Runtime.evaluate', {
        expression: `(async () => {
          const img = new Image();
          img.src = 'data:image/png;base64,${snap.result.data}';
          await new Promise(r => img.onload = r);
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, c.width, c.height).data;
          let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
          let redCount = 0;
          for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
              const idx = (y * c.width + x) * 4;
              if (data[idx] > 160 && data[idx+1] < 40 && data[idx+2] < 40) {
                redCount++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          return { bounds: { minX, maxX, minY, maxY, redCount, w: c.width, h: c.height } };
        })()`,
        awaitPromise: true,
        returnByValue: true
      });

      console.log('Rendered Screen Red Bounds:', JSON.stringify(info.result.result.value, null, 2));

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
