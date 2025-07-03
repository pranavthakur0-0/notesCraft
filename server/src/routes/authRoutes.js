const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');


const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 50 })
      .withMessage('Name cannot be more than 50 characters'),

    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),

    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
  ],
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),

    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
  ],
  authController.login
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, authController.getMe);

/**
 * @route   PATCH /api/v1/auth/update-password
 * @desc    Update user password
 * @access  Private
 */
router.patch(
  '/update-password',
  protect,
  [
    body('currentPassword')
      .trim()
      .notEmpty()
      .withMessage('Current password is required'),

    body('newPassword')
      .trim()
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
  ],
  authController.updatePassword
);

/**
 * @route   PATCH /api/v1/auth/update-view-preference
 * @desc    Update user's view preference
 * @access  Private
 */
router.patch(
  '/update-view-preference',
  protect,
  [
    body('viewPreference')
      .trim()
      .notEmpty()
      .withMessage('View preference is required')
      .isIn(['split', 'grid'])
      .withMessage('View preference must be either "split" or "grid"')
  ],
  authController.updateViewPreference
);

module.exports = router;
