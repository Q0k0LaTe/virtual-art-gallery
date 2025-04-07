// routes/exhibitionRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getAllExhibitions,
  getExhibitionById,
  renderCreateForm,
  createExhibition,
  renderEditForm,
  updateExhibition,
  deleteExhibition,
  view3DExhibition
} = require('../controllers/exhibitionController');

// @route   GET /exhibitions
// @desc    Get all exhibitions
// @access  Public
router.get('/', getAllExhibitions);

// @route   GET /exhibitions/create
// @desc    Render create exhibition form
// @access  Private (Artists only)
router.get('/create', protect, authorize('artist', 'admin'), renderCreateForm);

// @route   POST /exhibitions
// @desc    Create new exhibition
// @access  Private (Artists only)
router.post(
  '/',
  protect,
  authorize('artist', 'admin'),
  upload.single('coverImage'),
  createExhibition
);

// @route   GET /exhibitions/:id
// @desc    Get single exhibition
// @access  Public
router.get('/:id', getExhibitionById);

// @route   GET /exhibitions/:id/edit
// @desc    Render edit exhibition form
// @access  Private (Exhibition curator only)
router.get('/:id/edit', protect, renderEditForm);

// @route   PUT /exhibitions/:id
// @desc    Update exhibition
// @access  Private (Exhibition curator only)
router.put('/:id', protect, upload.single('coverImage'), updateExhibition);

// @route   DELETE /exhibitions/:id
// @desc    Delete exhibition
// @access  Private (Exhibition curator only)
router.delete('/:id', protect, deleteExhibition);

// @route   GET /exhibitions/:id/view3d
// @desc    View exhibition in 3D
// @access  Public
router.get('/:id/view3d', view3DExhibition);

// Add a new route for viewing a single artwork in 3D
// @route   GET /exhibitions/:artworkId/3dview
// @desc    View a single artwork in 3D
// @access  Public
router.get('/:artworkId/3dview', async (req, res) => {
  try {
    // Check if it's a URL artwork or regular artwork
    let artwork;
    
    // Try to find artwork in URL model first
    const ArtworkURL = require('../models/ArtworkURL');
    artwork = await ArtworkURL.findById(req.params.artworkId)
      .populate('artist', 'name');
    
    // If not found, try regular artwork model
    if (!artwork) {
      const Artwork = require('../models/Artwork');
      artwork = await Artwork.findById(req.params.artworkId)
        .populate('artist', 'name');
    }
    
    if (!artwork) {
      req.flash('error_msg', 'Artwork not found');
      return res.redirect('/artworks');
    }
    
    // Create a mini-exhibition with just this artwork
    const exhibition = {
      title: `${artwork.title} - 3D View`,
      curator: artwork.artist,
      sceneData: {
        roomWidth: 20,
        roomHeight: 4,
        roomDepth: 20,
        wallColor: '#ffffff',
        floorColor: '#aaaaaa',
        backgroundColor: '#f0f0f0'
      },
      artworks: [artwork]
    };
    
    res.render('exhibitions/single-artwork-3d', {
      title: `${artwork.title} - 3D View`,
      artwork,
      exhibition,
      threejs: true
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Cannot load 3D view');
    res.redirect('/artworks');
  }
});

module.exports = router;