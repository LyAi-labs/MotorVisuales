const { GeminiShaderCopilotEngine } = require('./copilot_engine_full.js');

const engine = new GeminiShaderCopilotEngine();

// Test generate fallback
const prompts = [
    "Túnel fractal cuántico con anillos de luz",
    "Cristal de bismuto con iridiscencia PBR",
    "Ferrofluido con picos de Rosensweig y óptica Thin-Film",
    "Cimática armónica de Chladni",
    "Medusa bioluminiscente en abismo marino",
    "Supernova con agujero negro y disco de acreción",
    "Algo totalmente abstracto e inventado"
];

for (const p of prompts) {
    const res = engine.generateProceduralFallback(p, 'generate', '');
    if (!res || !res.fragCode || !res.fragCode.includes('precision highp float') || !res.fragCode.includes('gl_FragColor')) {
        console.error(`FAIL for prompt: ${p}`);
        process.exit(1);
    }
    console.log(`OK: "${p.slice(0, 30)}..." -> ${res.shaderTitle}`);
}

// Test repair fallback
const brokenShader = `void main() { vec4 c = texture(uAudioTexture, vUv); gl_FragColor = c; }`;
const repaired = engine.generateProceduralFallback("Error en texture()", "repair", brokenShader);
if (!repaired.fragCode.includes('texture2D') || !repaired.fragCode.includes('precision highp float')) {
    console.error("FAIL for repair mode");
    process.exit(1);
}
console.log("OK: Repair mode fixed syntax successfully!");

console.log("\nALL TESTS PASSED!");
