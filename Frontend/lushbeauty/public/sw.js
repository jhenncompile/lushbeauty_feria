// Service worker vacío (F00-T5). La cola offline y el caché llegan en F05.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
