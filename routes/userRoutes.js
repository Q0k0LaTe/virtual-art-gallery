// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  renderRegisterForm,
  registerUser,
  renderLoginForm,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');

// @route   GET /users/register
// @desc    Render register form
// @access  Public
router.get('/register', renderRegisterForm);

// @route   POST /users/register
// @desc    Register user
// @access  Public
router.post('/register', registerUser);

// @route   GET /users/login
// @desc    Render login form
// @access  Public
router.get('/login', renderLoginForm);

// @route   POST /users/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

// @route   GET /users/logout
// @desc    Logout user
// @access  Private
router.get('/logout', logoutUser);

// @route   GET /users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   PUT /users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, upload.single('profileImage'), updateUserProfile);

module.exports = router;