// controllers/indexController.js
const Artwork = require('../models/Artwork');
const Exhibition = require('../models/Exhibition');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const apiService = require('../services/apiService');

// @desc    Render home page
// @route   GET /
// @access  Public
exports.renderHomePage = async (req, res) => {
  try {
    // Get featured artworks
    const featuredArtworks = await Artwork.find({ forSale: true })
      .populate('artist', 'name')
      .sort('-createdAt')
      .limit(6);
    
    // Get upcoming exhibitions
    const today = new Date();
    const upcomingExhibitions = await Exhibition.find({
      isPublished: true,
      startDate: { $gte: today }
    })
      .populate('curator', 'name')
      .sort('startDate')
      .limit(3);
    
    // Get featured artists
    const featuredArtists = await User.find({ role: 'artist' })
      .select('name profileImage bio')
      .limit(4);
    
    // Fetch weather data for art viewing recommendation
    let weatherData = null;
    let artRecommendations = [];
    try {
      // Get weather data for New York (as default location)
      weatherData = await apiService.getWeather('New York');
      
      // Get art recommendations based on weather
      if (weatherData && weatherData.weather && weatherData.weather[0]) {
        artRecommendations = await apiService.getArtRecommendations(weatherData.weather[0].main);
      }
    } catch (error) {
      console.error('Weather or Art API error:', error);
      // Continue without weather data if there's an error
    }
    
    res.render('pages/home', {
      title: 'Virtual Art Gallery',
      featuredArtworks,
      upcomingExhibitions,
      featuredArtists,
      weatherData,
      artRecommendations
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};

// @desc    Render about page
// @route   GET /about
// @access  Public
exports.renderAboutPage = (req, res) => {
  res.render('pages/about', {
    title: 'About Us'
  });
};

// @desc    Render contact page
// @route   GET /contact
// @access  Public
exports.renderContactPage = (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Us'
  });
};

// @desc    Process contact form
// @route   POST /contact
// @access  Public
exports.processContactForm = (req, res) => {
  const { name, email, message } = req.body;
  
  // In a real application, you would send an email or save to database
  console.log('Contact form submission:', { name, email, message });
  
  req.flash('success_msg', 'Your message has been sent!');
  res.redirect('/contact');
};

// @desc    Render dashboard
// @route   GET /dashboard
// @access  Private
exports.renderDashboard = async (req, res) => {
  try {
    // Get user's artworks if they are an artist
    let userArtworks = [];
    if (req.user.role === 'artist' || req.user.role === 'admin') {
      userArtworks = await Artwork.find({ artist: req.user.id })
        .sort('-createdAt');
    }
    
    // Get user's exhibitions if they are an artist
    let userExhibitions = [];
    if (req.user.role === 'artist' || req.user.role === 'admin') {
      userExhibitions = await Exhibition.find({ curator: req.user.id })
        .sort('-createdAt');
    }
    
    // Get user's purchases
    const userPurchases = await Purchase.find({ buyer: req.user.id })
      .populate({
        path: 'artwork',
        select: 'title image price'
      })
      .populate({
        path: 'seller',
        select: 'name'
      })
      .sort('-createdAt')
      .limit(5);
    
    // Get user's sales if they are an artist
    let userSales = [];
    if (req.user.role === 'artist' || req.user.role === 'admin') {
      userSales = await Purchase.find({ seller: req.user.id })
        .populate({
          path: 'artwork',
          select: 'title image price'
        })
        .populate({
          path: 'buyer',
          select: 'name'
        })
        .sort('-createdAt')
        .limit(5);
    }
    
    // Calculate some statistics
    const totalArtworks = userArtworks.length;
    const totalExhibitions = userExhibitions.length;
    const totalPurchases = await Purchase.countDocuments({ buyer: req.user.id });
    const totalSales = await Purchase.countDocuments({ seller: req.user.id });
    const totalRevenue = await Purchase.aggregate([
      { $match: { seller: req.user._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    
    res.render('pages/dashboard', {
      title: 'Dashboard',
      userArtworks,
      userExhibitions,
      userPurchases,
      userSales,
      stats: {
        totalArtworks,
        totalExhibitions,
        totalPurchases,
        totalSales,
        revenue
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};

// @desc    Search functionality
// @route   GET /search
// @access  Public
exports.search = async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query) {
      return res.render('pages/search', {
        title: 'Search',
        results: [],
        query: '',
        type: 'all'
      });
    }
    
    let results = {};
    
    // Search artworks
    if (type === 'all' || type === 'artworks') {
      results.artworks = await Artwork.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      })
        .populate('artist', 'name')
        .limit(20);
    }
    
    // Search exhibitions
    if (type === 'all' || type === 'exhibitions') {
      results.exhibitions = await Exhibition.find({
        isPublished: true,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      })
        .populate('curator', 'name')
        .limit(20);
    }
    
    // Search artists
    if (type === 'all' || type === 'artists') {
      results.artists = await User.find({
        role: 'artist',
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } }
        ]
      })
        .select('name profileImage bio')
        .limit(20);
    }
    
    res.render('pages/search', {
      title: 'Search Results',
      results,
      query,
      type: type || 'all'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};