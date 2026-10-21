const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9241',
  '--user-data-dir=C:\\Users\\punna\\AppData\\Local\\Temp\\chrome_dev_temp_find_shoe',
  '--no-first-run',
  '--window-size=1200,800',
  'http://localhost:5173/test_shoe_compare.html'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9241/json');
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

      const info = await send('Runtime.evaluate', {
        expression: `(() => {
          const imgRef = document.getElementById('ref');
          const cRef = document.createElement('canvas');
          cRef.width = 1024; cRef.height = 576;
          const ctxRef = cRef.getContext('2d');
          ctxRef.drawImage(imgRef, 0, 0, 1024, 576);

          // Find red pixels (r > 150, g < 50, b < 50) in ref
          const data = ctxRef.getImageData(0, 0, 1024, 576).data;
          let minX = 1024, maxX = 0, minY = 576, maxY = 0;
          let redCount = 0;
          for (let y = 0; y < 576; y++) {
            for (let x = 0; x < 1024; x++) {
              const idx = (y * 1024 + x) * 4;
              if (data[idx] > 160 && data[idx+1] < 40 && data[idx+2] < 40) {
                redCount++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          // Same for raw!
          const imgRaw = document.getElementById('raw');
          const cRaw = document.createElement('canvas');
          cRaw.width = imgRaw.naturalWidth; cRaw.height = imgRaw.naturalHeight;
          const ctxRaw = cRaw.getContext('2d');
          ctxRaw.drawImage(imgRaw, 0, 0);
          const rawData = ctxRaw.getImageData(0, 0, imgRaw.naturalWidth, imgRaw.naturalHeight).data;
          let rMinX = imgRaw.naturalWidth, rMaxX = 0, rMinY = imgRaw.naturalHeight, rMaxY = 0;
          let rRedCount = 0;
          for (let y = 0; y < imgRaw.naturalHeight; y++) {
            for (let x = 0; x < imgRaw.naturalWidth; x++) {
              const idx = (y * imgRaw.naturalWidth + x) * 4;
              if (rawData[idx] > 160 && rawData[idx+1] < 40 && rawData[idx+2] < 40) {
                rRedCount++;
                if (x < rMinX) rMinX = x;
                if (x > rMaxX) rMaxX = x;
                if (y < rMinY) rMinY = y;
                if (y > rMaxY) rMaxY = y;
              }
            }
          }

          return {
            refRedBounds: { minX, maxX, minY, maxY, redCount },
            rawRedBounds: { rMinX, rMaxX, rMinY, rMaxY, rRedCount, rawW: imgRaw.naturalWidth, rawH: imgRaw.naturalHeight }
          };
        })()`,
        returnByValue: true
      });

      console.log('Red Bounds:', JSON.stringify(info.result.result.value, null, 2));

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
