import express from 'express';
import routes from './routes/index';
import cookieParser from 'cookie-parser'; // Import cookie parser
import { checkAuth } from './controllers/AuthController';

const path = require('path');
const app = express();
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

// Use a cookie parser middleware
app.use(cookieParser());

// Run the middleware to check previous authentication
//app.use(checkAuth);

// Serve static files from the static directory
app.use('/', express.static(path.join(__dirname, '/views')));

// Middleware to check for authentication token
//app.use(async (req, res, next) => {
//  try {
//    const token = req.cookies.authToken;
//    if (token) {
//      // Check if the token is valid
//      const userId = await redisClient.get(`auth_${token}`);
//      if (userId) {
//        req.user = await findOneUser(dbClient, { _id: userId });
//        // If the token is valid, redirect to the protected area
//        return res.redirect('/welcome.html'); // Adjust to your protected route
//      }
//    }
//    // No valid token, continue to the normal index page
//    next();
//  } catch (err) {
//    console.error('Error in authentication check:', err.message);
//    next(err);
//  }
//});

//const bodyParser = require('body-parser'); // To parse form data

// Load the routes from the routes dir
app.use('/', routes);

// Start the server and listen at selected port
app.listen(port, '0.0.0.0', () => {
  console.log(`Server runing at localhost:${port}`);
});
