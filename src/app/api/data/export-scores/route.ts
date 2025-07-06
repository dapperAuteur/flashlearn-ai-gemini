/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebase-admin';
import { Parser } from 'json2csv';
import { IStudyAnalytics } from '@/types'; // Import the centralized type

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) return new NextResponse('Unauthorized', { status: 401 });

        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const profileQuery = await adminDb.collection('users').doc(userId).collection('profiles').get();
        if (profileQuery.empty) {
            return new NextResponse('No profile found for user.', { status: 404 });
        }
        const profileIds = profileQuery.docs.map(doc => doc.id);

        const analyticsSnapshot = await adminDb.collection('studyAnalytics').where('profileId', 'in', profileIds).get();

        if (analyticsSnapshot.empty) {
            return new NextResponse('No score data to export.', { status: 404 });
        }

        const analyticsData = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IStudyAnalytics[];

        const setIds = [...new Set(analyticsData.map(a => a.setId))];
        const setRefs = setIds.map(id => adminDb.collection('flashcardSets').doc(id));
        const setDocs = await adminDb.getAll(...setRefs);
        const setTitles = Object.fromEntries(setDocs.map(doc => [doc.id, doc.data()?.title || 'Untitled Set']));

        const flatData = analyticsData.map(analytic => {
            const totalCorrect = analytic.cardPerformance.reduce((sum, p) => sum + p.correctCount, 0);
            const totalIncorrect = analytic.cardPerformance.reduce((sum, p) => sum + p.incorrectCount, 0);
            return {
                setTitle: setTitles[analytic.setId],
                averageScorePercent: analytic.setPerformance.averageScore.toFixed(2),
                totalCorrect,
                totalIncorrect,
                totalStudySessions: analytic.setPerformance.totalStudySessions,
                lastStudied: (analytic.updatedAt as any).toDate().toISOString(),
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
