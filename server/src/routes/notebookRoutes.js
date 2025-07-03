const express = require('express');
const { body } = require('express-validator');
const notebookController = require('../controllers/notebookController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

/**
 * @route   GET /api/v1/notebooks
 * @desc    Get all notebooks
 * @access  Private
 */
router.get('/', notebookController.getAllNotebooks);

/**
 * @route   POST /api/v1/notebooks
 * @desc    Create a new notebook
 * @access  Private
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 50 })
      .withMessage('Name cannot be more than 50 characters'),

    body('icon')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Icon cannot be empty'),
  ],
  notebookController.createNotebook
);

/**
 * @route   GET /api/v1/notebooks/:id
 * @desc    Get a single notebook
 * @access  Private
 */
router.get('/:id', notebookController.getNotebook);

/**
 * @route   GET /api/v1/notebooks/:id/raw-content
 * @desc    Get the raw content of a notebook
 * @access  Private
 */
router.get('/:id/raw-content', notebookController.getNotebookRawContent);

/**
 * @route   PATCH /api/v1/notebooks/:id
 * @desc    Update a notebook
 * @access  Private
 */
router.patch(
  '/:id',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ max: 50 })
      .withMessage('Name cannot be more than 50 characters'),

    body('icon')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Icon cannot be empty'),
  ],
  notebookController.updateNotebook
);

/**
 * @route   DELETE /api/v1/notebooks/:id
 * @desc    Delete a notebook
 * @access  Private
 */
router.delete('/:id', notebookController.deleteNotebook);

module.exports = router; 