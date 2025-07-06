/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import StudyAnalytics from '@/models/StudyAnalytics';
import User from '@/models/User';
import FlashcardSet from '@/models/FlashcardSet';
import { subDays } from 'date-fns';

const formatUserName = (firstName: string, lastName: string) => {
    if (!firstName) return "Anonymous";
    const lastInitial = lastName ? `${lastName.charAt(0)}.` : '';
    return `${firstName} ${lastInitial}`;
};

// Helper to calculate stats for a given user's analytics for a specific period
const calculateUserStatsForPeriod = (analytics: any, days: number) => {
    const now = new Date();
    const cutoff = subDays(now, days);
    
    const relevantHistory = analytics.performanceHistory.filter((h: any) => new Date(h.date) >= cutoff);

    // As a proxy, we count history entries as "correct answers" in the period
    const totalCorrect = relevantHistory.length; 
    const averageAccuracy = relevantHistory.length > 0
        ? relevantHistory.reduce((sum: number, h: any) => sum + h.accuracy, 0) / relevantHistory.length
        : 0;
        
    return { totalCorrect, averageAccuracy };
};

export async function GET(
  _request: Request,
  { params }: { params: { setId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { setId } = await params;
    await dbConnect();

    const set = await FlashcardSet.findById(setId).select('title').lean();
    if (!set) {
        return new NextResponse('Set not found', { status: 404 });
    }

    const analyticsForSet = await StudyAnalytics.find({ set: setId })
        .populate({
            path: 'profile',
            populate: { path: 'user', select: 'firstName lastName' }
        })
        .lean();

    const userData = analyticsForSet.map(a => {
        const user = (a.profile as any).user;
        const overallCorrect = a.cardPerformance.reduce((sum, p) => sum + p.correctCount, 0);

        return {
            userId: user._id.toString(),
            name: formatUserName(user.firstName, user.lastName),
            daily: calculateUserStatsForPeriod(a, 1),
            weekly: calculateUserStatsForPeriod(a, 7),
            monthly: calculateUserStatsForPeriod(a, 30),
            overall: { totalCorrect: overallCorrect, averageAccuracy: a.setPerformance.averageScore },
        };
    });

    const generateLeaderboard = (metric: 'totalCorrect' | 'averageAccuracy', period: 'daily' | 'weekly' | 'monthly' | 'overall') => {
        const sorted = [...userData].sort((a, b) => b[period][metric] - a[period][metric]);
        const top10 = sorted.slice(0, 10).map((u, i) => ({ ...u, rank: i + 1 }));
        const currentUserRank = sorted.findIndex(u => u.userId === session.user.id) + 1;
        const currentUserData = { ...userData.find(u => u.userId === session.user.id), rank: currentUserRank };
        return { top10, currentUser: currentUserData };
    };

    const leaderboards = {
        setTitle: set.title,
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
    console.error('PER_SET_LEADERBOARD_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
