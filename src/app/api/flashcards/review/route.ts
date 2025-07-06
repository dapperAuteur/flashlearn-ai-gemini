/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// POST: Submit the results of a flashcard review session
export async function POST(request: Request) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const body = await request.json();
    const { setId, reviewResults } = body; // reviewResults: [{ cardId: string, correct: boolean }]

    if (!setId || !reviewResults || !Array.isArray(reviewResults)) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    const analyticsDocRef = adminDb.collection('study-analytics').doc(`${userId}_${setId}`);

    // Use a transaction to safely update the analytics document
    await adminDb.runTransaction(async (transaction) => {
      const analyticsDoc = await transaction.get(analyticsDocRef);
      
      const updates: { [key: string]: any } = {};
      let totalCorrectUpdates = 0;
      let totalIncorrectUpdates = 0;

      reviewResults.forEach(result => {
        const { cardId, correct } = result;
        if (correct) {
          updates[`cardPerformance.${cardId}.correctCount`] = FieldValue.increment(1);
          totalCorrectUpdates++;
        } else {
          updates[`cardPerformance.${cardId}.incorrectCount`] = FieldValue.increment(1);
          totalIncorrectUpdates++;
        }
      });

      if (!analyticsDoc.exists) {
        // If the document doesn't exist, we must create it with initial values.
        // FieldValue.increment() requires the field to exist.
        const initialCardPerformance = reviewResults.reduce((acc, result) => {
            acc[result.cardId] = {
                correctCount: result.correct ? 1 : 0,
                incorrectCount: result.correct ? 0 : 1,
            };
            return acc;
        }, {} as { [key: string]: { correctCount: number, incorrectCount: number }});

        transaction.set(analyticsDocRef, {
            userId,
            setId,
            cardPerformance: initialCardPerformance,
            setPerformance: {
                totalStudySessions: 1, // First session
                totalTimeStudied: 0, // Time is updated via the main analytics route
                totalCorrect: totalCorrectUpdates,
                totalIncorrect: totalIncorrectUpdates,
                averageScore: (totalCorrectUpdates / (totalCorrectUpdates + totalIncorrectUpdates)) * 100,
            },
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

      } else {
        // Document exists, so we can safely increment
        const currentData = analyticsDoc.data()!;
        const currentTotalCorrect = currentData.setPerformance?.totalCorrect || 0;
        const currentTotalIncorrect = currentData.setPerformance?.totalIncorrect || 0;

        const newTotalCorrect = currentTotalCorrect + totalCorrectUpdates;
        const newTotalIncorrect = currentTotalIncorrect + totalIncorrectUpdates;
        
        updates['setPerformance.totalCorrect'] = FieldValue.increment(totalCorrectUpdates);
        updates['setPerformance.totalIncorrect'] = FieldValue.increment(totalIncorrectUpdates);
        updates['setPerformance.averageScore'] = (newTotalCorrect / (newTotalCorrect + newTotalIncorrect)) * 100;
        updates['updatedAt'] = FieldValue.serverTimestamp();
        
        transaction.update(analyticsDocRef, updates);
      }
    });

    return NextResponse.json({ message: 'Review recorded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error recording review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
