// models/Exhibition.js
const mongoose = require('mongoose');

const ExhibitionSchema = new mongoose.Schema({
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
  coverImage: {
    type: String,
    required: [true, 'Please upload a cover image']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
  },
  artworks: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Artwork'
    }
  ],
  themeColor: {
    type: String,
    default: '#FFFFFF'
  },
  sceneData: {
    type: Object,
    required: [true, 'Please configure the 3D scene'],
    default: {
      backgroundColor: '#f0f0f0',
      roomWidth: 20,
      roomHeight: 4,
      roomDepth: 20,
      floorColor: '#aaaaaa',
      wallColor: '#ffffff'
    }
  },
  curator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to ensure startDate is before endDate
ExhibitionSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    const err = new Error('End date must be after start date');
    next(err);
  } else {
    next();
  }
});

module.exports = mongoose.model('Exhibition', ExhibitionSchema);