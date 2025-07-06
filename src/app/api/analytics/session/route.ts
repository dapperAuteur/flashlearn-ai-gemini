import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/firebase-admin';

// GET: Fetch detailed card-by-card performance for a specific set
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

    const analyticsDocRef = adminDb.collection('study-analytics').doc(`${userId}_${setId}`);
    const analyticsDoc = await analyticsDocRef.get();

    if (!analyticsDoc.exists) {
      // Return an empty object if no analytics exist yet, which is a valid state
      return NextResponse.json({}, { status: 200 });
    }

    const analyticsData = analyticsDoc.data();
    // Return the detailed card performance map
    const cardPerformance = analyticsData?.cardPerformance || {};

    return NextResponse.json(cardPerformance, { status: 200 });

  } catch (error) {
    console.error('Error fetching session analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
