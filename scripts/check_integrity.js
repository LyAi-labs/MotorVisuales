const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// 1. Check shader editor order
const idxShader = html.indexOf('id="sec-shader-editor"');
const idxPostfx = html.indexOf('id="sec-postfx-suite"');
console.log('Shader Editor index:', idxShader, 'PostFX index:', idxPostfx);
if (idxShader === -1 || idxPostfx === -1 || idxShader >= idxPostfx) {
  console.error('ERROR: Shader editor not positioned before PostFX!');
  process.exit(1);
}

// 2. Check fullscreen playback bar
const idxFsBar = html.indexOf('id="fullscreen-playback-bar"');
const idxCanvasCont = html.indexOf('id="three-canvas-container"');
console.log('Canvas container index:', idxCanvasCont, 'Fullscreen bar index:', idxFsBar);
if (idxFsBar === -1 || idxFsBar < idxCanvasCont) {
  console.error('ERROR: Fullscreen playback bar missing or not inside container!');
  process.exit(1);
}

// 3. Check controls inside fullscreen bar
const requiredIds = [
  'fs-btn-play-pause',
  'fs-slider-vol-master',
  'fs-val-vol-master',
  'fs-track-progress',
  'fs-track-title',
  'fs-track-current-time',
  'fs-track-duration',
  'fs-btn-exit-fs'
];
for (const id of requiredIds) {
  if (!html.includes('id="' + id + '"')) {
    console.error('ERROR: Missing control id=' + id);
    process.exit(1);
  }
}

// 4. Verify SpotlightCard and glass-panel CSS rules
if (!html.includes('.glass-panel::before') && !html.includes('.spotlight-card::before, .glass-panel::before')) {
  console.error('ERROR: glass-panel spotlight rule not found!');
  process.exit(1);
}

console.log('All structural integrity checks passed successfully!');
