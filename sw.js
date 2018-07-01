self.addEventListener('fetch', (event) => {

  event.respondWith(
    caches.match(event.request).then(res => {
      /**
       * Respond with the cached data if found
       */
      if (res) return res;

      /**
       * If item is not available in cache storage, fetch it from
       * the network and cache it so that next time it is available
       */
      return fetch(event.request)
    })
    .then(res => {
      return caches.open('restaurant-static-v1')
      .then(cache => {
        if (!cache) return;

        /**
         * Open the cache, clone the response and store it
         */
        cache.put(event.request.url, res.clone());

        /**
         * Return back the original response back to the event
         */
        return res;
      })
    })
  )
});