/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import StudyAnalytics, { IStudyAnalytics } from '@/models/StudyAnalytics';
import Profile from '@/models/Profile';

// Helper function to filter performance history by a date range
const getAverageAccuracy = (history: { date: Date; accuracy: number }[], days: number): number => {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - days));
    
    const relevantHistory = history.filter(h => new Date(h.date) >= cutoffDate);
    if (relevantHistory.length === 0) return 0;

    const sum = relevantHistory.reduce((acc, curr) => acc + curr.accuracy, 0);
    return sum / relevantHistory.length;
};


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    await dbConnect();

    const userProfiles = await Profile.find({ user: session.user.id });
    if (userProfiles.length === 0) {
        return NextResponse.json({
            overallAverage: 0,
            dailyAverage: 0,
            weeklyAverage: 0,
            monthlyAverage: 0,
            topSets: [],
            bottomSets: [],
            allSets: [],
        });
    }
    const profileIds = userProfiles.map(p => p._id);

    const allAnalytics = await StudyAnalytics.find({ profile: { $in: profileIds } })
      .populate('set', 'title')
      .lean(); // Use .lean() for faster, plain JS objects

    if (allAnalytics.length === 0) {
        return NextResponse.json({
            overallAverage: 0,
            dailyAverage: 0,
            weeklyAverage: 0,
            monthlyAverage: 0,
            topSets: [],
            bottomSets: [],
            allSets: [],
        });
    }

    // --- Calculate Averages ---
    const allHistory = allAnalytics.flatMap(a => a.performanceHistory);
    
    const overallAverage = getAverageAccuracy(allHistory, 365 * 10); // A long time for "all time"
    const dailyAverage = getAverageAccuracy(allHistory, 1);
    const weeklyAverage = getAverageAccuracy(allHistory, 7);
    const monthlyAverage = getAverageAccuracy(allHistory, 30);

    // --- Find Top and Bottom Sets ---
    const setsPerformance = allAnalytics.map(a => ({
        // Ensure set is not null before accessing title
        title: a.set ? (a.set as any).title : 'Untitled Set',
        accuracy: a.setPerformance.averageScore,
    })).sort((a, b) => b.accuracy - a.accuracy);

    const topSets = setsPerformance.slice(0, 5);
    const bottomSets = setsPerformance.slice(-5).reverse();


    return NextResponse.json({
        overallAverage,
        dailyAverage,
        weeklyAverage,
        monthlyAverage,
        topSets,
        bottomSets,
        allSets: setsPerformance,
    });

  } catch (error) {
    console.error('GET_ANALYTICS_SUMMARY_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
