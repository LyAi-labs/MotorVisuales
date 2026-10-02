const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /title="([^"]+)"/g;
let match;
const titles = [];
while ((match = regex.exec(html)) !== null) {
    titles.push(match[1]);
}

console.log('Total elements with title attribute:', titles.length);
console.log('Sample titles:');
titles.slice(0, 25).forEach((t, i) => console.log(`  ${i+1}. ${t}`));

// Check specifically the pill dock
const dockMatch = html.match(/class="[^"]*studio-pill-dock[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
if (dockMatch) {
    console.log('\n--- STUDIO PILL DOCK BUTTONS ---');
    console.log(dockMatch[0].substring(0, 500));
}
