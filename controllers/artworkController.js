// controllers/artworkController.js
const Artwork = require('../models/Artwork');
const path = require('path');
const fs = require('fs');

// @desc    Get all artworks
// @route   GET /artworks
// @access  Public
exports.getAllArtworks = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { category, minPrice, maxPrice, artist, sort = '-createdAt' } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (artist) {
      filter.artist = artist;
    }
    
    // By default, only show artworks for sale to the public
    if (!req.user || (req.user.role !== 'admin')) {
      filter.forSale = true;
    }
    
    // Execute query with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    
    const total = await Artwork.countDocuments(filter);
    
    const artworks = await Artwork.find(filter)
      .populate('artist', 'name profileImage')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    // Pagination result
    const pagination = {};
    
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    pagination.totalPages = Math.ceil(total / limit);
    
    // Get categories for filter dropdown
    const categories = await Artwork.distinct('category');
    
    res.render('artworks/index', {
      title: 'Artworks',
      artworks,
      pagination,
      categories,
      filter: {
        category,
        minPrice,
        maxPrice,
        artist,
        sort
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load artworks');
    res.redirect('/');
  }
};

// @desc    Get single artwork
// @route   GET /artworks/:id
// @access  Public
exports.getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artist', 'name profileImage bio');
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/artworks');
    }
    
    // Get more artworks by the same artist
    const moreByArtist = await Artwork.find({
      artist: artwork.artist._id,
      _id: { $ne: artwork._id }
    })
      .sort('-createdAt')
      .limit(4);
    
    // Get similar artworks (same category)
    const similarArtworks = await Artwork.find({
      category: artwork.category,
      _id: { $ne: artwork._id },
      artist: { $ne: artwork.artist._id }
    })
      .populate('artist', 'name')
      .sort('-createdAt')
      .limit(4);
    
    res.render('artworks/show', {
      title: artwork.title,
      artwork,
      moreByArtist,
      similarArtworks
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load artwork');
    res.redirect('/artworks');
  }
};

// @desc    Render create artwork form
// @route   GET /artworks/create
// @access  Private (Artists only)
exports.renderCreateForm = (req, res) => {
  res.render('artworks/create', {
    title: 'Create Artwork'
  });
};

// @desc    Create new artwork
// @route   POST /artworks
// @access  Private (Artists only)
exports.createArtwork = async (req, res) => {
  try {
    const { title, description, category, price, forSale, width, height, depth, unit } = req.body;
    
    if (!req.file) {
      req.flash('error_msg', 'Please upload an image');
      return res.redirect('/artworks/create');
    }
    
    await Artwork.create({
      title,
      description,
      image: req.file.filename,
      category,
      price,
      forSale: forSale === 'true',
      dimensions: {
        width: width || 0,
        height: height || 0,
        depth: depth || 0,
        unit: unit || 'cm'
      },
      artist: req.user.id
    });
    
    req.flash('success_msg', 'Artwork created successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating artwork');
    res.redirect('/artworks/create');
  }
};

// @desc    Render edit artwork form
// @route   GET /artworks/:id/edit
// @access  Private (Artwork owner only)
exports.renderEditForm = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user is artwork owner
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/artworks');
    }
    
    res.render('artworks/edit', {
      title: 'Edit Artwork',
      artwork
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load artwork');
    res.redirect('/dashboard');
  }
};

// @desc    Update artwork
// @route   PUT /artworks/:id
// @access  Private (Artwork owner only)
exports.updateArtwork = async (req, res) => {
  try {
    const { title, description, category, price, forSale, width, height, depth, unit } = req.body;
    
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user is artwork owner
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/artworks');
    }
    
    artwork.title = title || artwork.title;
    artwork.description = description || artwork.description;
    artwork.category = category || artwork.category;
    artwork.price = price || artwork.price;
    artwork.forSale = forSale === 'true';
    artwork.dimensions = {
      width: width || artwork.dimensions.width,
      height: height || artwork.dimensions.height,
      depth: depth || artwork.dimensions.depth,
      unit: unit || artwork.dimensions.unit
    };
    
    if (req.file) {
      // Delete previous image
      const previousImage = path.join(__dirname, '../public/uploads/', artwork.image);
      if (fs.existsSync(previousImage)) {
        fs.unlinkSync(previousImage);
      }
      artwork.image = req.file.filename;
    }
    
    await artwork.save();
    
    req.flash('success_msg', 'Artwork updated successfully');
    res.redirect(`/artworks/${artwork._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating artwork');
    res.redirect(`/artworks/${req.params.id}/edit`);
  }
};

// @desc    Delete artwork
// @route   DELETE /artworks/:id
// @access  Private (Artwork owner only)
exports.deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user is artwork owner
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/artworks');
    }
    
    // Delete image file
    const imagePath = path.join(__dirname, '../public/uploads/', artwork.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    await artwork.remove();
    
    req.flash('success_msg', 'Artwork deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting artwork');
    res.redirect('/dashboard');
  }
};