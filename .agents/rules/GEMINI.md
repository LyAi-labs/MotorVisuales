# GEMINI.md — Reglas del Proyecto MotorVisuales
> Hereda las reglas globales de `~/.gemini/config/GEMINI.md`
> Este archivo añade reglas específicas de este proyecto.

## 🔴 PROTOCOLO DE INICIO EN ESTE PROYECTO
1. Leer `MEMORY.md` (raíz del proyecto) — arquitectura completa
2. Leer `LESSONS.md` (raíz del proyecto) — errores resueltos en este proyecto
3. Leer `DECISIONS.md` (raíz del proyecto) — decisiones técnicas del proyecto
4. Verificar que el servidor esté activo: `http://localhost:8088`

## Reglas Específicas de MotorVisuales
- Servidor: `python -m http.server 8088` (daemon, debe estar siempre corriendo)
- Archivo principal: `c:\MotorVisuales\index.html`
- Antes de tocar el grafo de audio → consultar LESSONS.md #webaudio
- Antes de tocar Three.js → consultar LESSONS.md #threejs
- Antes de llamar a Gemini API → consultar LESSONS.md #gemini-api
- Al resolver un bug no trivial → añadir entrada a LESSONS.md inmediatamente
