import os
import re
import urllib.parse
import sqlite3
import hashlib
import time
import json
import secrets
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx
import yt_dlp

app = FastAPI(title="MotorVisuales Gateway & Community Hub", version="2.0.0")

# Permitir CORS desde cualquier origen (especialmente para clientes web y móviles)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================================
# 1. BASE DE DATOS SQLITE EN MODO WAL PARA EL HUB DE PRESETS COMUNITARIOS
# =========================================================================
DATA_DIR = os.getenv("DATA_DIR", os.path.join(os.path.dirname(__file__), "data"))
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "presets.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS presets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                author TEXT NOT NULL,
                scene TEXT NOT NULL,
                tags TEXT,
                thumbnail TEXT,
                dna TEXT NOT NULL,
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
        """)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM presets")
        if cur.fetchone()[0] == 0:
            seeds = [
                (
                    'curated-abyss-01',
                    'Abismo Bioluminiscente & Cáusticas Ultra-Deep',
                    'MotorVisuales Core',
                    'scenic_abyss_boids',
                    json.dumps(['abismo', 'boids', 'fpv', 'bloom']),
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23020617"/><circle cx="128" cy="128" r="90" fill="none" stroke="%2338bdf8" stroke-width="3" opacity="0.6"/><circle cx="90" cy="110" r="8" fill="%2322d3ee"/><circle cx="160" cy="140" r="6" fill="%23a855f7"/><circle cx="130" cy="170" r="10" fill="%2338bdf8"/><text x="128" y="230" fill="%2338bdf8" font-size="12" font-family="monospace" text-anchor="middle">ABYSS BOIDS 4K</text></svg>',
                    json.dumps({
                        'scene': 'scenic_abyss_boids',
                        'camera': {'mode': 'dramatic', 'speed': 1.0},
                        'fx': {
                            'bloom': {'enabled': True, 'strength': 1.8},
                            'chroma': {'enabled': True, 'dist': 0.006},
                            'glitch': {'enabled': False, 'rate': 0.0},
                            'blur': {'enabled': True, 'intensity': 0.05},
                            'crt': {'enabled': False, 'curvature': 0.0},
                            'kaleido': {'enabled': False, 'sides': 8},
                            'film': {'enabled': True, 'noise': 0.35},
                            'invert': {'enabled': False, 'val': 0.0},
                            'pixel': {'enabled': False, 'size': 2}
                        },
                        'colors': {'prim': '#22d3ee', 'accent': '#a855f7', 'fog': '#020617'}
                    }),
                    42,
                    189
                ),
                (
                    'curated-mercury-02',
                    'Océano de Mercurio & Megalitos Resonantes',
                    'VJ_Kore',
                    'scenic_mercury_monoliths',
                    json.dumps(['mercurio', 'megalitos', 'espejo', 'cinema']),
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%2309090b"/><polygon points="80,180 128,40 176,180" fill="%236366f1" opacity="0.8"/><rect x="0" y="180" width="256" height="76" fill="%230f172a"/><text x="128" y="235" fill="%23818cf8" font-size="12" font-family="monospace" text-anchor="middle">MERCURY LIQUID</text></svg>',
                    json.dumps({
                        'scene': 'scenic_mercury_monoliths',
                        'camera': {'mode': 'circle', 'speed': 1.2},
                        'fx': {
                            'bloom': {'enabled': True, 'strength': 1.4},
                            'chroma': {'enabled': True, 'dist': 0.004},
                            'glitch': {'enabled': False, 'rate': 0.0},
                            'blur': {'enabled': False, 'intensity': 0.0},
                            'crt': {'enabled': False, 'curvature': 0.0},
                            'kaleido': {'enabled': False, 'sides': 8},
                            'film': {'enabled': True, 'noise': 0.4},
                            'invert': {'enabled': False, 'val': 0.0},
                            'pixel': {'enabled': False, 'size': 2}
                        },
                        'colors': {'prim': '#38bdf8', 'accent': '#818cf8', 'fog': '#050510'}
                    }),
                    38,
                    145
                ),
                (
                    'curated-cyber-03',
                    'Cyberpunk Dystopia & Glitch Transiente',
                    'HexHunter',
                    'tunnel',
                    json.dumps(['cyberpunk', 'glitch', 'crt', 'scanlines']),
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23180424"/><rect x="20" y="40" width="216" height="8" fill="%23ec4899"/><rect x="30" y="110" width="180" height="12" fill="%2306b6d4"/><rect x="10" y="180" width="236" height="10" fill="%23f43f5e"/><text x="128" y="235" fill="%23f472b6" font-size="12" font-family="monospace" text-anchor="middle">CYBER GLITCH 80s</text></svg>',
                    json.dumps({
                        'scene': 'tunnel',
                        'camera': {'mode': 'spiral', 'speed': 1.8},
                        'fx': {
                            'bloom': {'enabled': True, 'strength': 2.2},
                            'chroma': {'enabled': True, 'dist': 0.018},
                            'glitch': {'enabled': True, 'rate': 0.4},
                            'blur': {'enabled': True, 'intensity': 0.15},
                            'crt': {'enabled': True, 'curvature': 0.45},
                            'kaleido': {'enabled': False, 'sides': 8},
                            'film': {'enabled': True, 'noise': 0.25},
                            'invert': {'enabled': False, 'val': 0.0},
                            'pixel': {'enabled': True, 'size': 3}
                        },
                        'colors': {'prim': '#f43f5e', 'accent': '#06b6d4', 'fog': '#150520'}
                    }),
                    29,
                    110
                ),
                (
                    'curated-cymatics-04',
                    'Cimática Cuántica 3D & Chladni Nodal',
                    'SonicArchitect',
                    'cymatics_scene',
                    json.dumps(['chladni', 'nodal', 'cymatics', 'kaleido']),
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23022c22"/><circle cx="128" cy="128" r="80" fill="none" stroke="%2334d399" stroke-width="4"/><circle cx="128" cy="128" r="50" fill="none" stroke="%2322d3ee" stroke-width="3"/><circle cx="128" cy="128" r="20" fill="%2310b981"/><text x="128" y="235" fill="%2334d399" font-size="12" font-family="monospace" text-anchor="middle">CHLADNI NODAL 3D</text></svg>',
                    json.dumps({
                        'scene': 'cymatics_scene',
                        'camera': {'mode': 'circle', 'speed': 0.8},
                        'fx': {
                            'bloom': {'enabled': True, 'strength': 1.6},
                            'chroma': {'enabled': True, 'dist': 0.005},
                            'glitch': {'enabled': False, 'rate': 0.0},
                            'blur': {'enabled': False, 'intensity': 0.0},
                            'crt': {'enabled': False, 'curvature': 0.0},
                            'kaleido': {'enabled': True, 'sides': 12},
                            'film': {'enabled': False, 'noise': 0.0},
                            'invert': {'enabled': False, 'val': 0.0},
                            'pixel': {'enabled': False, 'size': 2}
                        },
                        'colors': {'prim': '#34d399', 'accent': '#22d3ee', 'fog': '#022c22'}
                    }),
                    24,
                    95
                )
            ]
            cur.executemany("""
                INSERT INTO presets (id, name, author, scene, tags, thumbnail, dna, likes, views)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, seeds)
            conn.commit()

init_db()
SERVER_START_TIME = time.time()

# =========================================================================
# 2. ENDPOINTS DE SALUD Y TELEMETRÍA
# =========================================================================
@app.get("/health")
def health():
    return {"status": "ok", "service": "motorvisuales-gateway", "version": "2.0.0"}

@app.get("/api/health")
def api_health():
    return {
        "status": "online",
        "service": "MotorVisuales Community API",
        "database": "SQLite WAL",
        "uptime": round(time.time() - SERVER_START_TIME, 2),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

# =========================================================================
# 3. ENDPOINTS DEL HUB DE PRESETS COMUNITARIOS (REST API)
# =========================================================================
@app.get("/api/presets")
def list_presets(
    sort: str = Query("top", description="Ordenación: 'top' o 'recent'"),
    search: str = Query("", description="Búsqueda por texto"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    try:
        with get_db() as conn:
            cur = conn.cursor()
            query = "SELECT id, name, author, scene, tags, thumbnail, dna, likes, views, created_at as createdAt FROM presets"
            params = []
            if search.strip():
                query += " WHERE (name LIKE ? OR author LIKE ? OR tags LIKE ? OR scene LIKE ?)"
                term = f"%{search.strip()}%"
                params.extend([term, term, term, term])
            
            if sort == "recent":
                query += " ORDER BY created_at DESC"
            else:
                query += " ORDER BY likes DESC, created_at DESC"
            
            query += " LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            cur.execute(query, params)
            rows = cur.fetchall()
            result = []
            for r in rows:
                try:
                    tags = json.loads(r["tags"]) if r["tags"] else []
                except Exception:
                    tags = []
                try:
                    dna = json.loads(r["dna"]) if r["dna"] else None
                except Exception:
                    dna = None
                result.append({
                    "id": r["id"],
                    "name": r["name"],
                    "author": r["author"],
                    "scene": r["scene"],
                    "tags": tags,
                    "thumbnail": r["thumbnail"],
                    "dna": dna,
                    "likes": r["likes"],
                    "views": r["views"],
                    "createdAt": r["createdAt"]
                })
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar presets: {str(e)}")

@app.get("/api/presets/{preset_id}")
def get_preset(preset_id: str):
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, name, author, scene, tags, thumbnail, dna, likes, views, created_at as createdAt FROM presets WHERE id = ?", (preset_id,))
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Preset no encontrado")
            try:
                tags = json.loads(r["tags"]) if r["tags"] else []
            except Exception:
                tags = []
            try:
                dna = json.loads(r["dna"]) if r["dna"] else None
            except Exception:
                dna = None
            return {
                "id": r["id"],
                "name": r["name"],
                "author": r["author"],
                "scene": r["scene"],
                "tags": tags,
                "thumbnail": r["thumbnail"],
                "dna": dna,
                "likes": r["likes"],
                "views": r["views"],
                "createdAt": r["createdAt"]
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener preset: {str(e)}")

@app.post("/api/presets", status_code=201)
async def create_preset(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Cuerpo JSON no válido")
    
    name = (body.get("name") or "").strip()
    author = (body.get("author") or "").strip()
    dna = body.get("dna")
    
    if not name or not author or not dna:
        raise HTTPException(status_code=400, detail="Faltan campos obligatorios (name, author, dna)")
    
    preset_id = body.get("id") or f"preset-{int(time.time()*1000)}-{secrets.token_hex(3)}"
    scene = body.get("scene") or (dna.get("scene") if isinstance(dna, dict) else "scenic_abyss_boids")
    raw_tags = body.get("tags") or []
    if not isinstance(raw_tags, list):
        raw_tags = [str(raw_tags)]
    tags_json = json.dumps(raw_tags[:10])
    dna_json = json.dumps(dna)
    thumbnail = body.get("thumbnail")
    
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO presets (id, name, author, scene, tags, thumbnail, dna, likes, views)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
            """, (preset_id, name[:100], author[:50], scene, tags_json, thumbnail, dna_json))
            conn.commit()
        
        return {
            "success": True,
            "id": preset_id,
            "message": "Preset registrado en la nube pública de MotorVisuales en Hetzner"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar preset: {str(e)}")

@app.post("/api/presets/{preset_id}/like")
def like_preset(preset_id: str, request: Request):
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "127.0.0.1")
    ip_hash = hashlib.sha256(ip.encode("utf-8")).hexdigest()[:16]
    
    try:
        with get_db() as conn:
            cur = conn.cursor()
            try:
                cur.execute("INSERT OR IGNORE INTO votes (preset_id, ip_hash) VALUES (?, ?)", (preset_id, ip_hash))
                if cur.rowcount > 0:
                    cur.execute("UPDATE presets SET likes = likes + 1 WHERE id = ?", (preset_id,))
                    conn.commit()
            except Exception:
                pass
            
            cur.execute("SELECT likes FROM presets WHERE id = ?", (preset_id,))
            row = cur.fetchone()
            likes = row[0] if row else 0
            return {"success": True, "likes": likes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar voto: {str(e)}")

@app.post("/api/presets/{preset_id}/view")
def view_preset(preset_id: str):
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE presets SET views = views + 1 WHERE id = ?", (preset_id,))
            conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar vista: {str(e)}")

# =========================================================================
# 4. ENDPOINTS DE AUDIO STREAMING & YOUTUBE GATEWAY
# =========================================================================
def sanitize_youtube_url(url_or_id: str) -> str:
    url_or_id = url_or_id.strip()
    # Si es solo un ID de 11 caracteres
    if re.match(r'^[\w-]{11}$', url_or_id):
        return f"https://www.youtube.com/watch?v={url_or_id}"
    # Si es ya una URL
    if url_or_id.startswith("http://") or url_or_id.startswith("https://"):
        return url_or_id
    # Fallback como búsqueda
    return f"ytsearch1:{url_or_id}"

@app.get("/api/yt-info")
def get_youtube_info(url: str = Query(..., description="URL o ID de YouTube")):
    target = sanitize_youtube_url(url)
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True
    }
    if os.path.exists("cookies.txt") and os.path.getsize("cookies.txt") > 10:
        ydl_opts['cookiefile'] = "cookies.txt"
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target, download=False)
            if 'entries' in info:
                info = info['entries'][0]
            return {
                "id": info.get("id"),
                "title": info.get("title"),
                "duration": info.get("duration"),
                "thumbnail": info.get("thumbnail"),
                "uploader": info.get("uploader"),
                "format_id": info.get("format_id")
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al extraer información: {str(e)}")

@app.get("/api/yt-stream")
async def stream_youtube(request: Request, url: str = Query(..., description="URL o ID de YouTube")):
    target = sanitize_youtube_url(url)
    ydl_opts = {
        'format': 'bestaudio[ext=m4a]/bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'skip_download': True
    }
    if os.path.exists("cookies.txt") and os.path.getsize("cookies.txt") > 10:
        ydl_opts['cookiefile'] = "cookies.txt"
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target, download=False)
            if 'entries' in info:
                info = info['entries'][0]
            audio_url = info.get("url")
            content_type = "audio/mp4" if info.get("ext") == "m4a" else (
                "audio/webm" if info.get("ext") == "webm" else "audio/mpeg"
            )
            title = info.get("title", "Audio Stream")

        if not audio_url:
            raise HTTPException(status_code=404, detail="No se pudo resolver el stream de audio")

        # Proxy de streaming continuo mediante httpx para evitar bloqueos de IP del cliente
        client = httpx.AsyncClient(timeout=60.0, follow_redirects=True)
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        # Propagar cabecera Range si el cliente la solicita
        range_header = request.headers.get("Range")
        if range_header:
            headers["Range"] = range_header

        req = client.build_request("GET", audio_url, headers=headers)
        res = await client.send(req, stream=True)

        async def stream_generator():
            try:
                async for chunk in res.aiter_bytes(chunk_size=65536):
                    yield chunk
            finally:
                await res.aclose()
                await client.aclose()

        response_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache",
            "X-Track-Title": urllib.parse.quote(title.encode('utf-8'))
        }
        if "content-length" in res.headers:
            response_headers["Content-Length"] = res.headers["content-length"]
        if "content-range" in res.headers:
            response_headers["Content-Range"] = res.headers["content-range"]

        return StreamingResponse(
            stream_generator(),
            status_code=res.status_code,
            media_type=content_type,
            headers=response_headers
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en stream proxy: {str(e)}")

# =========================================================================
# 5. ENDPOINTS OPTIMIZADOS PARA PWA
# =========================================================================
@app.get("/sw.js")
def get_service_worker():
    return FileResponse(
        "sw.js", 
        media_type="application/javascript", 
        headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Service-Worker-Allowed": "/"}
    )

@app.get("/manifest.json")
def get_manifest():
    return FileResponse(
        "manifest.json", 
        media_type="application/manifest+json",
        headers={"Cache-Control": "public, max-age=3600"}
    )

# Servir archivos estáticos del frontend (index.html, three.min.js, audio, etc.)
if os.path.exists("index.html"):
    app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
