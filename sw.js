const CACHE_NAME = 'music-v1.8.0';
const ASSETS = [
  './',
  './index.html',
  './offline.html',
  './styles/style.css',
  './scripts/app.js',
  './manifest.json',
  'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js',
  'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      if (res) return res;

      // Si no está en cache, lo busca en la red
      return fetch(e.request).then(newRes => {
        // Guarda una copia de lo que bajó en el cache para la próxima
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, newRes.clone());
          return newRes;
        });
      });
    }).catch(() => {
      // Si la petición es de navegación, muestra la página offline
      if (e.request.mode === 'navigate') {
        return caches.match('./offline.html');
      }
    })
  );
});
