const express = require('express');
const path = require('path');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const notebookRoutes = require('./routes/notebookRoutes');
const noteRoutes = require('./routes/noteRoutes');
const rawInputRoutes = require('./routes/rawInputRoutes');

const database = require('./config/database');


database();

// Create a minimal Express app
const app = express();

// Basic CORS setup
app.use(cors());

// Body parser
app.use(express.json());

// Basic health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/notebooks', notebookRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/raw-inputs', rawInputRoutes);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.name} - ${err.message}`);
  console.error(err.stack || '');
  process.exit(1);
});
