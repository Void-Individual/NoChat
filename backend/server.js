import express from 'express';
import routes from './routes/index';
import cookieParser from 'cookie-parser'; // Import cookie parser
import http from 'http';
//import socketIo from 'socket.io';
import path from 'path';

const app = express();
const server = http.createServer(app);
//const io = socketIo(server);

const port = process.env.PORT || 5000;

// Middleware to set the ngrok-skip-browser-warning header
//app.use((req, res, next) => {
//  res.setHeader('ngrok-skip-browser-warning', 'Yes');
//  next();
//});

// To use .html files, but take advantage of dynamic ejs templating...
app.engine('html', require('ejs').renderFile);
// Set the view engine to ejs
app.set('view engine', 'html'); // But set it to html for html files
// Set the 'views' directory
app.set('views', path.join(__dirname, '/views'));

// Middleware to parse JSON bodies
app.use(express.json(), express.urlencoded({ extended: true }));
app.use(cookieParser()); // Use a cookie parser middleware

// Serve static files
app.use('/', express.static(path.join(__dirname, '/views')));

// Load the routes
app.use('/', routes);

// Start the server and listen at selected port
server.listen(port, '0.0.0.0', () => {
  console.log(`Server runing at localhost:${port}`);
});
