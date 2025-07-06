/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import StudyAnalytics from '@/models/StudyAnalytics';
import User from '@/models/User';
import { startOfDay, subDays } from 'date-fns';

// A helper function to format user names as "First L."
const formatUserName = (firstName: string, lastName: string) => {
    if (!firstName) return "Anonymous";
    const lastInitial = lastName ? `${lastName.charAt(0)}.` : '';
    return `${firstName} ${lastInitial}`;
};

// Helper to calculate stats for a given date range
const calculateStatsForPeriod = (analytics: any[], days: number) => {
    const now = new Date();
    const cutoff = subDays(now, days);
    
    const relevantHistory = analytics.flatMap(a => a.performanceHistory)
                                     .filter(h => new Date(h.date) >= cutoff);

    const totalCorrect = relevantHistory.length; // Simplified: each history point is one correct answer
    const averageAccuracy = relevantHistory.length > 0
        ? relevantHistory.reduce((sum, h) => sum + h.accuracy, 0) / relevantHistory.length
        : 0;
        
    return { totalCorrect, averageAccuracy };
};


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    await dbConnect();

    // Fetch all users and their analytics data
    const allUsers = await User.find({}).select('firstName lastName').lean();
    const allAnalytics = await StudyAnalytics.find({}).populate({
        path: 'profile',
        select: 'user'
    }).lean();

    const userData = allUsers.map(user => {
        const userAnalytics = allAnalytics.filter(a => a.profile?.user?.toString() === user._id.toString());
        
        const overallCorrect = userAnalytics.reduce((sum, set) => sum + set.cardPerformance.reduce((s, p) => s + p.correctCount, 0), 0);
        const overallAccuracy = userAnalytics.length > 0 
            ? userAnalytics.reduce((sum, set) => sum + set.setPerformance.averageScore, 0) / userAnalytics.length
            : 0;

        return {
            userId: user._id.toString(),
            name: formatUserName(user.firstName, user.lastName),
            daily: calculateStatsForPeriod(userAnalytics, 1),
            weekly: calculateStatsForPeriod(userAnalytics, 7),
            monthly: calculateStatsForPeriod(userAnalytics, 30),
            overall: { totalCorrect: overallCorrect, averageAccuracy: overallAccuracy },
        };
    });

    // --- Generate Leaderboards ---
    const generateLeaderboard = (metric: 'totalCorrect' | 'averageAccuracy', period: 'daily' | 'weekly' | 'monthly' | 'overall') => {
        const sorted = [...userData].sort((a, b) => b[period][metric] - a[period][metric]);
        const top10 = sorted.slice(0, 10).map((u, i) => ({ ...u, rank: i + 1 }));
        
        const currentUserRank = sorted.findIndex(u => u.userId === session.user.id) + 1;
        const currentUserData = { ...userData.find(u => u.userId === session.user.id), rank: currentUserRank };

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
