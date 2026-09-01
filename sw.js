const CACHE_NAME = 'maci-pressing-v2';
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
  const url = event.request.url;
  // On ne gère que les requêtes http(s) classiques — on ignore les requêtes
  // internes des extensions du navigateur (chrome-extension://, etc.) et
  // les connexions temps réel de Firebase.
  if(!url.startsWith('http')) return;
  if(url.includes('firebaseio.com') || url.includes('firebaseapp.com')) return;
  if(event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if(response.ok){
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
