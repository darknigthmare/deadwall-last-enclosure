const CACHE = 'deadwall-v1.0.0-r6';
const ASSETS = ['./','index.html','styles.css','settings.css','manifest.json','src/core.js','src/save.js','src/art.js','src/game.js','src/ui.js','assets/icon.svg','assets/icon-192.png','assets/icon-512.png','assets/deadwall-keyart-v2.webp','assets/buildings-atlas.webp','assets/props-atlas.webp','assets/survivors-atlas.webp','assets/infected-atlas.webp','assets/vfx-atlas.webp','assets/terrain-earth.webp','assets/defenses-atlas.webp'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
const CACHE_PREFIX = 'deadwall-v';
const assetURLs = new Set(ASSETS.map(asset => new URL(asset, self.registration.scope).href));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  url.search = '';
  const cacheURL = url.href;
  if (event.request.method !== 'GET' || !assetURLs.has(cacheURL)) return;
  const network = fetch(event.request);
  event.waitUntil(network.then(async response => {
    if (!response.ok || response.redirected) return;
    const copy = response.clone();
    const cache = await caches.open(CACHE);
    await cache.put(cacheURL, copy);
  }).catch(() => {}));
  event.respondWith(network.catch(async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(cacheURL);
    if (hit) return hit;
    if (event.request.mode === 'navigate') {
      const index = await cache.match(new URL('index.html', self.registration.scope).href);
      if (index) return index;
    }
    return Response.error();
  }));
});
