const { validationResult } = require('express-validator');
const RawInput = require('../models/rawInputModel');
const Notes = require('../models/noteModel');
const Notebook = require('../models/notebookModel');
const AppError = require('../utils/appError');
const axios = require('axios');
const config = require('../config/config');
const llmService = require('../services/llmService');

/**
 * Get all raw inputs for the current user
 */
const getAllRawInputs = async (req, res, next) => {
  try {
    // Build query
    const queryObj = { owner: req.user.id };
    
    // Add notebook filter if provided
    if (req.query.notebook) {
      queryObj.notebook = req.query.notebook;
    }

    // Execute query
    const rawInputs = await RawInput.find(queryObj).sort('-createdAt');

    // Send response
    res.status(200).json({
      status: 'success',
      results: rawInputs.length,
      data: {
        rawInputs
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single raw input by ID
 */
const getRawInput = async (req, res, next) => {
  try {
    const rawInput = await RawInput.findOne({
      notebook : req.params.id,
      owner: req.user.id
    });

    if (!rawInput) {
      return next(new AppError('No raw input found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        rawInput
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new raw input
 */
const createRawInput = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    // Add owner to raw input
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

    const newRawInput = await RawInput.create(req.body);

    // Update the notebook's latestRawInput
    if (req.body.notebook) {
      await Notebook.findByIdAndUpdate(req.body.notebook, {
        latestRawInput: newRawInput._id
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        rawInput: newRawInput
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a raw input by ID
 */
const deleteRawInput = async (req, res, next) => {
  try {
    const rawInput = await RawInput.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!rawInput) {
      return next(new AppError('No raw input found with that ID', 404));
    }

    // Check if this was the latest raw input for the notebook
    const notebook = await Notebook.findById(rawInput.notebook);
    if (notebook && notebook.latestRawInput && notebook.latestRawInput.toString() === req.params.id) {
      // Find the next latest raw input
      const nextLatest = await RawInput.findOne({ 
        notebook: rawInput.notebook,
        owner: req.user.id
      }).sort('-createdAt');
      
      // Update the notebook
      await Notebook.findByIdAndUpdate(rawInput.notebook, {
        latestRawInput: nextLatest ? nextLatest._id : null
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a note using LLM (OpenRouter API)
 */
const createNoteFromLLM = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    // Verify required fields
    if (!req.body.content || !req.body.notebook) {
      return next(new AppError('Content and notebook ID are required', 400));
    }

    // Check if notebook exists and belongs to user
    const notebook = await Notebook.findOne({
      _id: req.body.notebook,
      owner: req.user.id
    });
    
    if (!notebook) {
      return next(new AppError('Notebook not found or not owned by user', 404));
    }

    // Call OpenRouter API
    const llmResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: req.body.model || 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: req.body.content
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouter.apiKey}`,
          'HTTP-Referer': config.openRouter.siteUrl,
          'X-Title': config.openRouter.siteName
        }
      }
    );

    // Extract the LLM response content
    const generatedContent = llmResponse.data.choices[0].message.content;

    // Create new raw input with the LLM-generated content
    const rawInputData = {
      content: generatedContent,
      owner: req.user.id,
      notebook: req.body.notebook,
      inputType: 'text'
    };

    const newRawInput = await RawInput.create(rawInputData);

    // Update the notebook's latestRawInput
    await Notebook.findByIdAndUpdate(req.body.notebook, {
      latestRawInput: newRawInput._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        rawInput: newRawInput
      }
    });
  } catch (err) {
    console.error('LLM API Error:', err.response?.data || err.message);
    next(new AppError('Failed to generate note from LLM: ' + (err.response?.data?.error?.message || err.message), 500));
  }
};

/**
 * Create multiple notes using LLM
 */
const createMultipleNotesFromLLM = async (req, res, next) => {
  try {
    // Verify required fields
    if (!req.body.content || !req.body.notebook) {
      return next(new AppError('Content and notebook ID are required', 400));
    }

    // Check if notebook exists and belongs to user
    const notebook = await Notebook.findOne({
      _id: req.body.notebook,
      owner: req.user.id
    });
    
    if (!notebook) {
      return next(new AppError('Notebook not found or not owned by user', 404));
    }

    // First, create a raw input entry for the original content
    const rawInputData = {
      content: req.body.content,
      owner: req.user.id,
      notebook: req.body.notebook,
      inputType: 'text'
    };

    const newRawInput = await RawInput.create(rawInputData);
    
    // Generate notes using LLM service
    const notesArray = await llmService.generateNotes(req.body.content);

    // Create multiple notes from the generated content
    const createdNotes = [];
    for (const note of notesArray) {
      // Create note with reference to the raw input
      const noteData = {
        content: note.content,
        owner: req.user.id,
        notebook: req.body.notebook,
        inputType: 'text',
        title: note.title,
        supporting: note.supporting || '',
        rawInput: newRawInput._id // Link to the raw input
      };

      const newNote = await Notes.create(noteData);
      createdNotes.push(newNote);
    }

    // Update the notebook's latestRawInput with the created raw input
    await Notebook.findByIdAndUpdate(req.body.notebook, {
      latestRawInput: newRawInput._id
    });

    res.status(201).json({
      status: 'success',
      results: createdNotes.length,
      data: {
        rawInput: newRawInput,
        notes: createdNotes
      }
    });
  } catch (err) {
    console.error('LLM API Error:', err.message);
    next(new AppError('Failed to generate notes from LLM: ' + err.message, 500));
  }
};

/**
 * Create notes from a topic using LLM
 */
const createNotesFromTopic = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    // Verify required fields
    if (!req.body.topic || !req.body.notebook) {
      return next(new AppError('Topic and notebook ID are required', 400));
    }

    // Check if notebook exists and belongs to user
    const notebook = await Notebook.findOne({
      _id: req.body.notebook,
      owner: req.user.id
    });
    
    if (!notebook) {
      return next(new AppError('Notebook not found or not owned by user', 404));
    }

    // Format the topic for detailed note generation
    const researchPrompt = `Generate detailed, comprehensive information about the topic: ${req.body.topic}. 
    Include history, key concepts, applications, and current developments. 
    This information will be used as source material for educational notes.`;

    // Generate research content first
    const researchResponse = await llmService.callGeminiAPI(researchPrompt);

    // First, create a raw input entry for the generated research content
    const rawInputData = {
      content: researchResponse,
      owner: req.user.id,
      notebook: req.body.notebook,
      inputType: 'text'
    };

    const newRawInput = await RawInput.create(rawInputData);
    
    // Generate structured notes from the research content
    const notesArray = await llmService.generateNotes(researchResponse);

    // Create multiple notes from the generated content
    const createdNotes = [];
    for (const note of notesArray) {
      // Create note with reference to the raw input
      const noteData = {
        content: note.content,
        owner: req.user.id,
        notebook: req.body.notebook,
        inputType: 'text',
        title: note.title,
        supporting: note.supporting || '',
        rawInput: newRawInput._id // Link to the raw input
      };

      const newNote = await Notes.create(noteData);
      createdNotes.push(newNote);
    }

    // Update the notebook's latestRawInput with the created raw input
    await Notebook.findByIdAndUpdate(req.body.notebook, {
      latestRawInput: newRawInput._id
    });

    res.status(201).json({
      status: 'success',
      results: createdNotes.length,
      data: {
        topic: req.body.topic,
        rawInput: newRawInput,
        notes: createdNotes
      }
    });
  } catch (err) {
    console.error('LLM API Error:', err.message);
    next(new AppError('Failed to generate notes from topic: ' + err.message, 500));
  }
};

module.exports = {
  getAllRawInputs,
  getRawInput,
  createRawInput,
  deleteRawInput,
  createNoteFromLLM,
  createMultipleNotesFromLLM,
  createNotesFromTopic
}; 