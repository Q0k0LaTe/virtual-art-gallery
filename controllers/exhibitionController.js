// controllers/exhibitionController.js
const Exhibition = require('../models/Exhibition');
const Artwork = require('../models/Artwork');
const path = require('path');
const fs = require('fs');

// @desc    Get all exhibitions
// @route   GET /exhibitions
// @access  Public
exports.getAllExhibitions = async (req, res) => {
  try {
    const exhibitions = await Exhibition.find({ isPublished: true })
      .populate('curator', 'name')
      .sort('-startDate');
    
    res.render('exhibitions/index', {
      title: 'Virtual Exhibitions',
      exhibitions
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load exhibitions');
    res.redirect('/');
  }
};

// @desc    Get single exhibition
// @route   GET /exhibitions/:id
// @access  Public
exports.getExhibitionById = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id)
      .populate('curator', 'name profileImage bio')
      .populate({
        path: 'artworks',
        populate: {
          path: 'artist',
          select: 'name'
        }
      });
    
    if (!exhibition) {
      req.flash('error_msg', 'Exhibition not found');
      return res.redirect('/exhibitions');
    }

    // Check if exhibition is published or user is the curator
    if (!exhibition.isPublished && 
        (!req.user || (exhibition.curator._id.toString() !== req.user.id && req.user.role !== 'admin'))) {
      req.flash('error_msg', 'Exhibition not available');
      return res.redirect('/exhibitions');
    }
    
    res.render('exhibitions/show', {
      title: exhibition.title,
      exhibition,
      threejs: true
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load exhibition');
    res.redirect('/exhibitions');
  }
};

// @desc    Render create exhibition form
// @route   GET /exhibitions/create
// @access  Private (Artists only)
exports.renderCreateForm = async (req, res) => {
  try {
    // Get user's artworks to select for the exhibition
    const artworks = await Artwork.find({ artist: req.user.id }).select('title image');
    
    res.render('exhibitions/create', {
      title: 'Create Exhibition',
      artworks
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load create form');
    res.redirect('/dashboard');
  }
};

// @desc    Create new exhibition
// @route   POST /exhibitions
// @access  Private (Artists only)
exports.createExhibition = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      artworkIds, 
      themeColor, 
      roomWidth,
      roomHeight,
      roomDepth,
      wallColor,
      floorColor,
      isPublished 
    } = req.body;
    
    if (!req.file) {
      req.flash('error_msg', 'Please upload a cover image');
      return res.redirect('/exhibitions/create');
    }
    
    // Parse artwork IDs
    const artworks = artworkIds ? 
      (Array.isArray(artworkIds) ? artworkIds : [artworkIds]) : 
      [];
    
    // Create scene data object
    const sceneData = {
      backgroundColor: themeColor || '#f0f0f0',
      roomWidth: roomWidth || 20,
      roomHeight: roomHeight || 4,
      roomDepth: roomDepth || 20,
      wallColor: wallColor || '#ffffff',
      floorColor: floorColor || '#aaaaaa'
    };
    
    const exhibition = await Exhibition.create({
      title,
      description,
      coverImage: req.file.filename,
      startDate,
      endDate,
      artworks,
      themeColor: themeColor || '#FFFFFF',
      sceneData,
      curator: req.user.id,
      isPublished: isPublished === 'true'
    });
    
    req.flash('success_msg', 'Exhibition created successfully');
    res.redirect(`/exhibitions/${exhibition._id}/edit`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating exhibition: ' + err.message);
    res.redirect('/exhibitions/create');
  }
};

// @desc    Render edit exhibition form
// @route   GET /exhibitions/:id/edit
// @access  Private (Exhibition curator only)
exports.renderEditForm = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    
    if (!exhibition) {
      req.flash('error_msg', 'Exhibition not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user is exhibition curator
    if (exhibition.curator.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/exhibitions');
    }
    
    // Get user's artworks to select for the exhibition
    const artworks = await Artwork.find({ artist: req.user.id }).select('title image');
    
    res.render('exhibitions/edit', {
      title: 'Edit Exhibition',
      exhibition,
      artworks,
      selectedArtworks: exhibition.artworks.map(id => id.toString())
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load exhibition');
    res.redirect('/dashboard');
  }
};

// @desc    Update exhibition
// @route   PUT /exhibitions/:id
// @access  Private (Exhibition curator only)
exports.updateExhibition = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      artworkIds, 
      themeColor,
      roomWidth,
      roomHeight,
      roomDepth,
      wallColor,
      floorColor,
      isPublished 
    } = req.body;
    
    const exhibition = await Exhibition.findById(req.params.id);
    
    if (!exhibition) {
      req.flash('error_msg', 'Exhibition not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user is exhibition curator
    if (exhibition.curator.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/exhibitions');
    }
    
    // Update basic fields
    exhibition.title = title || exhibition.title;
    exhibition.description = description || exhibition.description;
    if (startDate) exhibition.startDate = startDate;
    if (endDate) exhibition.endDate = endDate;
    
    // Parse artwork IDs
    const artworks = artworkIds ? 
      (Array.isArray(artworkIds) ? artworkIds : [artworkIds]) : 
      [];
    exhibition.artworks = artworks;
    
    // Update theme color
    exhibition.themeColor = themeColor || exhibition.themeColor;
    
    // Update scene data
    if (exhibition.sceneData) {
      exhibition.sceneData.backgroundColor = themeColor || exhibition.sceneData.backgroundColor;
      exhibition.sceneData.roomWidth = roomWidth || exhibition.sceneData.roomWidth;
      exhibition.sceneData.roomHeight = roomHeight || exhibition.sceneData.roomHeight;
      exhibition.sceneData.roomDepth = roomDepth || exhibition.sceneData.roomDepth;
      exhibition.sceneData.wallColor = wallColor || exhibition.sceneData.wallColor;
      exhibition.sceneData.floorColor = floorColor || exhibition.sceneData.floorColor;
    } else {
      // Create scene data if it doesn't exist
      exhibition.sceneData = {
        backgroundColor: themeColor || '#f0f0f0',
        roomWidth: roomWidth || 20,
        roomHeight: roomHeight || 4,
        roomDepth: roomDepth || 20,
        wallColor: wallColor || '#ffffff',
        floorColor: floorColor || '#aaaaaa'
      };
    }
    
    // Update published status
    exhibition.isPublished = isPublished === 'true';
    
    // Update cover image if provided
    if (req.file) {
      // Delete previous image
      const previousImage = path.join(__dirname, '../public/uploads/', exhibition.coverImage);
      if (fs.existsSync(previousImage)) {
        fs.unlinkSync(previousImage);
      }
      exhibition.coverImage = req.file.filename;
    }
    
    await exhibition.save();
    
    req.flash('success_msg', 'Exhibition updated successfully');
    res.redirect(`/exhibitions/${exhibition._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating exhibition: ' + err.message);
    res.redirect(`/exhibitions/${req.params.id}/edit`);
  }
};

// @desc    Delete exhibition
// @route   DELETE /exhibitions/:id
// @access  Private (Exhibition curator only)
exports.deleteExhibition = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    
    if (!exhibition) {
      req.flash('error_msg', 'Exhibition not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user is exhibition curator
    if (exhibition.curator.toString() !== req.user.id && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/exhibitions');
    }
    
    // Delete cover image
    const imagePath = path.join(__dirname, '../public/uploads/', exhibition.coverImage);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    await exhibition.remove();
    
    req.flash('success_msg', 'Exhibition deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting exhibition');
    res.redirect('/dashboard');
  }
};

// @desc    View exhibition in 3D
// @route   GET /exhibitions/:id/view3d
// @access  Public
exports.view3DExhibition = async (req, res) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id)
      .populate('curator', 'name')
      .populate({
        path: 'artworks',
        populate: {
          path: 'artist',
          select: 'name'
        }
      });
    
    if (!exhibition) {
      req.flash('error_msg', 'Exhibition not found');
      return res.redirect('/exhibitions');
    }

    // Check if exhibition is published or user is the curator
    if (!exhibition.isPublished && 
        (!req.user || (exhibition.curator._id.toString() !== req.user.id && req.user.role !== 'admin'))) {
      req.flash('error_msg', 'Exhibition not available');
      return res.redirect('/exhibitions');
    }
    
    res.render('exhibitions/view3d', {
      title: `3D View: ${exhibition.title}`,
      exhibition,
      threejs: true,
      fullscreen: true
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load 3D view');
    res.redirect('/exhibitions');
  }
};