import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

// Ensure the app is not already initialized
if (!admin.apps.length) {
  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace newlines with actual newlines for Vercel/other environments
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
} else {
  adminApp = admin.app();
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminApp, adminAuth, adminDb };
