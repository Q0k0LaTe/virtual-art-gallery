// models/Artwork.js
const mongoose = require('mongoose');

const ArtworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  image: {
    type: String
  },
  imageUrl: {
    type: String
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Painting', 
      'Sculpture', 
      'Photography', 
      'Digital', 
      'Mixed Media',
      'Installation',
      'Other'
    ]
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  forSale: {
    type: Boolean,
    default: true
  },
  dimensions: {
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    depth: {
      type: Number
    },
    unit: {
      type: String,
      enum: ['cm', 'in', 'px'],
      default: 'cm'
    }
  },
  artist: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add custom validation to ensure at least one image source is provided
ArtworkSchema.pre('validate', function(next) {
  if (!this.image && !this.imageUrl) {
    this.invalidate('image', 'Please provide either an image file or URL');
  }
  next();
});

module.exports = mongoose.model('Artwork', ArtworkSchema);