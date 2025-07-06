import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// POST: Create a new flashcard set
export async function POST(request: Request) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const body = await request.json();
    const { title, description, flashcards } = body;

    if (!title || !flashcards || !Array.isArray(flashcards)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newSet = {
      userId,
      title,
      description: description || '',
      flashcards,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('flashcard-sets').add(newSet);

    return NextResponse.json({ id: docRef.id, ...newSet }, { status: 201 });
  } catch (error) {
    console.error('Error creating flashcard set:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Get all flashcard sets for the authenticated user
export async function GET(request: Request) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const setsSnapshot = await adminDb.collection('flashcard-sets').where('userId', '==', userId).get();

    if (setsSnapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const sets = setsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(sets, { status: 200 });
  } catch (error) {
    console.error('Error fetching flashcard sets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
