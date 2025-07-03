const { validationResult } = require('express-validator');
const Notebook = require('../models/notebookModel');
const RawInput = require('../models/rawInputModel');
const Note = require('../models/noteModel');
const QA = require('../models/qaModel');
const AppError = require('../utils/appError');

/**
 * Get all notebooks for the current user
 */
const getAllNotebooks = async (req, res, next) => {
  try {
    // Get all notebooks owned by current user
    const notebooks = await Notebook.find({ owner: req.user.id })
      .sort('-createdAt');

    // Send response
    res.status(200).json({
      status: 'success',
      results: notebooks.length,
      data: {
        notebooks
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single notebook by ID
 */
const getNotebook = async (req, res, next) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      owner: req.user.id
    }).populate('notes');

    if (!notebook) {
      return next(new AppError('No notebook found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        notebook
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get the raw content of a notebook
 */
const getNotebookRawContent = async (req, res, next) => {
  try {
    // First find the notebook to verify ownership
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!notebook) {
      return next(new AppError('No notebook found with that ID', 404));
    }

    // Check if there's a latest raw input
    if (!notebook.latestRawInput) {
      return res.status(200).json({
        status: 'success',
        data: {
          rawContent: null,
          message: 'No raw content found for this notebook'
        }
      });
    }

    // Get the latest raw input
    const rawInput = await RawInput.findById(notebook.latestRawInput);

    if (!rawInput) {
      return next(new AppError('Raw content referenced but not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        rawContent: rawInput.content,
        inputType: rawInput.inputType,
        createdAt: rawInput.createdAt,
        rawInputId: rawInput._id
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new notebook
 */
const createNotebook = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    // Add owner to notebook
    req.body.owner = req.user.id;

    const newNotebook = await Notebook.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        notebook: newNotebook
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a notebook by ID
 */
const updateNotebook = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    const notebook = await Notebook.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.id
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!notebook) {
      return next(new AppError('No notebook found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        notebook
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a notebook by ID
 */
const deleteNotebook = async (req, res, next) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!notebook) {
      return next(new AppError('No notebook found with that ID', 404));
    }

    // Get all notes in this notebook
    const notes = await Note.find({
      notebook: req.params.id,
      owner: req.user.id
    });

    // Delete all QAs associated with these notes
    const noteIds = notes.map(note => note._id);
    await QA.deleteMany({
      note: { $in: noteIds },
      owner: req.user.id
    });

    // Delete all notes associated with this notebook
    await Note.deleteMany({
      notebook: req.params.id,
      owner: req.user.id
    });

    // Delete all raw inputs associated with this notebook
    await RawInput.deleteMany({
      notebook: req.params.id,
      owner: req.user.id
    });

    // Delete the notebook itself
    await Notebook.findByIdAndDelete(notebook._id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllNotebooks,
  getNotebook,
  getNotebookRawContent,
  createNotebook,
  updateNotebook,
  deleteNotebook
}; 