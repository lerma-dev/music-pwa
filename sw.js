const CACHE_NAME = 'music-v1.0.1';
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
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      if (res) return res;

      return fetch(e.request).then(newRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, newRes.clone());
          return newRes;
        });
      });
      
    })
  );
});
