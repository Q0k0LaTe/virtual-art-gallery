// controllers/artworkURLController.js
const ArtworkURL = require('../models/ArtworkURL');

// @desc    Get all URL-based artworks
// @route   GET /artworksurl
// @access  Public
exports.getAllArtworksURL = async (req, res) => {
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
    
    const total = await ArtworkURL.countDocuments(filter);
    
    const artworks = await ArtworkURL.find(filter)
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
    const categories = await ArtworkURL.distinct('category');
    
    res.render('artworksurl/index', {
      title: 'URL Artworks',
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
    req.flash('error_msg', 'Cannot load URL artworks');
    res.redirect('/');
  }
};

// @desc    Get single URL-based artwork
// @route   GET /artworksurl/:id
// @access  Public
exports.getArtworkURLById = async (req, res) => {
  try {
    const artwork = await ArtworkURL.findById(req.params.id)
      .populate('artist', 'name profileImage bio');
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/artworksurl');
    }
    
    // Get more artworks by the same artist
    const moreByArtist = await ArtworkURL.find({
      artist: artwork.artist._id,
      _id: { $ne: artwork._id }
    })
      .sort('-createdAt')
      .limit(4);
    
    // Get similar artworks (same category)
    const similarArtworks = await ArtworkURL.find({
      category: artwork.category,
      _id: { $ne: artwork._id },
      artist: { $ne: artwork.artist._id }
    })
      .populate('artist', 'name')
      .sort('-createdAt')
      .limit(4);
    
    res.render('artworksurl/show', {
      title: artwork.title,
      artwork,
      moreByArtist,
      similarArtworks
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load artwork');
    res.redirect('/artworksurl');
  }
};

// @desc    Render create URL artwork form
// @route   GET /artworksurl/create
// @access  Private (Artists only)
exports.renderCreateForm = (req, res) => {
  res.render('artworksurl/create', {
    title: 'Create URL Artwork'
  });
};

// @desc    Create new URL artwork
// @route   POST /artworksurl
// @access  Private (Artists only)
exports.createArtworkURL = async (req, res) => {
  try {
    const { title, description, category, imageUrl, price, forSale, width, height, depth, unit } = req.body;
    
    if (!imageUrl) {
      req.flash('error_msg', 'Please provide an image URL');
      return res.redirect('/artworksurl/create');
    }
    
    await ArtworkURL.create({
      title,
      description,
      imageUrl,
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
    
    req.flash('success_msg', 'URL Artwork created successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating URL artwork');
    res.redirect('/artworksurl/create');
  }
};

// @desc    Render edit URL artwork form
// @route   GET /artworksurl/:id/edit
// @access  Private (Artwork owner only)
exports.renderEditForm = async (req, res) => {
  try {
    const artwork = await ArtworkURL.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user is artwork owner
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/artworksurl');
    }
    
    res.render('artworksurl/edit', {
      title: 'Edit URL Artwork',
      artwork
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load artwork');
    res.redirect('/dashboard');
  }
};

// @desc    Update URL artwork
// @route   PUT /artworksurl/:id
// @access  Private (Artwork owner only)
exports.updateArtworkURL = async (req, res) => {
  try {
    const { title, description, category, imageUrl, price, forSale, width, height, depth, unit } = req.body;
    
    const artwork = await ArtworkURL.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user is artwork owner
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/artworksurl');
    }
    
    artwork.title = title || artwork.title;
    artwork.description = description || artwork.description;
    artwork.category = category || artwork.category;
    artwork.price = price || artwork.price;
    artwork.forSale = forSale === 'true';
    artwork.imageUrl = imageUrl || artwork.imageUrl;
    artwork.dimensions = {
      width: width || artwork.dimensions.width,
      height: height || artwork.dimensions.height,
      depth: depth || artwork.dimensions.depth,
      unit: unit || artwork.dimensions.unit
    };
    
    await artwork.save();
    
    req.flash('success_msg', 'URL Artwork updated successfully');
    res.redirect(`/artworksurl/${artwork._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating URL artwork');
    res.redirect(`/artworksurl/${req.params.id}/edit`);
  }
};

// @desc    Delete URL artwork
// @route   DELETE /artworksurl/:id
// @access  Private (Artwork owner only)
exports.deleteArtworkURL = async (req, res) => {
  try {
    const artwork = await ArtworkURL.findById(req.params.id);
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user is artwork owner
    if (artwork.artist.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/artworksurl');
    }
    
    await artwork.deleteOne();
    
    req.flash('success_msg', 'URL Artwork deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting URL artwork');
    res.redirect('/dashboard');
  }
};