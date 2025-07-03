const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const rawInputController = require('../controllers/rawInputController');
const llmRateLimiter = require('../middlewares/llmRateLimiter');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// GET all raw inputs for the current user
router.get('/', rawInputController.getAllRawInputs);

// GET a single raw input by ID
router.get('/:id', rawInputController.getRawInput);

// CREATE a new raw input
router.post(
  '/',
  [
    body('content')
      .not()
      .isEmpty()
      .withMessage('Raw input content is required'),
    body('notebook')
      .not()
      .isEmpty()
      .withMessage('Notebook ID is required'),
    body('inputType')
      .optional()
      .isIn(['text', 'pdf'])
      .withMessage('Input type must be either text or pdf')
  ],
  rawInputController.createRawInput
);

// CREATE multiple notes using LLM
router.post(
  '/multi',
  llmRateLimiter,
  rawInputController.createMultipleNotesFromLLM
);

// CREATE notes from a topic
router.post(
  '/generate-from-topic',
  llmRateLimiter,
  [
    body('topic')
      .not()
      .isEmpty()
      .withMessage('Topic is required'),
    body('notebook')
      .not()
      .isEmpty()
      .withMessage('Notebook ID is required')
  ],
  rawInputController.createNotesFromTopic
);

// DELETE a raw input
router.delete('/:id', rawInputController.deleteRawInput);

module.exports = router; 