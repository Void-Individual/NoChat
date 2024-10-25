
const create = document.querySelector('#login');
create.addEventListener('click', async (e) => {
    console.log('Running logout')
    const response = await fetch('/disconnect', {
        method: 'GET',
        credentials: 'include' // Include cookies with the request
    });
    console.log(response);
    if (response.ok) {
        console.log('Logged user out first')
    }
    window.location.href = '/public/login-page.html'; // Optionally redirect after logout
});
