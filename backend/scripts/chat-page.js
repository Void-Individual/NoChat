//const { io } = require('../server'); // Import io for socket.io communication

// Retrieve the object data (username was passed in here instead of whole objects)
    // that was passed through ejs
    const userDataElement = document.getElementById('userData');
    const user1 = userDataElement.getAttribute('data-user1'); // Retrieves the tagged main user
    const user2 = userDataElement.getAttribute('data-user2'); // Retrieves the other user
    const channel = userDataElement.getAttribute('channel'); // The channel that the conversation is passed through
    let spam = false; // Variable to prevent spammoing texts

    const socket = io(); // Initialize Socket.io connection
    // Join the chat channel
    console.log('running socket')
    socket.emit('joinChannel', channel);

    // Listen for new messages from the server
    socket.on('newMessage', ({ sender, message }) => {
      console.log('catching new messages')
      const chatList = document.getElementById('chatList');
      const newMessage = document.createElement('li');

      // If a new message is published and is sent
      if (sender === user1) {
        // If the sender is this main user, trigger the user class
        console.log('Text sent')
        if (message.split(':')[1] !== 'Sent media') {
          console.log('Aye')
          newMessage.className = 'user';
          newMessage.textContent = `You: ${message.split(':')[1]}`;
          window.location.reload();
        }
      } else {
        // Trigger the alternate other class
        if (message.split(':')[1] !== 'Sent media') {
          newMessage.className = 'other';
          newMessage.textContent = `${message}`;
          window.location.reload();
        }
      }
      // Update the webpage. This script will run on the 2 active webpages
      // and so while theyre running separately, they will be achieving the same result
      chatList.appendChild(newMessage);

      // Scroll to the bottom of the chat after receiving a new message
      chatList.scrollTop = chatList.scrollHeight;
    });


    // Function to send message
    async function sendMessage() {
      const formData = new FormData();
      // Retrieve and trim the passed message of all whitespaces
      const messageInput = document.getElementById('message')
      let message = messageInput.value.trim();

      const fileInput = document.getElementById('fileInput');
      let file = null
      if (fileInput) {
        file = fileInput.files[0]; // Get the selected file
        formData.append('media', file); // Append the file to the form data
      }


      // If it turns out to be blank...
      if (message === '') {
        if (file) {
          console.log('Passing media');
          message = 'Sent media';
        } else {
          alert('Please type a message.');
          return;
        }
      }
      formData.append('message', `${user1}: ${message}`); // Append the file to the form data

      spam = true;

      // Call the endpoint to process the sent message
      try {
        // The endpoint is relative to the alternate user
        const response = await fetch(`/chat-send/${user2}`, {
          method: 'POST',
          credentials: 'include', // Include cookies with the request
          body: formData
          //body: JSON.stringify({ message: `${user1}: ${message}` }),
        });

        // If it was successful...
        if (response.ok) {
          // Clear the input field after the message sends
          messageInput.value = '';
          console.log('Cleared the field') // As frontend test, remove if deemed unnecessary
          spam = false;
        } else {
          console.error('Failed to send message:', response.statusText);
        }
      } catch (err) {
        console.log('Error occurred heere:', err);
      }
    }

    // Add event listener to Send button
    document.querySelector('#sendButton').addEventListener('click', sendMessage);
    // Add the same event listener, but to the Enter key too
    document.getElementById('message').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        if (!spam) {
          sendMessage();
          //spam = false;
        }
      }
    });

    // Scroll the entire page's content to the bottom immediately aafter the page loads
    window.onload = function () {
      const chatList = document.getElementById('chatList');
      chatList.scrollTop = chatList.scrollHeight;
    };

    // Script to handle file upload
    //document.getElementById('uploadForm').addEventListener('submit', function(event) {
    //  event.preventDefault(); // Prevent the default form submission

    //  const fileInput = document.getElementById('fileInput');
    //  const file = fileInput.files[0]; // Get the selected file

    //  if (!file) {
    //    alert('Please select a file to upload');
    //    return;
    //  }

    //  const formData = new FormData();
    //  formData.append('media', file); // Append the file to the form data

    //  // Send the form data using fetch API
    //  fetch('/upload', {
    //    method: 'POST',
    //    body: formData
    //  })
    //  .then(response => response.json())
    //  .then(data => {
    //    console.log('File uploaded successfully:', data);
    //  })
    //  .catch(error => {
    //    console.error('Error uploading file:', error);
    //  });
    //});
