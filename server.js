const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Initialize Firebase
const { initializeFirebase } = require('./config/firebase');
initializeFirebase();

// Import routes ONE BY ONE to find the problematic one
const trackVisitRoutes = require('./routes/trackVisit');
const tryForFreeRoutes = require('./routes/tryForFree');
const submitAnswerRoutes = require('./routes/submitAnswer');
const getProgressRoutes = require('./routes/getProgress');
const saveEmailRoutes = require('./routes/saveEmail');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/data', express.static(path.join(__dirname, 'data')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'JEE Masters API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes - ADD ONE BY ONE
app.use('/api', trackVisitRoutes);
app.use('/api', tryForFreeRoutes);
app.use('/api', submitAnswerRoutes);
app.use('/api', getProgressRoutes);
app.use('/api', saveEmailRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to JEE Masters API',
    version: '1.0.0',
    endpoints: {
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JEE Masters API running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});