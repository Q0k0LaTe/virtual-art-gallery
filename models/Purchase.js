// models/Purchase.js
const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  artwork: {
    type: mongoose.Schema.ObjectId,
    ref: 'Artwork',
    required: true
  },
  buyer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add a purchase amount']
  },
  transactionId: {
    type: String,
    required: [true, 'Please add a transaction ID']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to prevent duplicate purchases
PurchaseSchema.index({ artwork: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model('Purchase', PurchaseSchema);