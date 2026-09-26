// ============================================================================
// MotorVisuales PWA — Service Worker (High-Performance Audio & 3D WebGL Shell)
// ============================================================================

const CACHE_NAME = 'motorvisuales-v1';

// Recursos críticos del App Shell para precargar y funcionamiento offline
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './three.min.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './icons/favicon.ico'
];

// 1. Ciclo de Instalación: Precargar shell y tomar control inmediato
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precargando App Shell de MotorVisuales...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Aviso al precargar assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Ciclo de Activación: Reclamar clientes y purgar versiones obsoletas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Limpiando caché anterior:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia de Fetch Dinámico
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // REGLA CRÍTICA DE AUDIO Y STREAMING:
  // Nunca interceptar ni cachear streams de YouTube (/api/), peticiones parciales Range (206)
  // ni archivos pesados de audio (.mp3, .wav), para no romper el buffering ni Web Audio API.
  if (
    url.pathname.startsWith('/api/') ||
    req.headers.has('range') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav') ||
    req.method !== 'GET'
  ) {
    return; // Pasa directo a la red sin intervenir
  }

  // Para navegación HTML (index.html): Network First con fallback a caché
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match('./index.html') || caches.match(req);
        })
    );
    return;
  }

  // Para assets estáticos locales (scripts, estilos, iconos): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // Si no hay red, la respuesta cacheada ya se envió o fallará silenciosamente
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
