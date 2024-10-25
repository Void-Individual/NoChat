// If the page is reloaded, remove the search options completely
const [navigation] = performance.getEntriesByType("navigation");
if (navigation && navigation.type === "reload") {
  console.log("The page was reloaded.");
  window.location.href = '/user/me';

}

  // This is a script to handle the redirection endpoint if logout is clicked
const create = document.querySelector('#logout');
create.addEventListener('click', async (e) => {
    console.log('Running logout') // This is merely for frontend examination
    const response = await fetch('/disconnect', { // Fetch the endpoint
        method: 'GET',
        credentials: 'include' // Include cookies with the request
    });

    // After the endpoint has been run, set a timer and then logout
    setTimeout(() => {
        if (response.ok) {
            alert('Logging out...'); // Can we make the webpage show the alert for a moment
            // before autoredirecting, instead of waiting for a click OK confirmation everytime?
            window.location.href = '/public/login-page.html'; // Redirect after logout and OK
        }
    }, 1000 * 1); // Log out after 1 seconds
});

// Must serve the whole website in https, unless in localhost
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            showPosition,
            showError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
      document.getElementById('location').innerHTML = "Geolocation is not supported by this browser.";
    }
  }

function showPosition(position) {
    document.getElementById('location').innerHTML =
      "Latitude: " + position.coords.latitude +
      "<br>Longitude: " + position.coords.longitude;
}

function showError(error) {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        document.getElementById('location').innerHTML = "Permission denied. Please refresh the page to try again or enable location in your browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        document.getElementById('location').innerHTML = "Location information is unavailable.";
        break;
      case error.TIMEOUT:
        document.getElementById('location').innerHTML = "The request to get user location timed out.";
        break;
      case error.UNKNOWN_ERROR:
        document.getElementById('location').innerHTML = "An unknown error occurred.";
        break;
    }
}
function reloadPage() {
    location.reload();  // This reloads the current page
}
