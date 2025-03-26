// app.js - Main application file
const dotenv = require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const morgan = require('morgan');
const methodOverride = require('method-override');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();

// Passport configuration
require('./config/passport')(passport);

// Logging middleware in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method override for PUT/DELETE requests
app.use(methodOverride('_method'));

// Set up EJS view engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// TEMPORARY ROUTES FOR INITIAL SETUP
app.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Home'
  });
});

// 404 error handler
app.use((req, res, next) => {
  const error = new Error('Page Not Found');
  error.status = 404;
  next(error);
});

// Error handling middleware
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.render('pages/error', {
    title: 'Error',
    message: error.message,
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;