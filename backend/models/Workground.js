const mongoose = require('mongoose');

const WorkgroundSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'python', 'html', 'java', 'cpp', 'typescript', 'go', 'rust'],
    index: true
  },
  files: [{
    name: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    },
    content: {
      type: String,
      default: ''
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  forks: {
    type: Number,
    default: 0
  },
  forkedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workground'
  }
}, {
  timestamps: true
});

// Indexes
WorkgroundSchema.index({ user: 1, updatedAt: -1 });
WorkgroundSchema.index({ language: 1, isPublic: 1 });
WorkgroundSchema.index({ tags: 1 });

// Virtual for like count
WorkgroundSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Method to toggle like
WorkgroundSchema.methods.toggleLike = async function(userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
  } else {
    this.likes.push(userId);
  }
  return this.save();
};

// Method to fork workground
WorkgroundSchema.methods.fork = async function(userId) {
  const forked = new this.constructor({
    user: userId,
    name: `${this.name} (Fork)`,
    description: this.description,
    language: this.language,
    files: this.files,
    tags: this.tags,
    forkedFrom: this._id
  });
  
  this.forks += 1;
  await this.save();
  
  return forked.save();
};

// Ensure virtuals are included in JSON
WorkgroundSchema.set('toJSON', { virtuals: true });
WorkgroundSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Workground', WorkgroundSchema);
