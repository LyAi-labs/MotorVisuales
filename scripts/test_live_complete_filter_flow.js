const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, [
    '--remote-debugging-port=9274',
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--window-size=1400,900',
    'http://localhost:8088/'
]);

setTimeout(async () => {
    http.get('http://127.0.0.1:9274/json', res => {
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
                // Open community hub modal and ensure presets are populated
                send('Runtime.evaluate', {
                    expression: `
                        openCommunityHubModal();
                        // Force populate if offline fetch hasn't completed
                        if (!communityVisualHub.presets || communityVisualHub.presets.length === 0) {
                            communityVisualHub.presets = [...communityVisualHub.cachedCuratedPresets];
                            communityVisualHub.renderExploreGrid();
                        }
                        true;
                    `
                });
            };

            ws.onmessage = e => {
                const msg = JSON.parse(e.data);
                if (msg.id === 1) {
                    // Click "+ Filtro"
                    setTimeout(() => {
                        send('Runtime.evaluate', {
                            expression: `
                                const btn = document.querySelector('#hub-filter-token-bar-mount .ftb-btn-add');
                                if (btn) btn.click();
                                !!btn;
                            `
                        });
                    }, 400);
                } else if (msg.id === 2) {
                    // Select "Pase FX Activo"
                    setTimeout(() => {
                        send('Runtime.evaluate', {
                            expression: `
                                const fxItem = document.querySelector('.ftb-popover-item[data-field-id="fx"]');
                                if (fxItem) fxItem.click();
                                !!fxItem;
                            `
                        });
                    }, 300);
                } else if (msg.id === 3) {
                    // Select "Glitch Digital"
                    setTimeout(() => {
                        send('Runtime.evaluate', {
                            expression: `
                                const glitchItem = document.querySelector('.ftb-popover-item[data-val="glitch"]');
                                if (glitchItem) glitchItem.click();
                                !!glitchItem;
                            `
                        });
                    }, 300);
                } else if (msg.id === 4) {
                    // Wait for render and capture glitch filtered state
                    setTimeout(() => {
                        send('Runtime.evaluate', {
                            expression: `
                                const cards = document.querySelectorAll('#hub-explore-grid > div');
                                const titles = Array.from(cards).map(c => c.querySelector('h4')?.textContent.trim());
                                JSON.stringify({ count: cards.length, titles });
                            `
                        });
                    }, 400);
                } else if (msg.id === 5) {
                    console.log('Glitch filter result:', msg.result.result.value);
                    send('Page.captureScreenshot', { format: 'png' });
                } else if (msg.id === 6) {
                    fs.writeFileSync('test-screenshots/live-hub-glitch-single-card.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved test-screenshots/live-hub-glitch-single-card.png');

                    // Click "Limpiar" to clear all filters
                    send('Runtime.evaluate', {
                        expression: `
                            const clearBtn = document.querySelector('#hub-filter-token-bar-mount .ftb-btn-clear');
                            if (clearBtn) clearBtn.click();
                            !!clearBtn;
                        `
                    });
                } else if (msg.id === 7) {
                    setTimeout(() => {
                        send('Runtime.evaluate', {
                            expression: `
                                const cards = document.querySelectorAll('#hub-explore-grid > div');
                                JSON.stringify({ countAfterClear: cards.length });
                            `
                        });
                    }, 400);
                } else if (msg.id === 8) {
                    console.log('Clear result:', msg.result.result.value);
                    send('Page.captureScreenshot', { format: 'png' });
                } else if (msg.id === 9) {
                    fs.writeFileSync('test-screenshots/live-hub-cleared-filters.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved test-screenshots/live-hub-cleared-filters.png');
                    ws.close();
                    proc.kill();
                }
            };
        });
    });
}, 2500);
