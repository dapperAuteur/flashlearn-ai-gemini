import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// POST: Create or update study analytics after a session
export async function POST(request: Request) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const body = await request.json();
    const { setId, sessionResults, sessionTime } = body;

    if (!setId || !sessionResults || !Array.isArray(sessionResults) || typeof sessionTime !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    // Use a composite ID for the analytics document to ensure one per user/set
    const analyticsDocRef = adminDb.collection('study-analytics').doc(`${userId}_${setId}`);
    const analyticsDoc = await analyticsDocRef.get();

    // Use a transaction to safely read and write data
    await adminDb.runTransaction(async (transaction) => {
      const docData = analyticsDoc.exists ? (await transaction.get(analyticsDocRef)).data() : null;

      const newCardPerformance = docData?.cardPerformance || {};
      let totalCorrect = 0;
      let totalIncorrect = 0;

      // Update performance for each card in the session
      sessionResults.forEach(result => {
        const { cardId, correct } = result;
        const cardStats = newCardPerformance[cardId] || { correctCount: 0, incorrectCount: 0 };
        if (correct) {
          cardStats.correctCount += 1;
          totalCorrect += 1;
        } else {
          cardStats.incorrectCount += 1;
          totalIncorrect += 1;
        }
        newCardPerformance[cardId] = cardStats;
      });
      
      const currentTotalCorrect = docData?.setPerformance?.totalCorrect || 0;
      const currentTotalIncorrect = docData?.setPerformance?.totalIncorrect || 0;
      
      const updatedTotalCorrect = currentTotalCorrect + totalCorrect;
      const updatedTotalIncorrect = currentTotalIncorrect + totalIncorrect;
      const newAverageScore = (updatedTotalCorrect / (updatedTotalCorrect + updatedTotalIncorrect)) * 100;

      if (analyticsDoc.exists) {
        // Document exists, update it
        transaction.update(analyticsDocRef, {
          cardPerformance: newCardPerformance,
          'setPerformance.totalStudySessions': FieldValue.increment(1),
          'setPerformance.totalTimeStudied': FieldValue.increment(sessionTime),
          'setPerformance.totalCorrect': FieldValue.increment(totalCorrect),
          'setPerformance.totalIncorrect': FieldValue.increment(totalIncorrect),
          'setPerformance.averageScore': newAverageScore,
           updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // Document doesn't exist, create it
        transaction.set(analyticsDocRef, {
          userId,
          setId,
          cardPerformance: newCardPerformance,
          setPerformance: {
            totalStudySessions: 1,
            totalTimeStudied: sessionTime,
            totalCorrect: totalCorrect,
            totalIncorrect: totalIncorrect,
            averageScore: newAverageScore,
          },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({ message: 'Analytics updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error updating study analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
