const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\punna\\AppData\\Local\\Temp\\chrome_dev_temp',
  '--no-first-run',
  '--window-size=1280,800',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9222/json');
    const tabs = await res.json();
    const target = tabs.find(t => t.url.includes('5173'));
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
      console.log('Connected to CDP');
      await new Promise(r => setTimeout(r, 2500));

      const sections = [
        { id: 'product-shoe', file: 'v2_1_jordan.png' },
        { id: 'product-watch', file: 'v2_2_nautilus.png' },
        { id: 'product-bomber', file: 'v2_3_armani.png' },
        { id: 'product-laptop', file: 'v2_4_asustuf.png' },
        { id: 'explore-more', file: 'v2_5_explore.png' },
      ];

      for (const s of sections) {
        const info = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const el = document.getElementById("${s.id}");
              if (el) {
                window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
              }
              return { id: "${s.id}", top: el ? el.offsetTop : -1, scrollY: window.scrollY };
            })()
          `,
          returnByValue: true
        });
        console.log('Scrolled to:', info.result.result.value);

        // Move cursor over 3D canvas
        await send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: 420,
          y: 380
        });

        await new Promise(r => setTimeout(r, 1200));

        const snap = await send('Page.captureScreenshot');
        const outPath = `C:\\Users\\punna\\.gemini\\antigravity\\brain\\6a3ecd5f-79a0-43c8-919d-30b1f9690b77\\${s.file}`;
        fs.writeFileSync(outPath, Buffer.from(snap.result.data, 'base64'));
        console.log(`Saved ${s.file}`);
      }

      // Also let's test switching product-laptop to "photo" view mode and capturing it!
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const buttons = document.querySelectorAll('button');
            for (const b of buttons) {
              if (b.textContent.includes('STUDIO PHOTO')) {
                b.click();
              }
            }
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1000));
      const photoSnap = await send('Page.captureScreenshot');
      fs.writeFileSync(`C:\\Users\\punna\\.gemini\\antigravity\\brain\\6a3ecd5f-79a0-43c8-919d-30b1f9690b77\\v2_photo_toggle_test.png`, Buffer.from(photoSnap.result.data, 'base64'));
      console.log('Saved v2_photo_toggle_test.png');

      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
