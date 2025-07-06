/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebase-admin';
import { subDays } from 'date-fns';

const formatUserName = (firstName: string, lastName: string) => {
    if (!firstName) return "Anonymous";
    const lastInitial = lastName ? `${lastName.charAt(0)}.` : '';
    return `${firstName} ${lastInitial}`;
};

const calculateStatsForPeriod = (analytics: any[], days: number) => {
    const now = new Date();
    const cutoff = subDays(now, days);
    const relevantHistory = analytics.flatMap(a => a.performanceHistory).filter((h: any) => h.date.toDate() >= cutoff);
    const totalCorrect = relevantHistory.length;
    const averageAccuracy = relevantHistory.length > 0 ? relevantHistory.reduce((sum: number, h: any) => sum + h.accuracy, 0) / relevantHistory.length : 0;
    return { totalCorrect, averageAccuracy };
};

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return new NextResponse('Unauthorized', { status: 401 });
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const currentUserId = decodedToken.uid;

    const usersSnapshot = await adminDb.collection('users').get();
    const analyticsSnapshot = await adminDb.collection('studyAnalytics').get();

    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const allAnalytics = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const userData = allUsers.map(user => {
        const userAnalytics = allAnalytics.filter(a => a.userId === user.id);
        const overallCorrect = userAnalytics.reduce((sum, set) => sum + set.cardPerformance.reduce((s: any, p: any) => s + p.correctCount, 0), 0);
        const overallAccuracy = userAnalytics.length > 0 ? userAnalytics.reduce((sum, set) => sum + set.setPerformance.averageScore, 0) / userAnalytics.length : 0;
        const totalTimeStudied = userAnalytics.reduce((sum, set) => sum + set.setPerformance.totalTimeStudied, 0);

        return {
            userId: user.id,
            name: formatUserName(user.firstName, user.lastName),
            image: user.image,
            daily: calculateStatsForPeriod(userAnalytics, 1),
            weekly: calculateStatsForPeriod(userAnalytics, 7),
            monthly: calculateStatsForPeriod(userAnalytics, 30),
            overall: { totalCorrect, averageAccuracy, totalTimeStudied },
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
        const currentUserData = { ...userData.find(u => u.userId === currentUserId), rank: currentUserRank };
        return { top10, currentUser: currentUserData };
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
