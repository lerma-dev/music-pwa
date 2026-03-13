const CACHE_NAME = 'music-v1.1.1';
const ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './scripts/app.js',
  './scripts/icons.js',
  './assets/lerma-icons/help.svg',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Borrando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).then(newRes => {
        // cachear si la respuesta es válida
        if(!newRes || newRes.status !== 200) return newRes;
        
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, newRes.clone());
          return newRes;
        });
      });
    })
  );
});
