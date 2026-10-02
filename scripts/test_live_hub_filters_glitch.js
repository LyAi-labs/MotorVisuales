const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, [
    '--remote-debugging-port=9273',
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--window-size=1400,900',
    'http://localhost:8088/'
]);

setTimeout(async () => {
    http.get('http://127.0.0.1:9273/json', res => {
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
                    // Poll until presets are loaded (after fetch timeout or local)
                    const checkInterval = setInterval(() => {
                        send('Runtime.evaluate', {
                            expression: `
                                if (communityVisualHub.presets && communityVisualHub.presets.length > 0) {
                                    // Apply glitch filter
                                    communityVisualHub.filterTokenBar.setFilters([
                                        {
                                            id: 'filter-glitch',
                                            field: 'fx',
                                            operator: 'contains',
                                            values: ['glitch']
                                        }
                                    ]);
                                    JSON.stringify({
                                        presetsCount: communityVisualHub.presets.length,
                                        gridCards: document.querySelectorAll('#hub-explore-grid > div').length
                                    });
                                } else {
                                    null;
                                }
                            `
                        });
                    }, 500);

                    // Timeout after 6 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        send('Page.captureScreenshot', { format: 'png' });
                    }, 5000);
                } else if (msg.result && msg.result.result && msg.result.result.value && msg.result.result.value.includes('presetsCount')) {
                    console.log('Filter applied result:', msg.result.result.value);
                } else if (msg.result && msg.result.data) {
                    fs.writeFileSync('test-screenshots/live-hub-filtered-glitch-verified.png', Buffer.from(msg.result.data, 'base64'));
                    console.log('Saved test-screenshots/live-hub-filtered-glitch-verified.png');
                    ws.close();
                    proc.kill();
                }
            };
        });
    });
}, 2500);
