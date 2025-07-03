const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const config = require('../config/config');

// Generate JWT token
const signToken = (id) => {
  if (!config.jwt.secret) {
    throw new Error('JWT secret is not defined');
  }
  return jwt.sign({ id }, config.jwt.secret.toString(), {
    expiresIn: config.jwt.expiresIn
  });
};

// Create and send token as response
const createSendToken = (user, statusCode, res) => {
  const token = signToken((user._id).toString());

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

/**
 * Protect routes - Authentication middleware
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // 1) Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }
    
    // 2) Verify token
    const decoded = jwt.verify(token, config.jwt.secret.toString());
    
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
    next(new AppError('Authentication failed', 401));
  }
};

/**
 * Register a new user
 */
 const register = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    const { name, email, password } = req.body;

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password
    });

    console.log(newUser);
    // Generate token and send response
    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Login a user
 */
 const login = async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If everything is ok, send token to client
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user profile
 */
 const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user password
 */
 const updatePassword = async (req, res, next)=> {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

    const { currentPassword, newPassword } = req.body;

    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // 2) Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Your current password is incorrect', 401));
    }

    // 3) Update password
    user.password = newPassword;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Update user's view preference
 */
const updateViewPreference = async (req, res, next) => {
  try {
    const { viewPreference } = req.body;

    // Validate view preference
    if (!viewPreference || !['split', 'grid'].includes(viewPreference)) {
      return next(new AppError('Invalid view preference. Must be either "split" or "grid"', 400));
    }

    // Update user's view preference
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { viewPreference },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
  protect,
  updateViewPreference
}