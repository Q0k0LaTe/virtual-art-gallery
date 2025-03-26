// middleware/auth.js
const User = require('../models/User');

// Middleware to protect routes - requires login
exports.protect = async (req, res, next) => {
  try {
    // Check if user is logged in via passport
    if (!req.isAuthenticated()) {
      req.flash('error_msg', 'Please log in to access this resource');
      return res.redirect('/users/login');
    }
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    req.flash('error_msg', 'Not authorized');
    res.redirect('/users/login');
  }
};

// Middleware to restrict access based on user role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      req.flash('error_msg', 'Not authorized to access this resource');
      return res.redirect('/');
    }
    next();
  };
};