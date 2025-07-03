const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const config = require('../config/config');
const { morganStream } = require('../utils/logger');



/**
 * Configure and apply security middlewares to the Express app
 */
 const setupSecurityMiddleware = (app) => {
  // Enable Cross-Origin Resource Sharing - must be before other middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
  }));

  // Handle OPTIONS preflight requests explicitly - use a path pattern, not a URL
  app.options('*', cors());

  console.log('CORS configured to allow all origins');

  // Set security HTTP headers - after CORS
  // app.use(helmet({
  //   crossOriginResourcePolicy: false
  // }));

  // Implement rate limiting
  // app.use(
  //   rateLimit({
  //     windowMs: config.rateLimit.windowMs,
  //     max: config.rateLimit.max,
  //     standardHeaders: true,
  //     legacyHeaders: false,
  //     message: 'Too many requests from this IP, please try again later',
  //     handler: (res) => {
  //       return res.status(429).json({
  //         status: 'error',
  //         message: 'Too many requests from this IP, please try again later'
  //       });
  //     }
  //   })
  // );

  // HTTP request logger middleware
  // app.use(morgan('combined', { stream: morganStream }));

  // Compress responses
  // app.use(compression());

  // Body parser
  app.use(express.json({ limit: '10kb' }));
  // app.use(express.urlencoded({ extended: true, limit: '10kb' }));
};


module.exports = { setupSecurityMiddleware };