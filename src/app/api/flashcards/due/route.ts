import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/firebase-admin';

// GET: Fetch flashcards that are due for review in a specific set
export async function GET(request: Request) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');

    if (!setId) {
      return NextResponse.json({ error: 'setId query parameter is required' }, { status: 400 });
    }

    // 1. Fetch the flashcard set to get all cards
    const setDocRef = adminDb.collection('flashcard-sets').doc(setId);
    const setDoc = await setDocRef.get();

    if (!setDoc.exists || setDoc.data()?.userId !== userId) {
      return NextResponse.json({ error: 'Flashcard set not found or access denied' }, { status: 404 });
    }
    const allFlashcards = setDoc.data()?.flashcards || [];

    // 2. Fetch the analytics for this user and set
    const analyticsDocRef = adminDb.collection('study-analytics').doc(`${userId}_${setId}`);
    const analyticsDoc = await analyticsDocRef.get();
    const cardPerformance = analyticsDoc.exists ? analyticsDoc.data()?.cardPerformance : {};

    // 3. Determine which cards are "due"
    const dueFlashcards = allFlashcards.filter((card: { id: string }) => {
      const performance = cardPerformance?.[card.id];
      if (!performance) {
        return true; // Never studied before, so it's due
      }
      // Simple logic: due if incorrect count is greater than correct count
      return (performance.incorrectCount || 0) > (performance.correctCount || 0);
    });

    return NextResponse.json(dueFlashcards, { status: 200 });

  } catch (error) {
    console.error('Error fetching due flashcards:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
