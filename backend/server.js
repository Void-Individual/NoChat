import express from 'express';
import routes from './routes/index';
import cookieParser from 'cookie-parser'; // Import cookie parser
import http from 'http';
import socketIo from 'socket.io';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
// Attach the socket.io instance to the _server object
const port = process.env.PORT || 5000;

// Middleware to set the ngrok-skip-browser-warning header
//app.use((req, res, next) => {
//  res.setHeader('ngrok-skip-browser-warning', 'Yes');
//  next();
//});

const users = {}; // Store users by channel

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinChannel', (channel) => {
    socket.join(channel);
    users[socket.id] = channel;
    console.log(`User joined channel: ${channel}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    delete users[socket.id]; // Remove the user from the list when disconnected
  });
});

// Middleware to parse JSON bodies
app.use(express.json(), express.urlencoded({ extended: true }));
app.use(cookieParser()); // Use a cookie parser middleware

// To use .html files, but take advantage of dynamic ejs templating...
app.engine('html', require('ejs').renderFile);
// Set the view engine to ejs
app.set('view engine', 'html'); // But set it to html for html files
// Set the 'views' directory for html files to be called with ejs
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));

// Load the routes
app.use('/', routes);

// Start the server and listen at selected port
server.listen(port, '0.0.0.0', () => {
  console.log(`Server runing at localhost:${port}`);
});

module.exports = { io };
