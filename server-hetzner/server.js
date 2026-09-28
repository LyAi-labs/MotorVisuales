/**
 * MOTORVISUALES - COMMUNITY VISUAL HUB API (HETZNER SERVER)
 * Servidor REST Ultraligero (<40MB RAM) con SQLite en modo WAL
 * Almacenamiento, indexación y ranking de Presets de ADN Visual
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Inicializar Base de Datos SQLite de alto rendimiento con WAL mode
const db = new Database(path.join(DATA_DIR, 'presets.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Crear tablas si no existen
db.exec(`
    CREATE TABLE IF NOT EXISTS presets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        author TEXT NOT NULL,
        scene TEXT NOT NULL,
        tags TEXT, -- JSON array de tags
        thumbnail TEXT, -- Data URL o SVG
        dna TEXT NOT NULL, -- JSON con el ADN completo (scene, camera, fx, colors, shaders)
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_presets_created ON presets(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_presets_likes ON presets(likes DESC);
    CREATE INDEX IF NOT EXISTS idx_presets_scene ON presets(scene);

    CREATE TABLE IF NOT EXISTS votes (
        preset_id TEXT,
        ip_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (preset_id, ip_hash)
    );
`);

// Insertar presets semilla iniciales si la base de datos está vacía
const count = db.prepare('SELECT COUNT(*) as cnt FROM presets').get();
if (count.cnt === 0) {
    const seedInsert = db.prepare(`
        INSERT INTO presets (id, name, author, scene, tags, thumbnail, dna, likes, views)
        VALUES (@id, @name, @author, @scene, @tags, @thumbnail, @dna, @likes, @views)
    `);

    const seeds = [
        {
            id: 'curated-abyss-01',
            name: 'Abismo Bioluminiscente & Cáusticas Ultra-Deep',
            author: 'MotorVisuales Core',
            scene: 'scenic_abyss_boids',
            tags: JSON.stringify(['abismo', 'boids', 'fpv', 'bloom']),
            thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23020617"/><circle cx="128" cy="128" r="90" fill="none" stroke="%2338bdf8" stroke-width="3" opacity="0.6"/><circle cx="90" cy="110" r="8" fill="%2322d3ee"/><circle cx="160" cy="140" r="6" fill="%23a855f7"/><circle cx="130" cy="170" r="10" fill="%2338bdf8"/><text x="128" y="230" fill="%2338bdf8" font-size="12" font-family="monospace" text-anchor="middle">ABYSS BOIDS 4K</text></svg>',
            dna: JSON.stringify({
                scene: 'scenic_abyss_boids',
                camera: { mode: 'dramatic', speed: 1.0 },
                fx: {
                    bloom: { enabled: true, strength: 1.8 },
                    chroma: { enabled: true, dist: 0.006 },
                    glitch: { enabled: false, rate: 0.0 },
                    blur: { enabled: true, intensity: 0.05 },
                    crt: { enabled: false, curvature: 0.0 },
                    kaleido: { enabled: false, sides: 8 },
                    film: { enabled: true, noise: 0.35 },
                    invert: { enabled: false, val: 0.0 },
                    pixel: { enabled: false, size: 2 }
                },
                colors: { prim: '#22d3ee', accent: '#a855f7', fog: '#020617' }
            }),
            likes: 42,
            views: 189
        },
        {
            id: 'curated-mercury-02',
            name: 'Océano de Mercurio & Megalitos Resonantes',
            author: 'VJ_Kore',
            scene: 'scenic_mercury_monoliths',
            tags: JSON.stringify(['mercurio', 'megalitos', 'espejo', 'cinema']),
            thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%2309090b"/><polygon points="80,180 128,40 176,180" fill="%236366f1" opacity="0.8"/><rect x="0" y="180" width="256" height="76" fill="%230f172a"/><text x="128" y="235" fill="%23818cf8" font-size="12" font-family="monospace" text-anchor="middle">MERCURY LIQUID</text></svg>',
            dna: JSON.stringify({
                scene: 'scenic_mercury_monoliths',
                camera: { mode: 'circle', speed: 1.2 },
                fx: {
                    bloom: { enabled: true, strength: 1.4 },
                    chroma: { enabled: true, dist: 0.004 },
                    glitch: { enabled: false, rate: 0.0 },
                    blur: { enabled: false, intensity: 0.0 },
                    crt: { enabled: false, curvature: 0.0 },
                    kaleido: { enabled: false, sides: 8 },
                    film: { enabled: true, noise: 0.4 },
                    invert: { enabled: false, val: 0.0 },
                    pixel: { enabled: false, size: 2 }
                },
                colors: { prim: '#38bdf8', accent: '#818cf8', fog: '#050510' }
            }),
            likes: 38,
            views: 145
        }
    ];

    const insertMany = db.transaction((rows) => {
        for (const row of rows) seedInsert.run(row);
    });
    insertMany(seeds);
    console.log('[SQLite] Presets semilla insertados.');
}

// 2. Middlewares de Express
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(morgan('combined'));
app.use(express.json({ limit: '5mb' })); // Permitir miniaturas WebP/JPEG base64

// 3. Rutas de la API REST

// Healthcheck
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'MotorVisuales Community API',
        uptime: process.uptime(),
        database: 'SQLite WAL',
        timestamp: new Date().toISOString()
    });
});

// Listar Presets (Feed público con ordenación y búsqueda)
app.get('/api/presets', (req, res) => {
    try {
        const { sort = 'top', search = '', limit = 50, offset = 0 } = req.query;

        let query = 'SELECT id, name, author, scene, tags, thumbnail, dna, likes, views, created_at as createdAt FROM presets';
        const params = [];

        if (search) {
            query += ' WHERE (name LIKE ? OR author LIKE ? OR tags LIKE ? OR scene LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        if (sort === 'recent') {
            query += ' ORDER BY created_at DESC';
        } else {
            query += ' ORDER BY likes DESC, created_at DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const rows = db.prepare(query).all(...params);

        // Deserializar JSON almacenado
        const formatted = rows.map(r => ({
            ...r,
            tags: r.tags ? JSON.parse(r.tags) : [],
            dna: r.dna ? JSON.parse(r.dna) : null
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Error al listar presets:', err);
        res.status(500).json({ error: 'Error interno del servidor al consultar presets' });
    }
});

// Obtener un preset por ID
app.get('/api/presets/:id', (req, res) => {
    try {
        const row = db.prepare('SELECT id, name, author, scene, tags, thumbnail, dna, likes, views, created_at as createdAt FROM presets WHERE id = ?').get(req.params.id);
        if (!row) {
            return res.status(404).json({ error: 'Preset no encontrado' });
        }
        res.json({
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : [],
            dna: row.dna ? JSON.parse(row.dna) : null
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al consultar preset' });
    }
});

// Publicar un nuevo preset
app.post('/api/presets', (req, res) => {
    try {
        const { name, author, scene, tags, thumbnail, dna } = req.body;

        if (!name || !author || !dna) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (name, author, dna)' });
        }

        const id = 'preset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

        const stmt = db.prepare(`
            INSERT INTO presets (id, name, author, scene, tags, thumbnail, dna, likes, views)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
        `);

        stmt.run(
            id,
            name.substring(0, 100),
            author.substring(0, 50),
            scene || dna.scene || 'scenic_abyss_boids',
            JSON.stringify(Array.isArray(tags) ? tags.slice(0, 10) : []),
            thumbnail || null,
            JSON.stringify(dna)
        );

        res.status(201).json({
            success: true,
            id: id,
            message: 'Preset registrado en la nube pública de MotorVisuales en Hetzner'
        });
    } catch (err) {
        console.error('Error al guardar preset:', err);
        res.status(500).json({ error: 'Error interno al registrar el preset' });
    }
});

// Votar / Upvote por un preset
app.post('/api/presets/:id/like', (req, res) => {
    try {
        const presetId = req.params.id;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const crypto = require('crypto');
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

        // Intentar registrar el voto único por IP
        const voteStmt = db.prepare('INSERT OR IGNORE INTO votes (preset_id, ip_hash) VALUES (?, ?)');
        const result = voteStmt.run(presetId, ipHash);

        if (result.changes > 0) {
            db.prepare('UPDATE presets SET likes = likes + 1 WHERE id = ?').run(presetId);
        }

        const row = db.prepare('SELECT likes FROM presets WHERE id = ?').get(presetId);
        res.json({ success: true, likes: row ? row.likes : 0 });
    } catch (err) {
        res.status(500).json({ error: 'Error al procesar voto' });
    }
});

// Registrar visualización
app.post('/api/presets/:id/view', (req, res) => {
    try {
        db.prepare('UPDATE presets SET views = views + 1 WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar vista' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MotorVisuales Cloud Hub] Servidor activo en http://0.0.0.0:${PORT}`);
});
