// sw.js - Service Worker para suporte 100% offline do PQC-HFA

const CACHE_NAME = 'pqc-hfa-v1.0';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/SVGInteractive.js',
    './js/fluidBalance.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Instalação do Service Worker e gravação do Cache estático
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[PQC-HFA PWA] Gravando assets estáticos no cache...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[PQC-HFA PWA] Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Intercepção de requisições: Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                // Se falhar e for navegação de página, retorna o index do cache
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
