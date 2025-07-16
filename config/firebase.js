const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      let credential;
      
      // Check if running in Azure (production) or local (development)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        // Azure/Production: Use environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        credential = admin.credential.cert(serviceAccount);
      } else {
        // Local development: Use JSON file
        const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
        credential = admin.credential.cert(serviceAccountPath);
      }
      
      admin.initializeApp({
        credential: credential,
        projectId: process.env.FIREBASE_PROJECT_ID || 'jeemaster-269d3'
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
    
    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    throw error;
  }
};

// Get Firestore database instance
const getFirestore = () => {
  try {
    return admin.firestore();
  } catch (error) {
    console.error('❌ Error getting Firestore instance:', error.message);
    throw error;
  }
};

// Helper functions for common Firestore operations
const firestoreHelpers = {
  // Add a document to a collection
  async addDocument(collectionName, data) {
    try {
      const db = getFirestore();
      const docRef = await db.collection(collectionName).add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  },
  
  // Get a document by ID
  async getDocument(collectionName, docId) {
    try {
      const db = getFirestore();
      const doc = await db.collection(collectionName).doc(docId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  },
  
  // Get all documents from a collection
  async getAllDocuments(collectionName, orderBy = 'createdAt', order = 'desc') {
    try {
      const db = getFirestore();
      const snapshot = await db.collection(collectionName)
        .orderBy(orderBy, order)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  },
  
  // Update a document
  async updateDocument(collectionName, docId, data) {
    try {
      const db = getFirestore();
      await db.collection(collectionName).doc(docId).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  },
  
  // Delete a document
  async deleteDocument(collectionName, docId) {
    try {
      const db = getFirestore();
      await db.collection(collectionName).doc(docId).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  },
  
  // Query documents with conditions
  async queryDocuments(collectionName, field, operator, value) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection(collectionName)
        .where(field, operator, value)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      throw error;
    }
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  admin,
  firestoreHelpers
};