// controllers/userController.js
const User = require('../models/User');
const passport = require('passport');
const path = require('path');
const fs = require('fs');

// @desc    Render register form
// @route   GET /users/register
// @access  Public
exports.renderRegisterForm = (req, res) => {
  res.render('users/register', {
    title: 'Register'
  });
};

// @desc    Register user
// @route   POST /users/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, password2, role } = req.body;
  let errors = [];

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('users/register', {
      title: 'Register',
      errors,
      name,
      email
    });
  } else {
    try {
      // Check if user exists
      const userExists = await User.findOne({ email });

      if (userExists) {
        errors.push({ msg: 'Email is already registered' });
        res.render('users/register', {
          title: 'Register',
          errors,
          name,
          email
        });
      } else {
        // Create user
        const user = await User.create({
          name,
          email,
          password,
          role: role || 'user'
        });

        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/users/login');
      }
    } catch (err) {
      console.error(err);
      res.status(500).render('error', {
        title: 'Server Error',
        message: 'Server error'
      });
    }
  }
};

// @desc    Render login form
// @route   GET /users/login
// @access  Public
exports.renderLoginForm = (req, res) => {
  res.render('users/login', {
    title: 'Login'
  });
};

// @desc    Login user
// @route   POST /users/login
// @access  Public
exports.loginUser = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
};

// @desc    Logout user
// @route   GET /users/logout
// @access  Private
exports.logoutUser = (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
};

// @desc    Get user profile
// @route   GET /users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.render('users/profile', {
      title: 'Profile',
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/users/profile');
    }

    user.name = name || user.name;
    user.bio = bio || user.bio;

    if (req.file) {
      // Delete previous profile image if it exists and is not the default
      if (user.profileImage !== 'default-profile.jpg') {
        const previousImage = path.join(__dirname, '../public/uploads/', user.profileImage);
        if (fs.existsSync(previousImage)) {
          fs.unlinkSync(previousImage);
        }
      }
      user.profileImage = req.file.filename;
    }

    await user.save();

    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/users/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('/users/profile');
  }
};