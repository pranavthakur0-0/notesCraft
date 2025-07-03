const { validationResult } = require('express-validator');
const Note = require('../models/noteModel');
const RawInput = require('../models/rawInputModel');
const AppError = require('../utils/appError');
const Notebook = require('../models/notebookModel');
const QA = require('../models/qaModel');
const axios = require('axios');
const config = require('../config/config');
const llmService = require('../services/llmService');

/**
 * Get all notes for the current user
 */
const getAllNotes = async (req, res, next) => {
  try {
    // Early return if no notebook is specified
    if (!req.query.notebook) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: { notes: [] }
      });
    }

    // Create query object
    const query = {
      owner: req.user.id,
      notebook: req.query.notebook
    };

    // Find notes with explicit field exclusion - prevents database from returning these fields
    const notes = await Note.find(query)
      .select({ rawInput: 0, rawContent: 0 }) // Using projection object for clarity
      .lean(); // Returns plain JavaScript objects instead of Mongoose documents


      
    res.status(200).json({
      status: 'success',
      results: notes.length,
      data: { notes }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single note by ID
 */
const getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!note) {
      return next(new AppError('No note found with that ID', 404));
    }

    // Get Q&A history for this note
    const qaHistory = await QA.find({
      note: note._id,
      owner: req.user.id
    });

    res.status(200).json({
      status: 'success',
      data: {
        note,
        qaHistory
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new note
 */
const createNote = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    // Add owner to note
    req.body.owner = req.user.id;
    
    // Check if notebook exists and belongs to user
    if (req.body.notebook) {
      const notebook = await Notebook.findOne({
        _id: req.body.notebook,
        owner: req.user.id
      });
      
      if (!notebook) {
        return next(new AppError('Notebook not found or not owned by user', 404));
      }
    }

    // First create a raw input if raw text is provided
    if (req.body.rawInput && typeof req.body.rawInput === 'string') {
      const rawInputData = {
        content: req.body.rawInput,
        inputType: req.body.inputType || 'text',
        owner: req.user.id,
        notebook: req.body.notebook
      };

      const newRawInput = await RawInput.create(rawInputData);
      
      // Set the rawInput field to the ID of the newly created raw input
      req.body.rawInput = newRawInput._id;
      
      // Update the notebook's latestRawInput
      if (req.body.notebook) {
        await Notebook.findByIdAndUpdate(req.body.notebook, {
          latestRawInput: newRawInput._id
        });
      }
    }

    // Create the note
    const newNote = await Note.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        note: newNote
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a note by ID
 */
const updateNote = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    // If trying to update raw input as a string, create a new raw input
    if (req.body.rawInput && typeof req.body.rawInput === 'string') {
      // First get the original note to get the notebook
      const originalNote = await Note.findOne({
        _id: req.params.id,
        owner: req.user.id
      });

      if (!originalNote) {
        return next(new AppError('No note found with that ID', 404));
      }

      const rawInputData = {
        content: req.body.rawInput,
        inputType: req.body.inputType || 'text',
        owner: req.user.id,
        notebook: originalNote.notebook
      };

      const newRawInput = await RawInput.create(rawInputData);
      
      // Set the rawInput field to the ID of the newly created raw input
      req.body.rawInput = newRawInput._id;
      
      // Update the notebook's latestRawInput
      await Notebook.findByIdAndUpdate(originalNote.notebook, {
        latestRawInput: newRawInput._id
      });
    }

    const note = await Note.findOneAndUpdate(
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

    if (!note) {
      return next(new AppError('No note found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        note
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a note by ID
 */
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!note) {
      return next(new AppError('No note found with that ID', 404));
    }

    // Delete all QAs associated with this note
    await QA.deleteMany({
      note: req.params.id,
      owner: req.user.id
    });

    // Delete the note
    await Note.findByIdAndDelete(note._id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Ask a question about a note using LLM
 */
const askQuestion = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    // Verify required fields
    if (!req.body.question) {
      return next(new AppError('Question is required', 400));
    }

    // Find the note and verify ownership
    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!note) {
      return next(new AppError('No note found with that ID', 404));
    }

    // Get the raw context if available
    let rawContext = '';
    if (note.rawInput) {
      const rawInput = await RawInput.findById(note.rawInput);
      if (rawInput) {
        rawContext = rawInput.content;
      }
    }

    // Get answer from LLM service
    const answer = await llmService.answerQuestion(
      req.body.rawContext || rawContext,
      req.body.generatedNote || note.content,
      req.body.question
    );

    // Save Q&A to database
    const qa = await QA.create({
      note: note._id,
      owner: req.user.id,
      question: req.body.question,
      answer: answer,
      rawContext: req.body.rawContext || rawContext,
      generatedContent: req.body.generatedNote || note.content
    });

    res.status(200).json({
      status: 'success',
      data: {
        answer,
        qaId: qa._id
      }
    });
  } catch (err) {
    console.error('LLM API Error:', err.message);
    next(new AppError('Failed to get answer from LLM: ' + err.message, 500));
  }
};

/**
 * Get Q&A history for a note
 */
const getNoteQAHistory = async (req, res, next) => {
  try {
    const qaHistory = await QA.find({
      note: req.params.id,
      owner: req.user.id
    }).sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: qaHistory.length,
      data: {
        qaHistory
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a Q&A entry
 */
const deleteQA = async (req, res, next) => {
  try {
    // First verify the note exists and belongs to the user
    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!note) {
      return next(new AppError('No note found with that ID', 404));
    }

    // Then find and delete the QA entry
    const qa = await QA.findOneAndDelete({
      _id: req.params.qaId,
      note: req.params.id,
      owner: req.user.id
    });

    if (!qa) {
      return next(new AppError('No Q&A found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  askQuestion,
  getNoteQAHistory,
  deleteQA
};
