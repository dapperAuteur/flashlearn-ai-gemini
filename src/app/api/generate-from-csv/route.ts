import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB, FLASHCARD_MAX, FLASHCARD_MIN, MODEL } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // 2. Validate the incoming data
    const body = await request.json();
    const { title, flashcards } = body;

    if (!title || !flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid title or flashcards data.' }, { status: 400 });
    }

    // Ensure all flashcards have required fields
    for (const card of flashcards) {
        if (!card.question || !card.answer) {
            return NextResponse.json({ error: 'All flashcards must have a question and an answer.' }, { status: 400 });
        }
    }

    // 3. Create the new flashcard set document in Firestore
    const newSet = {
      userId,
      title,
      description: body.description || `Generated from CSV import on ${new Date().toLocaleDateString()}`,
      flashcards: flashcards.map(card => ({
          id: card.id || crypto.randomUUID(), // Ensure every card has an ID
          question: card.question,
          answer: card.answer
      })),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('flashcard-sets').add(newSet);

    // 4. Return the newly created document's ID and data
    return NextResponse.json({ id: docRef.id, ...newSet }, { status: 201 });

  } catch (error) {
    console.error('Error creating flashcard set from CSV:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
