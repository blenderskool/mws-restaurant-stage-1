const staticCache = 'restaurant-static-v1';
const imgCache = 'restaurant-imgs';
const mapCache = 'restaurant-maps';
const allCaches = [
  staticCache,
  imgCache,
  mapCache
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        /**
         * Remove old caches
         */
        cacheNames.filter(cacheName =>
          cacheName.startsWith('restaurant-') && !allCaches.includes(cacheName)
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
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
        '/js/main.js',
        'https://cdn.jsdelivr.net/npm/idb@2.1.3/lib/idb.min.js',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
        // Icon fonts are cached
        '/css/icons.css',
        '/font/icons.eot',
        '/font/icons.woff2',
        '/font/icons.woff',
        '/font/icons.ttf',
        '/font/icons.svg',
        '/js/restaurant_info.js',
        '/js/dbhelper.js'  
      ]);
    })
  );
});


function resCache(req, cacheName) {
  /**
   * Open the cache, and check if image is already there
   */
  return caches.open(cacheName).then(cache => 
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
      return event.respondWith(resCache(event.request, imgCache));

    /**
     * If requests contain restaurant.html, then respond with
     * the skeleton of the page
     */
    if (reqURL.pathname === '/restaurant.html')
      req = '/restaurant.html';
  }

  /**
   * Map requests are handled here similar to images
   */
  // if (reqURL.hostname === 'api.tiles.mapbox.com')
    // return event.respondWith(resCache(event.request, mapCache));


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