# MotorVisuales — CLAUDE.md (TIER 2)

**Hereda de**: `/home/lyai/.claude/CLAUDE.md` (TIER 1 — costes, security, governance, prohibiciones)
**Working dir** (server): `/opt/lyai/app/MotorVisuales/` — **mayúscula**. Existe una carpeta hermana
`/opt/lyai/app/motorvisuales/` (minúscula) creada por Ignacio a mano el 2026-09-26 clonando el mismo
repo — es un checkout suelto sin contenedor propio, no la toques como si fuera la buena.
**Repo**: EXTERNO, `https://github.com/LyAi-labs/MotorVisuales` — desarrollado en Windows por un
agente/equipo distinto (Antigravity), NO por nosotros. Este CLAUDE.md es la capa LyAi que se le
añade al traerlo a este servidor; no edites el repo aguas arriba sin coordinarlo por el canal.
**Desplegado**: 2026-09-26, ver [[project_motorvisuales_deploy_2026-09-26]] (memoria de este proyecto).

---

## Qué es

Gateway FastAPI (`server.py`) que resuelve audio de YouTube con `yt-dlp` y lo sirve como
`StreamingResponse` — sin descargar a disco, con soporte de `Range` para reproducción progresiva.
Pensado para que una app (web o Android) use una URL de YouTube como fuente de audio normal
(`<audio src="https://motorvisuales.site/api/yt-stream?url=...">`), sin necesidad de "capturar la
pestaña" (eso es una técnica exclusiva de escritorio, `getDisplayMedia`, y no existe equivalente
igual en Android — el propio endpoint YA es la solución multiplataforma).

## Infraestructura real (verificada, no asumida del repo)

El repo trae sus propios `docker-compose.yml`/Dockerfile con supuestos de OTRO servidor —
**corregidos en este mismo despliegue**, no asumas que lo que hay en GitHub sirve tal cual aquí:

- ❌ Su compose original usaba red `traefik_public` (no existe aquí) y publicaba el puerto host
  `8088:8000`. **Aquí la red real es `traefik_traefik`** (misma que usa `lyai_ski_backend`) y
  NO se publica ningún puerto al host — solo Traefik llega al contenedor por la red docker.
- ❌ Sus labels de Traefik son **inertes en este servidor**: Traefik aquí SOLO tiene configurado
  el `file` provider (`/home/lyai/traefik/config/dynamic/routes.yml`, symlink de
  `/home/lyai/traefik/config/routes.yml`), no el `docker` provider. Un commit suyo puede traer
  labels perfectos y aun así no enrutar nada aquí si no se replica en `routes.yml`.
- ✅ Ruta real: routers `motorvisuales-https`/`motorvisuales-http` + servicio `motorvisuales-svc`
  → `http://motorvisuales:8000`, en `routes.yml`. **Trampa de Compose**: `ports`/`networks`/`labels`
  son listas y Compose las CONCATENA en vez de reemplazarlas — un `docker-compose.override.yml`
  con `ports: []`/`labels: []` NO limpia lo que ya trae el fichero base. Hay que editar
  `docker-compose.yml` directamente. (Detalle → wiki lesson de este mismo despliegue.)
- DNS: `motorvisuales.site` (`@`) ya apuntaba a `178.63.165.87` antes de crear la ruta — no hizo
  falta tocar DNS. `www` sigue apuntando a GitHub Pages (CNAME), eso NO es este servidor.
- Riesgo aceptado explícitamente por Ignacio (2026-09-26, "Sigue, si!"): CORS abierto (`*`) sin
  auth, proxy de audio de YouTube sin control de abuso/ToS. No mitigado en este despliegue — si
  se detecta abuso real, avisar antes de añadir rate-limit/auth por iniciativa propia.

## 🚫 Reglas duras (heredadas del patrón lyai-ski, aplicadas aquí)

- ❌ **NUNCA** edites `server.py`/`Dockerfile`/lógica del repo aguas arriba sin proponerlo antes —
  es código de otro equipo; nuestra capa es infraestructura (compose/Traefik), no producto.
- ❌ **NUNCA** publiques puertos al host ni reactives las labels de Traefik "porque el repo las
  trae" — revisan `routes.yml`, que es la única fuente real en este servidor.
- ❌ **NUNCA** concedas acceso de terminal/Docker al agente externo (Antigravity) — la vía
  acordada es el canal JSONL (`/opt/lyai/app/channels/Aurelius.jsonl`, `flag_id` compartido).
  Decisión de Ignacio ("Agente Jefe de LyAi eres tu... y solo tu diciendomelo a mi lo hacemos").
- ✅ Antes de cualquier `git pull`/rebuild desde su repo: leer el diff real, no asumir que un
  commit suyo que dice arreglar algo (p.ej. "fix(docker)...") sirve igual en este servidor —
  verificarlo contra `routes.yml`/red real primero.

## Pipeline de despliegue (lo que de verdad se ejecuta aquí)

```bash
cd /opt/lyai/app/MotorVisuales
git pull                      # trae cambios del repo externo — revisar diff antes
docker-compose build
docker-compose up -d
docker exec motorvisuales curl -s http://localhost:8000/health   # sin curl en el propio contenedor si falla, usar desde fuera:
curl -s https://motorvisuales.site/health
```

Si algo del repo vuelve a tocar `ports`/`networks`/`labels`, reconciliar a mano contra este
fichero y `routes.yml` — no confiar en que su compose ya viene listo para este servidor.

## Recursos heredados

- **TIER 1** (`/home/lyai/.claude/CLAUDE.md`): costes, security, governance, prohibiciones.
- **Memoria persistente**: `~/.claude/projects/-opt-lyai-app-MotorVisuales/memory/` — propia de
  este proyecto (slug distinto al de lyai-ski). `MEMORY.md` es el índice.
- **Wiki compartida**: `/opt/lyai/wiki/pages/` — lecciones de este despliegue en
  `pages/lessons/lesson-2026-09-26-*motorvisuales*` y `*compose-list-merge*`.
- **dev-xplain**: NO vive en este repo — es un tool de `lyai-ski`, pero funciona desde cualquier
  cwd porque escribe a una ruta absoluta fija:
  ```bash
  python3 /opt/lyai/app/lyai-ski/tools/dev-xplain/nuevo.py <slug> --title "..." --description "..."
  ```
  Publica en `https://dev.lyai.pro/dev-xplain/<slug>/`. Úsalo para cualquier mockup visual de este
  proyecto (p.ej. propuestas de UI para la captura de audio en Android) exactamente igual que en
  lyai-ski — mismo protocolo, mismo índice.
- **Cierre de sesión**: mismo protocolo TIER 1 (`/save-session` en el server) — al cerrar una
  sesión que tocó este proyecto, la memoria se escribe en el directorio de arriba (slug propio),
  la wiki en el mismo repo compartido, y el canal Aurelius si hay flag de seguridad/arquitectura
  (como el `MOTORVISUALES-STREAM-SPEC` de este mismo despliegue).
- **Channels**: `/opt/lyai/app/channels/{Claude,Aurelius}.jsonl` — canal real de comunicación con
  el agente externo, NO texto libre "De:/Para:/Ref:".

---

**Creado**: 2026-09-26, en el mismo despliegue que puso `motorvisuales.site` en producción.
