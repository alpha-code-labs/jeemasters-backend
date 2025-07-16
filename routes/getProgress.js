// routes/getProgress.js
const express = require('express');
const { firestoreHelpers } = require('../config/firebase');

const router = express.Router();

// POST /api/get-progress
router.post('/get-progress', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'SessionId is required'
      });
    }
    
    // Find user by sessionId
    const users = await firestoreHelpers.queryDocuments('JEEusers', 'sessionId', '==', sessionId);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User session not found'
      });
    }
    
    const user = users[0];
    const progress = user.progress || {};
    
    console.log(`Retrieved progress for user ${sessionId}:`, progress);
    
    res.status(200).json({
      success: true,
      progress: progress,
      sessionId: sessionId,
      emailCaptured: !!(user.email) // Include email status
    });
    
  } catch (error) {
    console.error('Error retrieving user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user progress'
    });
  }
});

module.exports = router;