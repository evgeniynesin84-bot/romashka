// РоМашенька — Service Worker
const CACHE_NAME = 'romashka-v1';

// Файлы, которые кешируем при установке
const PRECACHE = [
  './РоМашенька_v9_3.html',
  './manifest.json'
];

// Установка — кешируем основные файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — сначала сеть, при ошибке кеш (network-first)
self.addEventListener('fetch', event => {
  // Пропускаем chrome-extension и нестандартные схемы
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Кешируем успешные GET-запросы
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Офлайн — возвращаем из кеша
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Для навигации — отдаём главную страницу
          if (event.request.mode === 'navigate') {
            return caches.match('./РоМашенька_v9_3.html');
          }
          return new Response('Нет соединения', { status: 503 });
        });
      })
  );
});
