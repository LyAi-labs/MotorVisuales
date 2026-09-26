import os
import re
import urllib.parse
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx
import yt_dlp

app = FastAPI(title="MotorVisuales Gateway", version="1.0.0")

# Permitir CORS desde cualquier origen (especialmente para clientes web y móviles)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "motorvisuales-gateway", "version": "1.0.0"}

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

# Servir archivos estáticos del frontend (index.html, three.min.js, audio, etc.)
if os.path.exists("index.html"):
    app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
