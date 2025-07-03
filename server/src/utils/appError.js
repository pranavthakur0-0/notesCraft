/**
 * Custom application error class that extends Error
 * It includes a status code and a flag to indicate if it's an operational error
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace (excluding the constructor call from the stack trace)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

