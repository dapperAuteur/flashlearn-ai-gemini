/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Parser } from 'json2csv';

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) return new NextResponse('Unauthorized', { status: 401 });

        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // We need to get the user's profile to find their analytics
        const profileQuery = await adminDb.collection('users').doc(userId).collection('profiles').get();
        if (profileQuery.empty) {
            return new NextResponse('No profile found for user.', { status: 404 });
        }
        const profileIds = profileQuery.docs.map(doc => doc.id);

        // Find all analytics documents for the user's profiles
        const analyticsSnapshot = await adminDb.collection('studyAnalytics').where('profileId', 'in', profileIds).get();

        if (analyticsSnapshot.empty) {
            return new NextResponse('No score data to export.', { status: 404 });
        }

        const analyticsData = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch all set titles in parallel for efficiency
        const setIds = [...new Set(analyticsData.map(a => a.setId))];
        const setRefs = setIds.map(id => adminDb.collection('flashcardSets').doc(id));
        const setDocs = await adminDb.getAll(...setRefs);
        const setTitles = Object.fromEntries(setDocs.map(doc => [doc.id, doc.data()?.title || 'Untitled Set']));

        // Format the data for CSV export
        const flatData = analyticsData.map(analytic => {
            const totalCorrect = analytic.cardPerformance.reduce((sum: number, p: any) => sum + p.correctCount, 0);
            const totalIncorrect = analytic.cardPerformance.reduce((sum: number, p: any) => sum + p.incorrectCount, 0);
            return {
                setTitle: setTitles[analytic.setId],
                averageScorePercent: analytic.setPerformance.averageScore.toFixed(2),
                totalCorrect,
                totalIncorrect,
                totalStudySessions: analytic.setPerformance.totalStudySessions,
                lastStudied: analytic.updatedAt.toDate().toISOString(),
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
