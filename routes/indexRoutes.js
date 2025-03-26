// routes/indexRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  renderHomePage, 
  renderAboutPage, 
  renderContactPage, 
  processContactForm,
  renderDashboard,
  search
} = require('../controllers/indexController');

// @route   GET /
// @desc    Home page
// @access  Public
router.get('/', renderHomePage);

// @route   GET /about
// @desc    About page
// @access  Public
router.get('/about', renderAboutPage);

// @route   GET /contact
// @desc    Contact page
// @access  Public
router.get('/contact', renderContactPage);

// @route   POST /contact
// @desc    Process contact form
// @access  Public
router.post('/contact', processContactForm);

// @route   GET /dashboard
// @desc    Dashboard
// @access  Private
router.get('/dashboard', protect, renderDashboard);

// @route   GET /search
// @desc    Search functionality
// @access  Public
router.get('/search', search);

module.exports = router;