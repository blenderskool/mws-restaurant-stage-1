/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL+'restaurants');

    /**
     * Request was successfull
     */
    xhr.onload = () => callback(null, JSON.parse(xhr.responseText));

    /**
     * Error occurred
     */
    xhr.onerror = () => callback(
      `Request failed. Returned status of ${xhr.status}`,
      null
    );

    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${DBHelper.DATABASE_URL}restaurants/${id}`);

    /**
     * Request was successfull
     */
    xhr.onload = () => callback(null, JSON.parse(xhr.responseText));

    /**
     * Error occurred
     */
    xhr.onerror = () => {

      /**
       * If there was an error with the request, check if data is available in db
       */
      DBHelper.openDatabase()
      .then(db => {
        if (!db) return callback(`Request failed. Returned status of ${xhr.status}`, null);

        const store = db.transaction('restaurants').objectStore('restaurants');

        return store.get(parseInt(id));
      })
      .then(restaurant => {
        /**
         * Return the data if found
         */
        if (restaurant) return callback(null, restaurant);

        /**
         * Fallback error
         */
        callback(`Request failed. Returned status of ${xhr.status}`, null);
      });

    }

    xhr.send();
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Filters restaurants based on the neighborhood and cuisine
   */
  static filterRestaurants(restaurants, cuisine, neighborhood) {
    let results = restaurants;
    if (cuisine != 'all') { // filter by cuisine
      results = results.filter(r => r.cuisine_type == cuisine);
    }
    if (neighborhood != 'all') { // filter by neighborhood
      results = results.filter(r => r.neighborhood == neighborhood);
    }

    return results;
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {

        /**
         * If there was an error making the request,
         * check for data in db
         */
        DBHelper.openDatabase()
        .then(db => {
          if (!db) return callback(error, null);

          const store = db.transaction('restaurants').objectStore('restaurants');
          return store.getAll();
        })
        .then(restaurants =>  {
          /**
           * Fallback error
           */
          if (!restaurants) return callback(error, null);
        
          /**
           * return the data if found 
           */
          callback(null, DBHelper.filterRestaurants(restaurants, cuisine, neighborhood));
        });



      } else {

        /**
         * Store the data in the database
         */
        DBHelper.openDatabase()
        .then(db => {
          if (!db) return;

          const tx = db.transaction('restaurants', 'readwrite');
          const store = tx.objectStore('restaurants');

          restaurants.forEach(restaurant => store.put(restaurant));
        });

        callback(null, DBHelper.filterRestaurants(restaurants, cuisine, neighborhood));
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {

        /**
         * We do similar checks for neighborhoods if data is availble
         * in db
         */
        DBHelper.openDatabase()
        .then(db => {
          if (!db) return callback(error, null);

          const store = db.transaction('neighborhoods').objectStore('neighborhoods');
          return store.getAll();
        })
        .then(neighborhoods => callback(null, neighborhoods));

      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)

        /**
         * Store data in database on successfull request
         */
        DBHelper.openDatabase()
        .then(db => {
          if (!db) return;

          const tx = db.transaction('neighborhoods', 'readwrite');
          const store = tx.objectStore('neighborhoods');

          uniqueNeighborhoods.forEach(neighborhood => store.put(neighborhood, neighborhood));
        });

        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {

        /**
         * We do similar checks for cuisines if data is availble
         * in db
         */
        DBHelper.openDatabase()
        .then(db => {
          if (!db) return callback(error, null);

          const store = db.transaction('cuisines').objectStore('cuisines');

          return store.getAll();
        })
        .then(cuisines => callback(null, cuisines));

      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)

        /**
         * Store data in database on successfull request
         */
        DBHelper.openDatabase()
        .then(db => {
          if (!db) return;

          const tx = db.transaction('cuisines', 'readwrite');
          const store = tx.objectStore('cuisines');

          cuisines.forEach(cuisine => store.put(cuisine, cuisine));
        });

        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Toggles the favorite state of a restaurant
   * @param {Boolean} isFav Pass the state of favorite
   * @param {Number} id Id of the restaurant to be affected
   */
  static toggleFavorite(isFav, id) {
    const options = { is_favorite: isFav };

    /**
     * Makes a PUT request to the server to set the favorite status
     */
    fetch(`${DBHelper.DATABASE_URL}restaurants/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    })
    .catch(err => console.log(err));

    /**
     * Also set the favorite status in the IDB, so that it can be fetched when offline
     */
    DBHelper.openDatabase()
    .then(db => {
      if (!db) return;

      const store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');

      store.get(parseInt(id))
      .then(restaurant => store.put({ ...restaurant, ...options }))
    })
    .catch(err => console.log(err));
  }

  /**
   * Gets the reviews for specific restaurant
   * @param {Number|String} id ID of the restaurant to get the reviews for
   * @param {*} callback 
   */
  static fetchReviewdById(id, callback) {
    fetch(`${DBHelper.DATABASE_URL}reviews?restaurant_id=${id}`)
    .then(res => res.json())
    .then(data => callback(null, data))
    .catch(err => callback(err));
  }

  /**
   * Sends a review to the server
   * @param {Object} review Object containing review data
   */
  static addReview(review) {

    /**
     * Makes a PUT request to the server to set the favorite status
     */
    return new Promise((resolve, reject) => {
      fetch(`${DBHelper.DATABASE_URL}reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(review)
      })
      .then(res => res.json())
      .then(resolve)
      .catch(reject);
    });

  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return [
      `/img/${restaurant.photograph}.webp`,
      `/img/${restaurant.photograph}.jpg`
    ];
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */


  /**
   * IndexedDB database is opened here using idb
   */
  static openDatabase() {
    if (!navigator.serviceWorker) return Promise.resolve();

    return idb.open('restaurant-reviews', 1, upgradeDB => {

      /**
       * Create necessary object stores
       */

      upgradeDB.createObjectStore('restaurants',  {
        keyPath: 'id'
      });

      upgradeDB.createObjectStore('neighborhoods');
      upgradeDB.createObjectStore('cuisines');
    });
  }

}


/**
 * Registers a service worker for the app
 */
let registerSW = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js');
}

/**
 * Event is fired when the user goes online
 */
window.addEventListener('online', () => {
  idb.open('restaurant-reviews', 1)
  .then(db => {
    if (!db) return;

    const store = db.transaction('restaurants').objectStore('restaurants');

    return store.getAll();
  })
  .then(restaurants =>  {
    if (!restaurants) return;
  
    /**
     * Send the favorite data of every restaurant to the server
     */
    restaurants.forEach(restaurant => DBHelper.toggleFavorite(restaurant.is_favorite, restaurant.id))
  });

});