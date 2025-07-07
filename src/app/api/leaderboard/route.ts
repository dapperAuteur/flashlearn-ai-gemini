import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebase-admin';
import { subDays } from 'date-fns';
import { IStudyAnalytics, IUserProfile } from '@/types';

const formatUserName = (firstName?: string, lastName?: string) => {
    if (!firstName) return "Anonymous";
    const lastInitial = lastName ? `${lastName.charAt(0)}.` : '';
    return `${firstName} ${lastInitial}`;
};

const calculateStatsForPeriod = (analytics: IStudyAnalytics[], days: number) => {
    const now = new Date();
    const cutoff = subDays(now, days);
    const relevantHistory = analytics
        .flatMap(a => a.performanceHistory || [])
        .filter(h => {
            if (!h.date) return false;
            // Type guard to handle both Date and Firestore Timestamp objects
            if ('toDate' in h.date) {
                return h.date.toDate() >= cutoff; // It's a Timestamp
            }
            // It's a standard Date object
            return h.date >= cutoff;
        });

    const totalCorrect = relevantHistory.length;
    const averageAccuracy = relevantHistory.length > 0 
        ? relevantHistory.reduce((sum, h) => sum + h.accuracy, 0) / relevantHistory.length 
        : 0;
    return { totalCorrect, averageAccuracy };
};

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return new NextResponse('Unauthorized', { status: 401 });
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const currentUserId = decodedToken.uid;

    const [usersSnapshot, analyticsSnapshot] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('studyAnalytics').get()
    ]);

    const allUsers: IUserProfile[] = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as IUserProfile));

    // Performance Improvement: Group analytics by userId for O(1) lookup.
    const analyticsByUser = new Map<string, IStudyAnalytics[]>();
    analyticsSnapshot.docs.forEach(doc => {
      const analytic = { id: doc.id, ...doc.data() } as IStudyAnalytics;
      if (analytic.userId) {
        const userAnalytics = analyticsByUser.get(analytic.userId) || [];
        userAnalytics.push(analytic);
        analyticsByUser.set(analytic.userId, userAnalytics);
      }
    });

    const userData = allUsers.map(user => {
        const userAnalytics = analyticsByUser.get(user.id!) || [];

        const overallCorrect = userAnalytics.reduce((sum, set) =>
            sum + (set.cardPerformance || []).reduce((s, p) => s + p.correctCount, 0), 0);

        const totalTimeStudied = userAnalytics.reduce((sum, set) =>
            sum + (set.setPerformance?.totalTimeStudied || 0), 0);

        const setsWithScores = userAnalytics.filter(set => typeof set.setPerformance?.averageScore === 'number');
        const overallAccuracy = setsWithScores.length > 0
            ? setsWithScores.reduce((sum, set) => sum + set.setPerformance.averageScore, 0) / setsWithScores.length
            : 0;

        return {
            userId: user.id!,
            name: formatUserName(user.firstName, user.lastName),
            image: user.image,
            daily: calculateStatsForPeriod(userAnalytics, 1),
            weekly: calculateStatsForPeriod(userAnalytics, 7),
            monthly: calculateStatsForPeriod(userAnalytics, 30),
            overall: { totalCorrect: overallCorrect, averageAccuracy: overallAccuracy, totalTimeStudied },
        };
    });

    const generateLeaderboard = (metric: 'totalCorrect' | 'averageAccuracy', period: 'daily' | 'weekly' | 'monthly' | 'overall') => {
        const sorted = [...userData].sort((a, b) => {
            const metricA = a[period][metric];
            const metricB = b[period][metric];
            if (metricB !== metricA) return metricB - metricA;
            return a.overall.totalTimeStudied - b.overall.totalTimeStudied;
        });
        const top10 = sorted.slice(0, 10).map((u, i) => ({ ...u, rank: i + 1 }));
        const currentUserRank = sorted.findIndex(u => u.userId === currentUserId) + 1;
        const foundUser = userData.find(u => u.userId === currentUserId);
        const currentUser = foundUser ? { ...foundUser, rank: currentUserRank > 0 ? currentUserRank : undefined } : null;
        return { top10, currentUser };
    };

    const leaderboards = {
        percentage: {
            daily: generateLeaderboard('averageAccuracy', 'daily'),
            weekly: generateLeaderboard('averageAccuracy', 'weekly'),
            monthly: generateLeaderboard('averageAccuracy', 'monthly'),
            overall: generateLeaderboard('averageAccuracy', 'overall'),
        },
        score: {
            daily: generateLeaderboard('totalCorrect', 'daily'),
            weekly: generateLeaderboard('totalCorrect', 'weekly'),
            monthly: generateLeaderboard('totalCorrect', 'monthly'),
            overall: generateLeaderboard('totalCorrect', 'overall'),
        }
    };

    return NextResponse.json(leaderboards);

  } catch (error) {
    console.error('LEADERBOARD_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
