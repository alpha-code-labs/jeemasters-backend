// routes/trackVisit.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { firestoreHelpers } = require('../config/firebase');

const router = express.Router();

// POST /api/track-visit
router.post('/track-visit', async (req, res) => {
  try {
    // Generate 8-character unique session ID
    const fullUuid = uuidv4();
    const sessionId = fullUuid.replace(/-/g, '').substring(0, 8);
    
    // Create user data
    const userData = {
      sessionId: sessionId,
      visitedAt: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown'
    };
    
    // Store in Firebase Firestore
    const docId = await firestoreHelpers.addDocument('JEEusers', userData);
    
    console.log(`New visit tracked: ${sessionId}`);
    
    // Send response back to frontend
    res.status(200).json({
      success: true,
      sessionId: sessionId,
      message: 'Visit tracked successfully'
    });
    
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track visit'
    });
  }
});

module.exports = router;