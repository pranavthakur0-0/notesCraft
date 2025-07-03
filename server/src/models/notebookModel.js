const mongoose = require('mongoose');

const notebookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A notebook must have a name'],
      trim: true,
      maxlength: [50, 'A notebook name cannot be more than 50 characters']
    },
    icon: {
      type: String,
      default: 'FiBook'
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A notebook must belong to a user']
    },
    latestRawInput: {
      type: mongoose.Schema.ObjectId,
      ref: 'RawInput',
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware to update the updatedAt field before saving
notebookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual populate to get notes in this notebook
notebookSchema.virtual('notes', {
  ref: 'Note',
  foreignField: 'notebook',
  localField: '_id'
});

// Virtual populate to get raw inputs in this notebook
notebookSchema.virtual('rawInputs', {
  ref: 'RawInput',
  foreignField: 'notebook',
  localField: '_id'
});

const Notebook = mongoose.model('Notebook', notebookSchema);

module.exports = Notebook; 