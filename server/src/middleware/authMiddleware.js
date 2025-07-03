const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

/**
 * Middleware to protect routes by verifying JWT token
 */
const protect = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password. Please log in again.', 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    next(new AppError('Invalid token. Please log in again.', 401));
  }
};

/**
 * Middleware to restrict access to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this resource', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
