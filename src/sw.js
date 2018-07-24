const staticCache = 'restaurant-static-v1';
const imgCache = 'restaurant-imgs';
const allCaches = [
  staticCache,
  imgCache
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        /**
         * Remove old caches
         */
        cacheNames.filter(cacheName =>
          cacheName.startsWith('restaurant-') && !cachesAll.includes(cacheName)
        )
        .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      return caches.open(staticCache);
    })
    .then(cache => {

      /**
       * Cache the static assets
       */

      return cache.addAll([
        '/',
        '/restaurant.html',
        '/css/styles.css',
        '/js/main.js',
        'https://cdn.jsdelivr.net/npm/idb@2.1.3/lib/idb.min.js',
        '/js/restaurant_info.js',
        '/js/dbhelper.js'  
      ]);
    })
  );
});

function resPhoto(req) {
  /**
   * Open the cache, and check if image is already there
   */
  return caches.open(imgCache).then(cache => 
    cache.match(req.url).then(res => {
      if (res) return res;

      /**
       * If image is not cached, then fetch it and store it again in the cache
       */
      return fetch(req).then(netRes => {
        cache.put(req.url, netRes.clone());

        /**
         * Return back the original response
         */
        return netRes;
      })
    })
  );
}

self.addEventListener('fetch', event => {
  const reqURL = new URL(event.request.url);
  let req = event.request;

  if (reqURL.origin === location.origin) {
    /**
     * If requests are for images, then we first do the
     * cache process
     */
    if (reqURL.pathname.startsWith('/img/'))
      return event.respondWith(resPhoto(event.request));

    /**
     * If requests contain restaurant.html, then respond with
     * the skeleton of the page
     */
    if (reqURL.pathname === '/restaurant.html')
      req = '/restaurant.html';
  }

  event.respondWith(
    caches.match(req).then(res => {
      /**
       * Respond with the cached data if found.
       * If it is not available in cache storage, fetch it from
       * the network
       */
      return res || fetch(event.request);
    })
  )
});