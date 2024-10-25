function rain() {
  const amount = 200;
  const body = document.querySelector('body');
  let index = 0;
  while (index < amount) {
      const drop = document.createElement('i')
      let size = Math.random() * 5;
      let posX = Math.floor(Math.random() * window.innerWidth)
      let delay = Math.random() * -10
      let duration = Math.random() * 5

      drop.style.width = `${0.2 + size}px`
      drop.style.left = `${posX}px`
      drop.style.animationDelay = `${delay}s`
      drop.style.animationDuration = `${1 + duration}s`
      body.appendChild(drop)
      index++

  }
}
rain()

const create = document.querySelector('#chat');
create.addEventListener('click', async (e) => {
    console.log('Running logout')
    const response = await fetch('/disconnect', {
        method: 'GET',
        credentials: 'include' // Include cookies with the request
    });
    console.log(response);
    setInterval(async () => {
        if (response.ok) {
            alert('Logging out...');
            window.location.href = '/login-page.html'; // Optionally redirect after logout
        }
    }, 1000 * 1); // Log out after 2 seconds
});
