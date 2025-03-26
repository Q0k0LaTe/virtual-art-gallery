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

module.exports = router;