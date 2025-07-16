// routes/submitAnswer.js
const express = require('express');
const { firestoreHelpers } = require('../config/firebase');

const router = express.Router();

// Message pools for variety
const correctMessages = [
  "🎉 Congratulations! That's absolutely correct! Well done!",
  "🌟 Excellent! You nailed it! Perfect answer!",
  "👏 Outstanding! You got it right! Great job!",
  "🚀 Fantastic! That's the correct answer! You're on fire!",
  "✨ Brilliant! Absolutely right! Keep it up!",
  "🎯 Bull's eye! Perfect choice! You're doing amazing!",
  "💫 Superb! That's exactly right! Impressive work!",
  "🔥 Amazing! Correct answer! You're crushing it!",
  "⭐ Perfect! You got it! Excellent reasoning!",
  "🎊 Wonderful! That's right! Keep up the great work!"
];

const wrongMessages = [
  "😔 Tough luck! That's not the right answer, but don't worry - every mistake is a learning opportunity!",
  "🤔 Oops! Not quite right, but you're getting there! Let's learn from this!",
  "💭 Close, but not correct! Don't get discouraged - this is how we grow!",
  "🧠 Not the right choice, but great attempt! Learning is a journey!",
  "📚 That's incorrect, but every wrong answer teaches us something valuable!",
  "🎯 Missed this one, but you're building knowledge with each try!",
  "💡 Not quite, but keep that curiosity going! You'll get the next one!",
  "🌱 Incorrect, but remember - every expert was once a beginner!",
  "🔍 That's not right, but analyzing mistakes makes us stronger!",
  "⚡ Wrong answer, but your effort is what counts! Keep pushing forward!"
];

// POST /api/submit-answer
router.post('/submit-answer', async (req, res) => {
  try {
    const { sessionId, questionId, selectedOption, selectedText } = req.body;
    
    if (!sessionId || !questionId || selectedOption === undefined) {
      return res.status(400).json({
        success: false,
        message: 'SessionId, questionId, and selectedOption are required'
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
    
    // Find the question in user's assigned questions
    let foundQuestion = null;
    let questionCategory = null;
    let categoryQuestions = [];
    
    for (const [category, questions] of Object.entries(assignedQuestions)) {
      const question = questions.find(q => q.id === parseInt(questionId));
      if (question) {
        foundQuestion = question;
        questionCategory = category;
        categoryQuestions = questions;
        break;
      }
    }
    
    if (!foundQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in user\'s assigned questions'
      });
    }
    
    // Check if answer is correct
    const isCorrect = foundQuestion.correct === selectedOption;
    
    // Randomly select message from appropriate pool
    let responseMessage;
    if (isCorrect) {
      const randomIndex = Math.floor(Math.random() * correctMessages.length);
      responseMessage = correctMessages[randomIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * wrongMessages.length);
      responseMessage = wrongMessages[randomIndex];
    }
    
    // Get current attempt count for this category
    const userProgress = user.progress || {};
    const categoryProgress = userProgress[questionCategory] || { attempted: 0, correct: 0 };
    
    // Update progress
    const updatedProgress = {
      ...userProgress,
      [questionCategory]: {
        attempted: categoryProgress.attempted + 1,
        correct: categoryProgress.correct + (isCorrect ? 1 : 0)
      }
    };
    
    // Find next question
    let nextQuestion = null;
    const nextQuestionIndex = categoryProgress.attempted + 1; // Since we're about to increment attempted
    
    if (nextQuestionIndex < categoryQuestions.length) {
      const nextQ = categoryQuestions[nextQuestionIndex];
      nextQuestion = {
        id: nextQ.id,
        question: nextQ.question,
        options: nextQ.options
      };
    }
    
    // Update user document with progress
    await firestoreHelpers.updateDocument('JEEusers', user.id, {
      progress: updatedProgress,
      lastAnsweredAt: new Date().toISOString()
    });
    
    console.log(`User ${sessionId} answered question ${questionId}: ${isCorrect ? 'CORRECT' : 'WRONG'}`);
    
    const response = {
      success: true,
      isCorrect: isCorrect,
      message: responseMessage,
      explanation: foundQuestion.explanation,
      correctAnswer: foundQuestion.correct,
      correctAnswerText: foundQuestion.options[foundQuestion.correct],
      questionId: questionId,
      questionsAttempted: updatedProgress[questionCategory].attempted,
      questionsCorrect: updatedProgress[questionCategory].correct,
      totalQuestions: categoryQuestions.length,
      emailCaptured: !!(user.email) // Check if user already has email
    };
    
    // Add next question if available
    if (nextQuestion) {
      response.nextQuestion = nextQuestion;
    } else {
      response.testComplete = true;
      response.finalMessage = `🎊 Congratulations! You've completed all ${categoryQuestions.length} questions in ${questionCategory}! Final Score: ${updatedProgress[questionCategory].correct}/${updatedProgress[questionCategory].attempted}`;
    }
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error processing answer submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process answer submission'
    });
  }
});

module.exports = router;