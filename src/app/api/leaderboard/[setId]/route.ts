import { NextResponse } from 'next/server';
import { adminDb, adminAuth, verifyIdToken } from '@/lib/firebase/firebase-admin';

// GET: Fetch the leaderboard for a specific flashcard set
export async function GET(request: Request, { params }: { params: { setId: string } }) {
  try {
    // While leaderboards can be public, we'll protect the route to prevent abuse.
    const decodedToken = await verifyIdToken(request.headers);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { setId } = params;

    // 1. Query analytics for the given set, ordering by score.
    const analyticsSnapshot = await adminDb
      .collection('study-analytics')
      .where('setId', '==', setId)
      .orderBy('setPerformance.averageScore', 'desc')
      .limit(20) // Let's cap the leaderboard at the top 20 for performance
      .get();

    if (analyticsSnapshot.empty) {
      return NextResponse.json([], { status: 200 }); // Return an empty array if no one has studied this set
    }

    // 2. Get the user IDs from the analytics documents
    const userIds = analyticsSnapshot.docs.map(doc => doc.data().userId);

    // 3. Fetch the user data for the top performers in a single batch
    const userRecords = await adminAuth.getUsers(userIds.map(uid => ({ uid })));

    // 4. Map user data to their scores
    const leaderboard = analyticsSnapshot.docs.map(doc => {
      const data = doc.data();
      const user = userRecords.users.find(u => u.uid === data.userId);
      
      return {
        userId: data.userId,
        displayName: user?.displayName || 'Anonymous', // Use displayName from Firebase Auth
        photoURL: user?.photoURL || null,
        score: data.setPerformance.averageScore,
      };
    });

    return NextResponse.json(leaderboard, { status: 200 });

  } catch (error) {
    console.error(`Error fetching leaderboard for set ${params.setId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
