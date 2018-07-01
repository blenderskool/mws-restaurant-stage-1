self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('restaurant-static-v1').then(cache => {
      return cache.addAll([
        '/',
        '/restaurant.html',
        '/css/styles.css',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/js/dbhelper.js'  
      ]);
    })
  );
});


self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(res => {
      /**
       * Respond with the cached data if found
       */
      if (res) return res;

      /**
       * If item is not available in cache storage, fetch it from
       * the network
       */
      return fetch(event.request)
    })
  )
});