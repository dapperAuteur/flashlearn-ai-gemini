/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebase-admin';
import { Parser } from 'json2csv';

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) return new NextResponse('Unauthorized', { status: 401 });

        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const setsSnapshot = await adminDb.collection('flashcardSets').where('userId', '==', userId).get();

        if (setsSnapshot.empty) {
            return new NextResponse('No data to export.', { status: 404 });
        }

        const flatData: { setTitle: string; front: string; back: string; isPublic: boolean; }[] = [];
        setsSnapshot.forEach(doc => {
            const set = doc.data();
            set.flashcards.forEach((card: any) => {
                flatData.push({
                    setTitle: set.title,
                    front: card.front,
                    back: card.back,
                    isPublic: set.isPublic || false,
                });
            });
        });

        const json2csvParser = new Parser({ fields: ['setTitle', 'front', 'back', 'isPublic'] });
        const csv = json2csvParser.parse(flatData);

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="flashcard_export_${new Date().toISOString()}.csv"`,
            },
        });

    } catch (error) {
        console.error('[EXPORT_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
