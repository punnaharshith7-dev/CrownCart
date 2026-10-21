const { spawn } = require('child_process');
const fs = require('fs');

const html = `
<!DOCTYPE html>
<html>
<body>
  <img id="raw" src="http://localhost:5173/products/jordan_patent.jpg" />
  <img id="ref" src="http://localhost:5173/products/mock_shoe.png" />
</body>
</html>
`;
fs.writeFileSync('public/test_shoe_compare.html', html);

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9240',
  '--user-data-dir=C:\\Users\\punna\\AppData\\Local\\Temp\\chrome_dev_temp_shoe_comp',
  '--no-first-run',
  '--window-size=1200,800',
  'http://localhost:5173/test_shoe_compare.html'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9240/json');
    const tabs = await res.json();
    const target = tabs.find(t => t.url.includes('test_shoe_compare'));
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

      const analysis = await send('Runtime.evaluate', {
        expression: `(() => {
          const imgRaw = document.getElementById('raw');
          const imgRef = document.getElementById('ref');

          // Draw raw scaled to 1024x576 (cover/center)
          const cRaw = document.createElement('canvas');
          cRaw.width = 1024; cRaw.height = 576;
          const ctxRaw = cRaw.getContext('2d');
          ctxRaw.drawImage(imgRaw, 0, 0, 1024, 576);

          const cRef = document.createElement('canvas');
          cRef.width = 1024; cRef.height = 576;
          const ctxRef = cRef.getContext('2d');
          ctxRef.drawImage(imgRef, 0, 0, 1024, 576);

          // Sample pixels in shoe area (x=600, y=300) in both
          function getPixel(ctx, x, y) {
            const d = ctx.getImageData(x, y, 1, 1).data;
            return [d[0], d[1], d[2]];
          }

          return {
            rawAt600_300: getPixel(ctxRaw, 600, 300),
            refAt600_300: getPixel(ctxRef, 600, 300),
            rawAt800_200: getPixel(ctxRaw, 800, 200),
            refAt800_200: getPixel(ctxRef, 800, 200),
            rawAt500_500: getPixel(ctxRaw, 500, 500),
            refAt500_500: getPixel(ctxRef, 500, 500),
          };
        })()`,
        returnByValue: true
      });

      console.log('Shoe pixel alignment test:', JSON.stringify(analysis.result.result.value, null, 2));

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
