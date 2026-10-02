const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, [
    '--remote-debugging-port=9270',
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--window-size=1200,900',
    'http://localhost:8088/components/filter-token-bar-demo.html'
]);

setTimeout(async () => {
    http.get('http://127.0.0.1:9270/json', res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', async () => {
            const tabs = JSON.parse(b);
            const page = tabs.find(t => t.type === 'page');
            if (!page) { console.log('no page'); proc.kill(); return; }
            const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);
            
            let step = 0;
            const send = (method, params = {}) => {
                step++;
                ws.send(JSON.stringify({ id: step, method, params }));
            };

            ws.onopen = () => {
                // Initial screenshot
                send('Page.captureScreenshot', { format: 'png' });
            };

            ws.onmessage = e => {
                const msg = JSON.parse(e.data);
                if (msg.id === 1) {
                    fs.writeFileSync('test-screenshots/filter-token-bar-initial.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved initial state to test-screenshots/filter-token-bar-initial.png');

                    // Click on "+ Filtro" button
                    send('Runtime.evaluate', {
                        expression: `
                            const btn = document.querySelector('.ftb-btn-add');
                            btn.click();
                            true;
                        `
                    });
                } else if (msg.id === 2) {
                    setTimeout(() => {
                        send('Page.captureScreenshot', { format: 'png' });
                    }, 300);
                } else if (msg.id === 3) {
                    fs.writeFileSync('test-screenshots/filter-token-bar-add-menu.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved menu state to test-screenshots/filter-token-bar-add-menu.png');

                    // Click on the first field item (Escena 3D)
                    send('Runtime.evaluate', {
                        expression: `
                            const item = document.querySelector('.ftb-popover-item[data-field-id="scene"]');
                            if (item) item.click();
                            true;
                        `
                    });
                } else if (msg.id === 4) {
                    setTimeout(() => {
                        send('Page.captureScreenshot', { format: 'png' });
                    }, 300);
                } else if (msg.id === 5) {
                    fs.writeFileSync('test-screenshots/filter-token-bar-values-menu.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved values menu state to test-screenshots/filter-token-bar-values-menu.png');

                    // Select 'Abismo Boids'
                    send('Runtime.evaluate', {
                        expression: `
                            const valItem = document.querySelector('.ftb-popover-item[data-val="scenic_abyss_boids"]');
                            if (valItem) valItem.click();
                            true;
                        `
                    });
                } else if (msg.id === 6) {
                    setTimeout(() => {
                        send('Page.captureScreenshot', { format: 'png' });
                    }, 300);
                } else if (msg.id === 7) {
                    fs.writeFileSync('test-screenshots/filter-token-bar-filtered.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved filtered state to test-screenshots/filter-token-bar-filtered.png');
                    ws.close();
                    proc.kill();
                }
            };
        });
    });
}, 2500);
