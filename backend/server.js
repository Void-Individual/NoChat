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

// Serve static files from the 'assets' directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the 'scripts' directory
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

// Serve html redirection files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, 'views')));

// Serve static files
app.use('/static', (req, res, next) => {
  const filePath = path.join(__dirname, 'static', req.url);
  //console.log(`Static file being served: ${filePath}`);

  // Serve the static file
  express.static(path.join(__dirname, 'static'))(req, res, (err) => {
    if (err) {
        console.error(`Error serving static file: ${err}`);
        next(err); // Pass the error to the next middleware (optional)
    } else if (res.statusCode === 404) {
        console.error(`Static file not found: ${filePath}`);
        res.status(404).send('File not found'); // Handle the 404 error
    } else {
        next(); // No error, proceed as usual
    }
  });
});
//app.use('/static', express.static(path.join(__dirname, 'static')));

// Middleware to log each route being called before loading
app.use('/', (req, res, next) => {
  console.log(`Route called: ${req.method} ${req.url}`);
  routes(req, res, next); // Call the routes middleware after logging
});

// Start the server and listen at selected port
server.listen(port, '0.0.0.0', () => {
  console.log(`Server runing at localhost:${port}`);
});

module.exports = { io };
