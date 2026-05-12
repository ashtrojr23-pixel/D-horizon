const CACHE_NAME = 'lifeos-v1';
const ASSETS = [
  './',
  './index.html',
  './dashboard.html',
  './goals.html',
  './finances.html',
  './habits.html',
  './analytics.html',
  './manifest.json',
  './css/main.css',
  './css/animations.css',
  './css/dashboard.css',
  './css/goals.css',
  './css/finances.css',
  './css/habits.css',
  './css/analytics.css',
  './js/app.js',
  './js/auth.js',
  './js/storage.js',
  './js/goals.js',
  './js/finances.js',
  './js/habits.js',
  './js/analytics.js',
  './js/island.js',
  './js/charts.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const clone = res.clone();
    caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
    return res;
  }).catch(() => caches.match('./index.html'))));
});
