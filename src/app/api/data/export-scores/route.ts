import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import StudyAnalytics from '@/models/StudyAnalytics';
import Profile from '@/models/Profile';
import { Parser } from 'json2csv';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const userProfiles = await Profile.find({ user: session.user.id });
        const profileIds = userProfiles.map(p => p._id);

        // Find all analytics documents for the user's profiles
        const analytics = await StudyAnalytics.find({ profile: { $in: profileIds } })
            .populate('set', 'title') // Populate the set title
            .lean();

        if (analytics.length === 0) {
            return new NextResponse('No score data to export.', { status: 404 });
        }

        // Format the data for CSV export
        const flatData = analytics.map(analytic => {
            const totalCorrect = analytic.cardPerformance.reduce((sum, p) => sum + p.correctCount, 0);
            const totalIncorrect = analytic.cardPerformance.reduce((sum, p) => sum + p.incorrectCount, 0);
            return {
                setTitle: analytic.set ? (analytic.set as any).title : 'Untitled Set',
                averageScorePercent: analytic.setPerformance.averageScore.toFixed(2),
                totalCorrect,
                totalIncorrect,
                totalStudySessions: analytic.setPerformance.totalStudySessions,
                lastStudied: new Date(analytic.updatedAt).toISOString(),
            };
        });

        const fields = ['setTitle', 'averageScorePercent', 'totalCorrect', 'totalIncorrect', 'totalStudySessions', 'lastStudied'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(flatData);

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="flashcard_scores_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error('[EXPORT_SCORES_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
