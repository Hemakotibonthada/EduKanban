const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  deckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashcardDeck',
    required: true,
    index: true
  },
  front: {
    type: String,
    required: true,
    trim: true
  },
  back: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  // SM-2 Algorithm fields
  easeFactor: {
    type: Number,
    default: 2.5,
    min: 1.3
  },
  interval: {
    type: Number,
    default: 0
  },
  repetitions: {
    type: Number,
    default: 0
  },
  nextReview: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Additional metadata
  lastReviewedAt: {
    type: Date
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  correctCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
flashcardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
flashcardSchema.index({ deckId: 1, nextReview: 1 });
flashcardSchema.index({ deckId: 1, createdAt: -1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
