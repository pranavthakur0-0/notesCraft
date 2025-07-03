const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Server configuration
const SERVER_PORT = 5000;
const NODE_ENV = 'development';
const API_PREFIX = '/api/v1';

// MongoDB configuration
const MONGODB_URI = 'mongodb://localhost:27017/notecraft';

// JWT configuration
const JWT_SECRET = 'your-default-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1d';

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.SITE_URL || 'https://notes-app.com';
const SITE_NAME = process.env.SITE_NAME || 'Notes App';

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCWiG548XtXS7B7iXE6QMARyIJSH-l9-GQ';

// Rate limiting
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100; // 100 requests per 15 minutes

const config = {
  server: {
    port: SERVER_PORT || 5000,
    environment: NODE_ENV || 'development',
    apiPrefix: API_PREFIX || '/api/v1',
  },
  database: {
    uri: MONGODB_URI || 'mongodb://localhost:27017/notecraft', // Default value
  },
  jwt: {
    secret: JWT_SECRET || 'default_secret',
    expiresIn: JWT_EXPIRES_IN || '1h', // Default expiration
  },
  openRouter: {
    apiKey: OPENROUTER_API_KEY,
    siteUrl: SITE_URL,
    siteName: SITE_NAME,
  },
  gemini: {
    apiKey: GEMINI_API_KEY
  },
  rateLimit: {
    windowMs: parseInt(String(RATE_LIMIT_WINDOW_MS) || '900000', 10),  // 15 minutes in ms
    max: parseInt(String(RATE_LIMIT_MAX || '100'), 10),  // Max 100 requests
  },
};

module.exports = config;