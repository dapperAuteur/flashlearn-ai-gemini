import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    try {
        const { data } = await req.json(); // Data is the parsed CSV from the client
        if (!data || !Array.isArray(data) || data.length === 0) {
            return new NextResponse('No data provided for import.', { status: 400 });
        }
        
        await dbConnect();
        let userProfile = await Profile.findOne({ user: session.user.id });
        if (!userProfile) {
            userProfile = new Profile({ user: session.user.id, profileName: 'Default Profile' });
            await userProfile.save();
            await User.findByIdAndUpdate(session.user.id, { $push: { profiles: userProfile._id } });
        }

        // Group flashcards by setTitle
        const setsToCreate: Record<string, { front: string; back: string }[]> = {};
        for (const row of data) {
            if (row.setTitle && row.front && row.back) {
                if (!setsToCreate[row.setTitle]) {
                    setsToCreate[row.setTitle] = [];
                }
                setsToCreate[row.setTitle].push({ front: row.front, back: row.back });
            }
        }

        // Create new FlashcardSet for each group
        let setsCreatedCount = 0;
        for (const title in setsToCreate) {
            const newSet = new FlashcardSet({
                profile: userProfile._id,
                title,
                flashcards: setsToCreate[title],
                source: 'CSV',
            });
            await newSet.save();
            setsCreatedCount++;
        }

        return NextResponse.json({ message: `${setsCreatedCount} set(s) imported successfully.` });

    } catch (error) {
        console.error('[IMPORT_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
