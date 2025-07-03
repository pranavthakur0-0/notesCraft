const mongoose = require('mongoose');

/**
 * Note Schema definition
 */
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A note must have a title'],
      trim: true,
      maxlength: [100, 'A note title cannot be more than 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'A note must have content'],
    },
    supporting: {
      type: String,
      default: '',
    },
    rawInput: {
      type: mongoose.Schema.ObjectId,
      ref: 'RawInput',
      required: [true, 'A note must be linked to a raw input'],
    },
    tags: [String],
    isArchived: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A note must belong to a user'],
    },
    notebook: {
      type: mongoose.Schema.ObjectId,
      ref: 'Notebook',
      required: [true, 'A note must belong to a notebook'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Update the updatedAt field before saving
noteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster querying
noteSchema.index({ owner: 1, notebook: 1 });

// Pre-find middleware to populate owner and rawInput
noteSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'owner',
    select: 'name email'
  }).populate({
    path: 'rawInput',
    select: 'content inputType'
  });

  next();
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
