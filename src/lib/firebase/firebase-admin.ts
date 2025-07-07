// src/lib/firebase/firebase-admin.ts

import * as admin from 'firebase-admin';

// Construct the service account object from individual environment variables.
// This is more reliable than parsing a single JSON string.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key is sensitive and should be handled carefully.
  // The replace() call ensures that the newline characters are correctly formatted.
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Check if the required environment variables are present.
if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error('[🔥 FIREBASE INIT FAILED] Missing required Firebase Admin SDK environment variables.');
  // In a production environment, you might want to throw an error to prevent the app from starting.
  // For now, we'll log the error. The app will fail when an admin action is attempted.
} else {
  // Initialize the Firebase Admin SDK only if it hasn't been initialized yet.
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      console.log('[✅ FIREBASE ADMIN SDK] Initialized successfully.');
    } catch (error) {
      console.error('[🔥 FIREBASE INIT FAILED] Error initializing app:', error);
    }
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };
