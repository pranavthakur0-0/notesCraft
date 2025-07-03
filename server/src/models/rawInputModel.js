const mongoose = require('mongoose');

/**
 * RawInput Schema definition
 */
const rawInputSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Raw input must have content'],
    },
    inputType: {
      type: String,
      enum: ['text', 'pdf'],
      default: 'text'
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A raw input must belong to a user'],
    },
    notebook: {
      type: mongoose.Schema.ObjectId,
      ref: 'Notebook',
      required: [true, 'A raw input must be associated with a notebook'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster querying
rawInputSchema.index({ owner: 1, notebook: 1 });

// Pre-find middleware to populate owner
rawInputSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'owner',
    select: 'name email'
  });

  next();
});

const RawInput = mongoose.model('RawInput', rawInputSchema);

module.exports = RawInput; 