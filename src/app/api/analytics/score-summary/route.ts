/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import StudyAnalytics, { IStudyAnalytics } from '@/models/StudyAnalytics';
import Profile from '@/models/Profile';
import { startOfDay, subDays } from 'date-fns';

// Helper function to get the total correct count within a date range
const getCorrectCountInRange = (analytics: IStudyAnalytics[], startDate: Date, endDate: Date): number => {
    let totalCorrect = 0;
    for (const set of analytics) {
        // We need to look at the history to see when the correct answers were recorded.
        // This is a simplification; a more robust solution would store timestamps for each answer.
        // For now, we'll count if the set was studied in the period.
        const studiedInPeriod = set.performanceHistory.some(h => {
            const historyDate = new Date(h.date);
            return historyDate >= startDate && historyDate <= endDate;
        });

        if (studiedInPeriod) {
            totalCorrect += set.cardPerformance.reduce((sum, p) => sum + p.correctCount, 0);
        }
    }
    return totalCorrect;
};


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    await dbConnect();

    const userProfiles = await Profile.find({ user: session.user.id });
    if (userProfiles.length === 0) {
        return NextResponse.json({
            overallCorrect: 0, dailyCorrect: 0, weeklyCorrect: 0, monthlyCorrect: 0,
            topSetsByScore: [], bottomSetsByScore: [], allSetsByScore: [],
        });
    }
    const profileIds = userProfiles.map(p => p._id);

    const allAnalytics = await StudyAnalytics.find({ profile: { $in: profileIds } })
      .populate('set', 'title')
      .lean();

    if (allAnalytics.length === 0) {
        return NextResponse.json({
            overallCorrect: 0, dailyCorrect: 0, weeklyCorrect: 0, monthlyCorrect: 0,
            topSetsByScore: [], bottomSetsByScore: [], allSetsByScore: [],
        });
    }

    // --- Calculate Correct Counts ---
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfDay(subDays(now, 7));
    const monthStart = startOfDay(subDays(now, 30));

    // This is a simplified calculation. A real-world app would need event sourcing
    // to accurately get counts for date ranges. We'll use the total count for now.
    const overallCorrect = allAnalytics.reduce((sum, set) => sum + set.cardPerformance.reduce((s, p) => s + p.correctCount, 0), 0);
    // The following are placeholders for a more complex implementation.
    const dailyCorrect = getCorrectCountInRange(allAnalytics, todayStart, now);
    const weeklyCorrect = getCorrectCountInRange(allAnalytics, weekStart, now);
    const monthlyCorrect = getCorrectCountInRange(allAnalytics, monthStart, now);


    // --- Find Top and Bottom Sets by Score ---
    const setsByScore = allAnalytics.map(a => ({
        title: a.set ? (a.set as any).title : 'Untitled Set',
        correctCount: a.cardPerformance.reduce((sum, p) => sum + p.correctCount, 0),
    })).sort((a, b) => b.correctCount - a.correctCount);

    const topSetsByScore = setsByScore.slice(0, 5);
    const bottomSetsByScore = setsByScore.slice(-5).reverse();


    return NextResponse.json({
        overallCorrect,
        dailyCorrect,
        weeklyCorrect,
        monthlyCorrect,
        topSetsByScore,
        bottomSetsByScore,
        allSetsByScore: setsByScore,
    });

  } catch (error) {
    console.error('GET_SCORE_SUMMARY_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
