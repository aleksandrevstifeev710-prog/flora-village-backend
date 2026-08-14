/* =========================================================
   FLORA VILLAGE - Service Worker
   ========================================================= */

const CACHE_NAME = 'flora-village-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/logo.png',
  '/tab-icon.ico',
  '/favicon-192.png',
  '/favicon-512.png'
  /* Если вы переименовали картинки букетов (например, в img/), добавьте их сюда:
  '/img/bouquet-large.jpg',
  '/img/bouquet-small.jpg' 
  */
];

// Установка и кэширование файлов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Кэшируем ресурсы...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Активируем новый SW сразу
});

// Перехват запросов и отдача из кэша
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Если есть в кэше — отдаем оттуда
      }
      return fetch(event.request).then(response => {
        // Если нет в кэше, но страница загрузилась, можно положить результат в кэш (опционально для новых картинок)
        return response;
      });
    })
  );
});

// Очистка старого кэша при обновлении
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Удаляем старый кэш:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Захватываем контроль над открытыми вкладками
});