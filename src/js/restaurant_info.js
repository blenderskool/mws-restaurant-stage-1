let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();

  registerSW() // SW registered
});

/**
 * Initialize leaflet map
 */
let initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiYWthc2hoYW1pcndhc2lhIiwiYSI6ImNqY3VuYzZsMjEwNDcyeG1vY3JvYnpyZTMifQ.EAFcQEL-nqRwaB6RgQQL9g',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
let fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = parseInt(getParameterByName('id'));
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });

    /**
     * Gets the reviews from the server
     */
    DBHelper.fetchReviewdById(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) return console.log(error);

      // fill reviews
      fillReviewsHTML();
    });

  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
let fillRestaurantHTML = (restaurant = self.restaurant) => {
  const images = DBHelper.imageUrlForRestaurant(restaurant);
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const srcWebP = document.getElementById('restaurant-img-src');
  srcWebP.srcset = images[0];

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = `${restaurant.name} restaurant`;
  image.src = images[1];

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const btnFav = document.getElementById('btnFav');
  if (restaurant.is_favorite) btnFav.classList.add('active');

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
let fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
let fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
  }
  else {
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  }

  /**
   * Add review section
   */
  const formReview = document.createElement('form');

  const inpName = document.createElement('input');
  inpName.placeholder = 'Your name';
  inpName.required = true;

  const inpRating = document.createElement('input');
  inpRating.placeholder = 'Your rating (out of 5)';
  inpRating.type = 'number';
  inpRating.max = 5;
  inpRating.min = 1;
  inpRating.required = true;

  const comments = document.createElement('textarea');
  comments.rows = 3;
  comments.placeholder = 'Your review';
  comments.required = true;
  
  const btnAddReview = document.createElement('button');
  btnAddReview.classList.add('primary');
  btnAddReview.type = 'submit';
  btnAddReview.innerText = 'Add your review';

  /**
   * Review submit event
   */
  formReview.addEventListener('submit', function(e) {
    e.preventDefault();

    // Reject submission if there's empty whitespace
    if (!(inpName.value.trim() && comments.value.trim())) return;
    
    const review = {
      restaurant_id: parseInt(getParameterByName('id')),
      name: inpName.value,
      rating: inpRating.value,
      comments: comments.value
    };

    DBHelper.addReview(review)
    .then(review => {
      document.getElementById('reviews-list').appendChild(createReviewHTML(review));

      // Reset the form once the review was added successfully
      formReview.reset();
    })
    .catch(err => {
      // Error handling can be done here
      console.log(err);
    })
    
  });


  formReview.appendChild(inpName);
  formReview.appendChild(inpRating);
  formReview.appendChild(comments);
  formReview.appendChild(btnAddReview);

  container.appendChild(formReview);
}

/**
 * Create review HTML and add it to the webpage.
 */
let createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.createdAt ? new Date(review.createdAt).toDateString() : 'Stored offline';
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `${review.rating}/5`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
let fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
let getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function toggleFavorite(el) {  
  DBHelper.toggleFavorite(el.classList.toggle('active'), getParameterByName('id'));
}