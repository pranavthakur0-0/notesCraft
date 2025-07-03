const User = require('../models/userModel');
const AppError = require('../utils/appError');

/**
 * Middleware to limit LLM requests to 10 per day per user
 * Resets at midnight (00:00:00)
 */
const llmRateLimiter = async (req, res, next) => {
  try {
    // Get current user from request
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Current date at midnight (for resetting counter)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If last reset was before today, reset the counter
    if (!user.llmRequestLastReset || user.llmRequestLastReset < today) {
      user.llmRequestCount = 0;
      user.llmRequestLastReset = today;
      await user.save({ validateBeforeSave: false });
    }
    
    // Check if user has reached the daily limit
    if (user.llmRequestCount >= 10) {
      return res.status(429).json({
        status: 'error',
        message: 'Daily LLM request limit reached (10 per day). Limit resets at midnight.',
        limitReached: true,
        nextReset: user.llmRequestLastReset.setDate(user.llmRequestLastReset.getDate() + 1)
      });
    }
    
    // Increment request count and update last request time
    user.llmRequestCount++;
    await user.save({ validateBeforeSave: false });
    
    // Continue to the next middleware
    next();
  } catch (err) {
    next(new AppError('Error checking rate limit', 500));
  }
};

module.exports = llmRateLimiter; 