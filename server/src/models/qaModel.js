const mongoose = require('mongoose');

const qaSchema = new mongoose.Schema({
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: [true, 'A Q&A must belong to a note']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A Q&A must belong to a user']
  },
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true
  },
  rawContext: {
    type: String,
    trim: true
  },
  generatedContent: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
qaSchema.index({ note: 1, owner: 1 });
qaSchema.index({ createdAt: -1 });

const QA = mongoose.model('QA', qaSchema);

module.exports = QA; 