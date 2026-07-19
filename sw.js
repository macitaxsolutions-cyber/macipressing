const CACHE_NAME = 'maci-pressing-v1';
const ASSETS = [
  '/macipressing/',
  '/macipressing/index.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(e => console.log(e)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if(event.request.url.includes('firebaseio.com') ||
     event.request.url.includes('firebaseapp.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if(response.ok && event.request.method === 'GET'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        if(cached) return cached;
        if(event.request.mode === 'navigate')
          return caches.match('/macipressing/index.html');
        return new Response('Hors ligne', { status: 503 });
      }))
  );
});