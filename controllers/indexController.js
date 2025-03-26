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
  // Initialize data object with defaults
  const data = {
    title: 'Virtual Art Gallery',
    featuredArtworks: [],
    upcomingExhibitions: [],
    featuredArtists: [],
    weatherData: null,
    artRecommendations: []
  };

  try {
    // Try to fetch artwork data - wrap in try-catch to continue if DB is down
    try {
      // Get featured artworks
      data.featuredArtworks = await Artwork.find({ forSale: true })
        .populate('artist', 'name')
        .sort('-createdAt')
        .limit(6);
    } catch (err) {
      console.warn('Failed to fetch featured artworks:', err.message);
    }

    // Try to fetch exhibitions data
    try {
      // Get upcoming exhibitions
      const today = new Date();
      data.upcomingExhibitions = await Exhibition.find({
        isPublished: true,
        startDate: { $gte: today }
      })
        .populate('curator', 'name')
        .sort('startDate')
        .limit(3);
    } catch (err) {
      console.warn('Failed to fetch upcoming exhibitions:', err.message);
    }

    // Try to fetch artists data
    try {
      // Get featured artists
      data.featuredArtists = await User.find({ role: 'artist' })
        .select('name profileImage bio')
        .limit(4);
    } catch (err) {
      console.warn('Failed to fetch featured artists:', err.message);
    }
    
    // Try to fetch weather data - if it fails, we'll just use null
    try {
      // Get weather data for New York (as default location)
      data.weatherData = await apiService.getWeather('New York');
      
      // Get art recommendations based on weather
      if (data.weatherData && data.weatherData.weather && data.weatherData.weather[0]) {
        data.artRecommendations = await apiService.getArtRecommendations(data.weatherData.weather[0].main);
      }
    } catch (err) {
      console.warn('Weather or Art API error:', err.message);
      // Continue without weather data if there's an error
    }
    
    // Render the home page with all available data
    res.render('pages/home', data);
  } catch (err) {
    console.error('Error rendering home page:', err);
    res.status(500).render('pages/error', {
      title: 'Server Error',
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err : {}
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
    const dashboardData = {
      title: 'Dashboard',
      userArtworks: [],
      userExhibitions: [],
      userPurchases: [],
      userSales: [],
      stats: {
        totalArtworks: 0,
        totalExhibitions: 0,
        totalPurchases: 0,
        totalSales: 0,
        revenue: 0
      }
    };

    // Get user's artworks if they are an artist
    if (req.user.role === 'artist' || req.user.role === 'admin') {
      try {
        dashboardData.userArtworks = await Artwork.find({ artist: req.user.id })
          .sort('-createdAt');
        dashboardData.stats.totalArtworks = dashboardData.userArtworks.length;
      } catch (err) {
        console.warn('Error fetching user artworks:', err.message);
      }
    }
    
    // Get user's exhibitions if they are an artist
    if (req.user.role === 'artist' || req.user.role === 'admin') {
      try {
        dashboardData.userExhibitions = await Exhibition.find({ curator: req.user.id })
          .sort('-createdAt');
        dashboardData.stats.totalExhibitions = dashboardData.userExhibitions.length;
      } catch (err) {
        console.warn('Error fetching user exhibitions:', err.message);
      }
    }
    
    // Get user's purchases
    try {
      dashboardData.userPurchases = await Purchase.find({ buyer: req.user.id })
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
      
      dashboardData.stats.totalPurchases = await Purchase.countDocuments({ buyer: req.user.id });
    } catch (err) {
      console.warn('Error fetching user purchases:', err.message);
    }
    
    // Get user's sales if they are an artist
    if (req.user.role === 'artist' || req.user.role === 'admin') {
      try {
        dashboardData.userSales = await Purchase.find({ seller: req.user.id })
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
        
        dashboardData.stats.totalSales = await Purchase.countDocuments({ seller: req.user.id });
        
        const totalRevenue = await Purchase.aggregate([
          { $match: { seller: req.user._id } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        
        dashboardData.stats.revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
      } catch (err) {
        console.warn('Error fetching user sales:', err.message);
      }
    }
    
    res.render('pages/dashboard', dashboardData);
  } catch (err) {
    console.error('Error rendering dashboard:', err);
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
        results: {},
        query: '',
        type: 'all'
      });
    }
    
    let results = {};
    
    // Search artworks
    if (type === 'all' || type === 'artworks') {
      try {
        results.artworks = await Artwork.find({
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ],
          forSale: true
        })
          .populate('artist', 'name')
          .limit(20);
      } catch (err) {
        console.warn('Error searching artworks:', err.message);
        results.artworks = [];
      }
    }
    
    // Search exhibitions
    if (type === 'all' || type === 'exhibitions') {
      try {
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
      } catch (err) {
        console.warn('Error searching exhibitions:', err.message);
        results.exhibitions = [];
      }
    }
    
    // Search artists
    if (type === 'all' || type === 'artists') {
      try {
        results.artists = await User.find({
          role: 'artist',
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { bio: { $regex: query, $options: 'i' } }
          ]
        })
          .select('name profileImage bio')
          .limit(20);
      } catch (err) {
        console.warn('Error searching artists:', err.message);
        results.artists = [];
      }
    }
    
    res.render('pages/search', {
      title: 'Search Results',
      results,
      query,
      type: type || 'all'
    });
  } catch (err) {
    console.error('Error processing search:', err);
    res.status(500).render('pages/error', {
      title: 'Server Error',
      message: 'Server error'
    });
  }
};