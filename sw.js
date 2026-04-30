// app/sw.js
const CACHE_NAME = 'music-v1.6.3';
const APP_VERSION = CACHE_NAME.replace('music-v', '');

const ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './scripts/app.js',
  './scripts/icons.js',
  './assets/lerma-icons/help.svg',
  './manifest.json'
];

//insatalacion 
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

//activacion - limpieza de caches antiguas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Notificar a todos los clientes inmediatamente
      return self.clients.matchAll({includeUncontrolled: true, type: 'window'});
    }).then(clients => {
      clients.forEach(client => client.postMessage({ 
        action: 'setVersion', 
        version: APP_VERSION 
      }));
    })
  );
  return self.clients.claim();
});

// fetch - estrategia cache-first
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

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});