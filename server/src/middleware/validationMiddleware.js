const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

/**
 * Middleware to validate note data
 */
const validateNote = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400));
  }
  next();
};

module.exports = {
  validateNote
}; 