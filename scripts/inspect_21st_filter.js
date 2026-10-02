const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, [
    '--remote-debugging-port=9268',
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--window-size=1400,1000',
    'https://21st.dev/@laziekiki/components/filter-token-bar'
]);

setTimeout(async () => {
    http.get('http://127.0.0.1:9268/json', res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', async () => {
            const tabs = JSON.parse(b);
            const page = tabs.find(t => t.type === 'page');
            if (!page) { console.log('no page'); proc.kill(); return; }
            const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);
            ws.onopen = async () => {
                // Click on + Filter button at x: 675, y: 798
                ws.send(JSON.stringify({
                    id: 1,
                    method: 'Input.dispatchMouseEvent',
                    params: { type: 'mousePressed', x: 675, y: 798, button: 'left', clickCount: 1 }
                }));
                ws.send(JSON.stringify({
                    id: 2,
                    method: 'Input.dispatchMouseEvent',
                    params: { type: 'mouseReleased', x: 675, y: 798, button: 'left', clickCount: 1 }
                }));
                setTimeout(() => {
                    ws.send(JSON.stringify({ id: 3, method: 'Page.captureScreenshot', params: { format: 'png' } }));
                }, 800);
            };
            ws.onmessage = e => {
                const msg = JSON.parse(e.data);
                if (msg.id === 3) {
                    fs.writeFileSync('test-screenshots/filter-token-bar-dropdown.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved screenshot to test-screenshots/filter-token-bar-dropdown.png');
                    ws.close();
                    proc.kill();
                }
            };
        });
    });
}, 5000);
