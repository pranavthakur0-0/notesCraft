const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(value) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
        },
        message: 'Please provide a valid email address'
      }
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't include password in query results by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    viewPreference: {
      type: String,
      enum: ['split', 'grid'],
      default: 'split'
    },
    llmRequestCount: {
      type: Number,
      default: 0
    },
    llmRequestLastReset: {
      type: Date,
      default: Date.now
    },
    passwordChangedAt: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware to hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update passwordChangedAt property when password is changed
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
