import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import { Parser } from 'json2csv';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const userProfiles = await Profile.find({ user: session.user.id });
        const profileIds = userProfiles.map(p => p._id);
        const sets = await FlashcardSet.find({ profile: { $in: profileIds } }).lean();

        if (sets.length === 0) {
            return new NextResponse('No data to export.', { status: 404 });
        }

        // Flatten the data for CSV export, now including isPublic
        const flatData = sets.flatMap(set => 
            set.flashcards.map(card => ({
                setTitle: set.title,
                front: card.front,
                back: card.back,
                isPublic: set.isPublic, // Add the isPublic field
            }))
        );

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
