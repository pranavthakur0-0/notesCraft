const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const { logger } = require('../utils/logger');
const config = require('../config/config');

/**
 * Handle different types of MongoDB errors
 */
const handleMongoDBErrors = (err) => {
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(val => val.message);
    return new AppError(`Invalid input data: ${errors.join('. ')}`, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return new AppError(`Duplicate field value: ${field}. Please use another value.`, 400);
  }

  return new AppError('Database error', 500);
};

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (errors)=> {
  const errorMessages = errors.map(err => `${err}: ${err.msg}`).join(', ');
  return new AppError(`Validation failed: ${errorMessages}`, 400);
};

/**
 * Send error response based on environment
 */
const sendErrorResponse = (err, req, res)=> {
  // Operational, trusted errors: send detailed message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(config.server.environment === 'development' ? { stack: err.stack } : {})
    });
    return;
  }

  // Programming or unknown errors: don't leak error details to client
  logger.error('ERROR 💥', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
};

/**
 * Global error handling middleware
 */
 const errorHandler = (err, req, res, next) => {
  let error = err instanceof AppError ? err : new AppError(err.message || 'Server Error', 500);

  // Log error
  logger.error(`${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Handle specific error types
  if (err instanceof mongoose.Error.CastError ||
      err instanceof mongoose.Error.ValidationError ||
      (err).code === 11000) {
    error = handleMongoDBErrors(err);
  }

  if (Array.isArray(err) && err.every(e => e.type === 'field')) {
    error = handleValidationErrors(err);
  }

  // Send error response
  sendErrorResponse(error, req, res);
};

/**
 * Handle 404 errors for undefined routes
 */
 const notFoundHandler = (req, res, next ) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
};


module.exports = {
  errorHandler,
  notFoundHandler
};