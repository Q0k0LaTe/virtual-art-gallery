// routes/artworkURLRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllArtworksURL,
  getArtworkURLById,
  renderCreateForm,
  createArtworkURL,
  renderEditForm,
  updateArtworkURL,
  deleteArtworkURL
} = require('../controllers/artworkURLController');

// @route   GET /artworksurl
// @desc    Get all URL artworks
// @access  Public
router.get('/', getAllArtworksURL);

// @route   GET /artworksurl/create
// @desc    Render create URL artwork form
// @access  Private (Artists only)
router.get('/create', protect, authorize('artist', 'admin'), renderCreateForm);

// @route   POST /artworksurl
// @desc    Create new URL artwork
// @access  Private (Artists only)
router.post(
  '/',
  protect,
  authorize('artist', 'admin'),
  createArtworkURL
);

// @route   GET /artworksurl/:id
// @desc    Get single URL artwork
// @access  Public
router.get('/:id', getArtworkURLById);

// @route   GET /artworksurl/:id/edit
// @desc    Render edit URL artwork form
// @access  Private (Artwork owner only)
router.get('/:id/edit', protect, renderEditForm);

// @route   PUT /artworksurl/:id
// @desc    Update URL artwork
// @access  Private (Artwork owner only)
router.put('/:id', protect, updateArtworkURL);

// @route   DELETE /artworksurl/:id
// @desc    Delete URL artwork
// @access  Private (Artwork owner only)
router.delete('/:id', protect, deleteArtworkURL);

module.exports = router;