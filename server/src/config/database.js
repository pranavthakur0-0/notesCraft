const mongoose = require('mongoose');
const config = require('./config');
const { logger } = require('../utils/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    logger.error(`Error during MongoDB disconnection: ${err}`);
    process.exit(1);
  }
});

module.exports = connectDB;
