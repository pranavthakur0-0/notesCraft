const winston = require('winston');
const path = require('path');
const config = require('../config/config');


// Define log directory
const logDir = path.join(__dirname, '../../../logs');

// Create custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...rest } = info;
    const restString = Object.keys(rest).length ? JSON.stringify(rest) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${restString}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: config.server.environment === 'development' ? 'debug' : 'info',
  format: customFormat,
  defaultMeta: { service: 'notecraft-api' },
  transports: [
    // Write to all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console logging in development environment
if (config.server.environment === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    ),
  }));
}

// Create a stream object for Morgan integration
 const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = { logger, morganStream};
