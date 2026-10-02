const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, [
    '--remote-debugging-port=9271',
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--window-size=1400,900',
    'http://localhost:8088/'
]);

setTimeout(async () => {
    http.get('http://127.0.0.1:9271/json', res => {
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
                // Open community hub modal
                send('Runtime.evaluate', {
                    expression: `
                        openCommunityHubModal();
                        true;
                    `
                });
            };

            ws.onmessage = e => {
                const msg = JSON.parse(e.data);
                if (msg.id === 1) {
                    // Wait for presets and filter bar to render
                    setTimeout(() => {
                        send('Page.captureScreenshot', { format: 'png' });
                    }, 800);
                } else if (msg.id === 2) {
                    fs.writeFileSync('test-screenshots/live-hub-filter-bar-open.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved live community hub screenshot to test-screenshots/live-hub-filter-bar-open.png');

                    // Click on "+ Filtro" button in the filter bar
                    send('Runtime.evaluate', {
                        expression: `
                            const btn = document.querySelector('#hub-filter-token-bar-mount .ftb-btn-add');
                            if (btn) btn.click();
                            !!btn;
                        `
                    });
                } else if (msg.id === 3) {
                    setTimeout(() => {
                        send('Page.captureScreenshot', { format: 'png' });
                    }, 400);
                } else if (msg.id === 4) {
                    fs.writeFileSync('test-screenshots/live-hub-filter-bar-dropdown.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved live filter dropdown screenshot to test-screenshots/live-hub-filter-bar-dropdown.png');

                    // Select "Pase FX Activo"
                    send('Runtime.evaluate', {
                        expression: `
                            const fxItem = document.querySelector('.ftb-popover-item[data-field-id="fx"]');
                            if (fxItem) fxItem.click();
                            !!fxItem;
                        `
                    });
                } else if (msg.id === 5) {
                    setTimeout(() => {
                        // Now select "Bloom Lumínico"
                        send('Runtime.evaluate', {
                            expression: `
                                const bloomItem = document.querySelector('.ftb-popover-item[data-val="bloom"]');
                                if (bloomItem) bloomItem.click();
                                !!bloomItem;
                            `
                        });
                    }, 400);
                } else if (msg.id === 6) {
                    setTimeout(() => {
                        send('Page.captureScreenshot', { format: 'png' });
                    }, 500);
                } else if (msg.id === 7) {
                    fs.writeFileSync('test-screenshots/live-hub-filtered-bloom.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved filtered bloom screenshot to test-screenshots/live-hub-filtered-bloom.png');
                    ws.close();
                    proc.kill();
                }
            };
        });
    });
}, 3000);
