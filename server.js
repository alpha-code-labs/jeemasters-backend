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

// Import routes
const trackVisitRoutes = require('./routes/trackVisit');
const tryForFreeRoutes = require('./routes/tryForFree');
const submitAnswerRoutes = require('./routes/submitAnswer');
const getProgressRoutes = require('./routes/getProgress');
const saveEmailRoutes = require('./routes/saveEmail');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://jeemasters.alphacodelabs.com'
];

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
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

// API Routes
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
      health: '/health',
      trackVisit: '/api/track-visit'
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
  console.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`);
});
