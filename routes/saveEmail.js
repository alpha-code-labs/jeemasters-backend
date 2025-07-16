// routes/saveEmail.js
const express = require('express');
const { firestoreHelpers } = require('../config/firebase');

const router = express.Router();

// POST /api/save-email
router.post('/save-email', async (req, res) => {
  try {
    const { sessionId, email, name } = req.body;
    
    // Send immediate response to frontend (asynchronous processing)
    res.status(200).json({
      success: true,
      message: 'Email received, processing...'
    });
    
    // Process email saving asynchronously
    setImmediate(async () => {
      try {
        if (!sessionId || !email) {
          console.error('Missing sessionId or email in save-email request');
          return;
        }
        
        // Find user by sessionId
        const users = await firestoreHelpers.queryDocuments('JEEusers', 'sessionId', '==', sessionId);
        
        if (users.length === 0) {
          console.error(`User session not found for sessionId: ${sessionId}`);
          return;
        }
        
        const user = users[0];
        
        // Update user document with email and name
        await firestoreHelpers.updateDocument('JEEusers', user.id, {
          email: email,
          name: name || '',
          emailCapturedAt: new Date().toISOString()
        });
        
        // Also store in separate emails collection for easy retrieval
        await firestoreHelpers.addDocument('emailIds', {
          sessionId: sessionId,
          email: email,
          name: name || ''
        });
        
        console.log(`Email saved for user ${sessionId}: ${email}`);
        
      } catch (error) {
        console.error('Error in asynchronous email saving:', error);
      }
    });
    
  } catch (error) {
    console.error('Error in save-email route:', error);
    // Still send success response to not block frontend
    res.status(200).json({
      success: true,
      message: 'Email received'
    });
  }
});

module.exports = router;