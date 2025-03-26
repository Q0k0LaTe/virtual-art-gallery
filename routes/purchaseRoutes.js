// routes/purchaseRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  purchaseArtwork,
  getPurchaseHistory,
  getSalesHistory,
  getPurchaseDetails
} = require('../controllers/purchaseController');

// @route   POST /purchases
// @desc    Process artwork purchase
// @access  Private
router.post('/', protect, purchaseArtwork);

// @route   GET /purchases/history
// @desc    Get purchase history
// @access  Private
router.get('/history', protect, getPurchaseHistory);

// @route   GET /purchases/sales
// @desc    Get sales history
// @access  Private (Artists only)
router.get('/sales', protect, authorize('artist', 'admin'), getSalesHistory);

// @route   GET /purchases/:id
// @desc    View purchase details
// @access  Private (Purchase buyer or seller only)
router.get('/:id', protect, getPurchaseDetails);

module.exports = router;