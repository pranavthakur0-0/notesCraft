const express = require('express');
const { body, validationResult } = require('express-validator');
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const llmRateLimiter = require('../middlewares/llmRateLimiter');
const AppError = require('../utils/appError');

const router = express.Router();

// Protect all routes
router.use(protect);

/**
 * @route   GET /api/v1/notes
 * @desc    Get all notes
 * @access  Private
 */
router.get('/', noteController.getAllNotes);

/**
 * @route   POST /api/v1/notes
 * @desc    Create a new note
 * @access  Private
 */
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('notebook').notEmpty().withMessage('Notebook is required')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(`Validation failed: ${errors.array()[0].msg}`, 400));
    }
    next();
  },
  noteController.createNote
);

/**
 * @route   GET /api/v1/notes/:id
 * @desc    Get a single note
 * @access  Private
 */
router.get('/:id', noteController.getNote);

/**
 * @route   PATCH /api/v1/notes/:id
 * @desc    Update a note
 * @access  Private
 */
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
    body('notebook').optional().notEmpty().withMessage('Notebook cannot be empty')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(`Validation failed: ${errors.array()[0].msg}`, 400));
    }
    next();
  },
  noteController.updateNote
);

/**
 * @route   DELETE /api/v1/notes/:id
 * @desc    Delete a note
 * @access  Private
 */
router.delete('/:id', noteController.deleteNote);

/**
 * @route   POST /api/v1/notes/:id/ask
 * @desc    Ask a question about a note
 * @access  Private
 */
router.post(
  '/:id/ask',
  [
    body('question').trim().notEmpty().withMessage('Question is required'),
    body('rawContext').optional().isString().withMessage('Raw context must be a string'),
    body('generatedNote').optional().isString().withMessage('Generated note must be a string')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(`Validation failed: ${errors.array()[0].msg}`, 400));
    }
    next();
  },
  llmRateLimiter,
  noteController.askQuestion
);

// Q&A routes
router.get('/:id/qa', noteController.getNoteQAHistory);
router.delete('/:id/qa/:qaId', noteController.deleteQA);

module.exports = router;
