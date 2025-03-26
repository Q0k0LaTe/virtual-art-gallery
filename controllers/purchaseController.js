// controllers/purchaseController.js
const Purchase = require('../models/Purchase');
const Artwork = require('../models/Artwork');

// @desc    Process artwork purchase
// @route   POST /purchases
// @access  Private
exports.purchaseArtwork = async (req, res) => {
  try {
    const { artworkId } = req.body;
    
    const artwork = await Artwork.findById(artworkId).populate('artist');
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/artworks');
    }
    
    if (!artwork.forSale) {
      req.flash('error_msg', 'This artwork is not for sale');
      return res.redirect(`/artworks/${artworkId}`);
    }
    
    // In a real application, you would integrate with a payment gateway here
    // For this example, we'll simulate a successful payment
    const transactionId = `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create purchase record
    await Purchase.create({
      artwork: artworkId,
      buyer: req.user.id,
      seller: artwork.artist._id,
      amount: artwork.price,
      transactionId,
      status: 'completed'
    });
    
    // Update artwork to not for sale
    artwork.forSale = false;
    await artwork.save();
    
    req.flash('success_msg', 'Artwork purchased successfully');
    res.redirect('/purchases/history');
  } catch (err) {
    console.error(err);
    
    // Check for duplicate purchase error (MongoDB duplicate key error)
    if (err.code === 11000) {
      req.flash('error_msg', 'You have already purchased this artwork');
    } else {
      req.flash('error_msg', 'Error processing purchase');
    }
    
    res.redirect(`/artworks/${req.body.artworkId}`);
  }
};

// @desc    Get purchase history
// @route   GET /purchases/history
// @access  Private
exports.getPurchaseHistory = async (req, res) => {
  try {
    // Get purchases where user is buyer or seller
    const purchases = await Purchase.find({
      $or: [
        { buyer: req.user.id },
        { seller: req.user.id }
      ]
    })
      .populate({
        path: 'artwork',
        select: 'title image price'
      })
      .populate({
        path: 'buyer',
        select: 'name'
      })
      .populate({
        path: 'seller',
        select: 'name'
      })
      .sort('-createdAt');
    
    res.render('purchases/history', {
      title: 'Purchase History',
      purchases,
      isBuyer: true // Default view as buyer
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load purchase history');
    res.redirect('/dashboard');
  }
};

// @desc    Get sales history (purchases where user is seller)
// @route   GET /purchases/sales
// @access  Private (Artists only)
exports.getSalesHistory = async (req, res) => {
  try {
    // Get purchases where user is seller
    const sales = await Purchase.find({ seller: req.user.id })
      .populate({
        path: 'artwork',
        select: 'title image price'
      })
      .populate({
        path: 'buyer',
        select: 'name'
      })
      .sort('-createdAt');
    
    res.render('purchases/history', {
      title: 'Sales History',
      purchases: sales,
      isBuyer: false // View as seller
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load sales history');
    res.redirect('/dashboard');
  }
};

// @desc    View purchase details
// @route   GET /purchases/:id
// @access  Private (Purchase buyer or seller only)
exports.getPurchaseDetails = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate({
        path: 'artwork',
        select: 'title image description price category dimensions'
      })
      .populate({
        path: 'buyer',
        select: 'name email'
      })
      .populate({
        path: 'seller',
        select: 'name email'
      });
    
    if (!purchase) {
      req.flash('error_msg', 'Purchase not found');
      return res.redirect('/purchases/history');
    }
    
    // Check if user is buyer or seller
    if (
      purchase.buyer._id.toString() !== req.user.id &&
      purchase.seller._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/purchases/history');
    }
    
    res.render('purchases/details', {
      title: 'Purchase Details',
      purchase,
      isBuyer: purchase.buyer._id.toString() === req.user.id
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load purchase details');
    res.redirect('/purchases/history');
  }
};