// src/lib/firebase/firebase-admin.ts

import * as admin from 'firebase-admin';

// This service account key is a secret and should be stored securely
// in your environment variables. It should NOT be exposed to the client.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize the Firebase Admin SDK
// We check if it's already initialized to prevent errors.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };

/**
 * Verifies the user's ID token from the Authorization header.
 * @param {Headers} headers - The request headers.
 * @returns {Promise<admin.auth.DecodedIdToken | null>} The decoded token or null if invalid.
 */
export const verifyIdToken = async (headers: Headers): Promise<admin.auth.DecodedIdToken | null> => {
  const authorization = headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      return null;
    }
  }
  return null;
};
