// app.js - Main application file with improved error handling
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

// Initialize app
const app = express();

// Create MongoDB session store (with fallback)
let sessionStore;
try {
  sessionStore = MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // time in seconds
    ttl: 14 * 24 * 60 * 60 // 14 days
  });
  console.log('MongoDB session store created');
} catch (err) {
  console.error('Error creating MongoDB session store:', err.message);
  console.warn('Using memory store for sessions (not suitable for production)');
  const MemoryStore = require('memorystore')(session);
  sessionStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
}

// Try to connect to MongoDB (non-blocking)
connectDB().catch(err => {
  console.warn('Initial database connection failed. App will continue with limited functionality.');
});

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

// Session middleware (with fallback)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
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

// Import routes (inside try-catch to handle errors)
try {
  // Require routes
  const indexRoutes = require('./routes/indexRoutes');
  const userRoutes = require('./routes/userRoutes');
  const artworkRoutes = require('./routes/artworkRoutes');
  const exhibitionRoutes = require('./routes/exhibitionRoutes');
  const purchaseRoutes = require('./routes/purchaseRoutes');

  // Use routes
  app.use('/', indexRoutes);
  app.use('/users', userRoutes);
  app.use('/artworks', artworkRoutes);
  app.use('/exhibitions', exhibitionRoutes);
  app.use('/purchases', purchaseRoutes);
} catch (err) {
  console.error('Error loading routes:', err.message);
  
  // Fallback route (if route files couldn't be loaded)
  app.get('/', (req, res) => {
    res.render('pages/home', {
      title: 'Home - Limited Mode',
      featuredArtworks: [],
      upcomingExhibitions: [],
      featuredArtists: [],
      weatherData: null,
      artRecommendations: []
    });
  });
}

// 404 error handler
app.use((req, res, next) => {
  const error = new Error('Page Not Found');
  error.status = 404;
  next(error);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('App Error:', error.message);
  
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