// Redirect after 5 seconds (5000ms)

setTimeout(async () => {
  try {
    // Make a request to check authentication
    const response = await fetch('/check-auth', {
      method: 'GET',
      credentials: 'include' // Include cookies with the request
    });
    if (response.ok) {
      // If authenticated, redirect to the authenticated page
      window.location.href = '/user/me'; // Replace with your protected page
    } else {
      // If not authenticated, redirect to the login page
      window.location.href = '/public/login-page';
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    window.location.href = '/public/login-page'; // Fallback to login page on error
  }
}, 1000 * 3); // 5000ms = 5 seconds
