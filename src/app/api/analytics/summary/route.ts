import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/firebase-admin';

// GET: Fetch an aggregated summary of all study analytics for a user
export async function GET(request: Request) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    const analyticsSnapshot = await adminDb.collection('study-analytics').where('userId', '==', userId).get();

    if (analyticsSnapshot.empty) {
      // If no analytics, return a default empty state
      return NextResponse.json({
        totalSetsStudied: 0,
        totalStudySessions: 0,
        totalTimeStudied: 0,
        overallAverageScore: 0,
      }, { status: 200 });
    }

    // Aggregate the data from all of the user's analytics documents
    let totalStudySessions = 0;
    let totalTimeStudied = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;

    analyticsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.setPerformance) {
        totalStudySessions += data.setPerformance.totalStudySessions || 0;
        totalTimeStudied += data.setPerformance.totalTimeStudied || 0;
        totalCorrect += data.setPerformance.totalCorrect || 0;
        totalIncorrect += data.setPerformance.totalIncorrect || 0;
      }
    });

    const totalSetsStudied = analyticsSnapshot.size;
    const overallAverageScore = (totalCorrect + totalIncorrect) > 0 
      ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100 
      : 0;

    const summary = {
      totalSetsStudied,
      totalStudySessions,
      totalTimeStudied, // in seconds
      overallAverageScore,
    };

    return NextResponse.json(summary, { status: 200 });

  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
