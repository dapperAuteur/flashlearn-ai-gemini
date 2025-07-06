import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/firebase-admin';

// GET: Fetch the performance summary for a specific flashcard set
export async function GET(request: Request) {
  try {
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // The setId will be passed as a URL query parameter
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');

    if (!setId) {
      return NextResponse.json({ error: 'setId query parameter is required' }, { status: 400 });
    }

    // The document ID is a composite of userId and setId
    const analyticsDocRef = adminDb.collection('study-analytics').doc(`${userId}_${setId}`);
    const analyticsDoc = await analyticsDocRef.get();

    if (!analyticsDoc.exists) {
      return NextResponse.json({ error: 'No analytics found for this set' }, { status: 404 });
    }

    const analyticsData = analyticsDoc.data();
    const summary = analyticsData?.setPerformance || {};

    return NextResponse.json(summary, { status: 200 });

  } catch (error) {
    console.error('Error fetching score summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
