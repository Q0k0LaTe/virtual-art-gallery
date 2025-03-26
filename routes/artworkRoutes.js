// routes/artworkRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getAllArtworks,
  getArtworkById,
  renderCreateForm,
  createArtwork,
  renderEditForm,
  updateArtwork,
  deleteArtwork
} = require('../controllers/artworkController');

// @route   GET /artworks
// @desc    Get all artworks
// @access  Public
router.get('/', getAllArtworks);

// @route   GET /artworks/create
// @desc    Render create artwork form
// @access  Private (Artists only)
router.get('/create', protect, authorize('artist', 'admin'), renderCreateForm);

// @route   POST /artworks
// @desc    Create new artwork
// @access  Private (Artists only)
router.post(
  '/',
  protect,
  authorize('artist', 'admin'),
  upload.single('image'),
  createArtwork
);

// @route   GET /artworks/:id
// @desc    Get single artwork
// @access  Public
router.get('/:id', getArtworkById);

// @route   GET /artworks/:id/edit
// @desc    Render edit artwork form
// @access  Private (Artwork owner only)
router.get('/:id/edit', protect, renderEditForm);

// @route   PUT /artworks/:id
// @desc    Update artwork
// @access  Private (Artwork owner only)
router.put('/:id', protect, upload.single('image'), updateArtwork);

// @route   DELETE /artworks/:id
// @desc    Delete artwork
// @access  Private (Artwork owner only)
router.delete('/:id', protect, deleteArtwork);

module.exports = router;