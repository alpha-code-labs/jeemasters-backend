// routes/tryForFree.js
const express = require('express');
const { firestoreHelpers } = require('../config/firebase');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// POST /api/try-for-free
router.post('/try-for-free', async (req, res) => {
  try {
    const { sessionId, category } = req.body;
    
    if (!sessionId || !category) {
      return res.status(400).json({
        success: false,
        message: 'SessionId and category are required'
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
    const assignedQuestions = user.assignedQuestions || {};
    const userProgress = user.progress || {};
    const categoryProgress = userProgress[category] || { attempted: 0, correct: 0 };
    
    // Check if user already has questions for this category
    let categoryQuestions = assignedQuestions[category];
    let questionToSend;
    
    if (categoryQuestions && categoryQuestions.length > 0) {
      // User has existing questions, send the next unanswered one
      const nextQuestionIndex = categoryProgress.attempted;
      
      if (nextQuestionIndex >= categoryQuestions.length) {
        return res.status(400).json({
          success: false,
          message: 'All questions in this category have been completed'
        });
      }
      
      questionToSend = categoryQuestions[nextQuestionIndex];
      
    } else {
      // User doesn't have questions for this category, generate new ones
      const questionsPath = path.join(__dirname, '..', 'data', 'questions.json');
      const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
      
      // Map category name to JSON structure
      const categoryMap = {
        'Mathematics': 'mathematics',
        'Physics': 'physics', 
        'Chemistry': 'chemistry'
      };
      
      const categoryKey = categoryMap[category];
      if (!categoryKey || !questionsData.subjects[categoryKey]) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
      
      const allCategoryQuestions = questionsData.subjects[categoryKey].questions;
      
      // Randomly select 5 questions
      const shuffled = [...allCategoryQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 5);
      
      // Get existing assigned questions or initialize empty object
      const existingAssignedQuestions = user.assignedQuestions || {};
      
      // Add questions for this category without overriding others
      existingAssignedQuestions[category] = selectedQuestions;
      
      // Update user document with category-specific questions
      await firestoreHelpers.updateDocument('JEEusers', user.id, {
        selectedCategory: category,
        categorySelectedAt: new Date().toISOString(),
        assignedQuestions: existingAssignedQuestions
      });
      
      categoryQuestions = selectedQuestions;
      questionToSend = selectedQuestions[0]; // First question for new category
    }
    
    // Send the appropriate question back to frontend (without correct answer and explanation)
    const questionResponse = {
      id: questionToSend.id,
      question: questionToSend.question,
      options: questionToSend.options
    };
    
    console.log(`User ${sessionId} selected category: ${category}, sent question ${categoryProgress.attempted + 1}/5`);
    
    res.status(200).json({
      success: true,
      message: 'Category selection recorded',
      sessionId: sessionId,
      category: category,
      question: questionResponse,
      currentQuestion: categoryProgress.attempted + 1,
      totalQuestions: categoryQuestions.length
    });
    
  } catch (error) {
    console.error('Error processing try-for-free:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
});

module.exports = router;