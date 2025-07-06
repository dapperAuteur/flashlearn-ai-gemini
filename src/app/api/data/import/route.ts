import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) return new NextResponse('Unauthorized', { status: 401 });

        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const { data } = await req.json();
        if (!data || !Array.isArray(data) || data.length === 0) {
            return new NextResponse('No data provided for import.', { status: 400 });
        }

        // Find or create the user's default profile
        const profileQuery = await adminDb.collection('users').doc(userId).collection('profiles').where('isDefault', '==', true).limit(1).get();
        let profileId: string;

        if (profileQuery.empty) {
            const newProfileRef = adminDb.collection('users').doc(userId).collection('profiles').doc();
            await newProfileRef.set({
                profileName: 'Default Profile',
                isDefault: true,
                userId: userId,
                createdAt: FieldValue.serverTimestamp(),
            });
            profileId = newProfileRef.id;
        } else {
            profileId = profileQuery.docs[0].id;
        }

        // Group flashcards by setTitle
        const setsToCreate: Record<string, { flashcards: { front: string; back: string }[], isPublic: boolean }> = {};
        for (const row of data) {
            if (row.setTitle && row.front && row.back) {
                const title = row.setTitle;
                if (!setsToCreate[title]) {
                    setsToCreate[title] = { flashcards: [], isPublic: /true/i.test(row.isPublic) };
                }
                setsToCreate[title].flashcards.push({ front: row.front, back: row.back });
            }
        }

        // Use a batch write for efficiency
        const batch = adminDb.batch();
        let setsCreatedCount = 0;

        for (const title in setsToCreate) {
            const newSetRef = adminDb.collection('flashcardSets').doc();
            batch.set(newSetRef, {
                userId: userId,
                profileId: profileId,
                title,
                flashcards: setsToCreate[title].flashcards.map(card => ({
                    ...card,
                    mlData: { easinessFactor: 2.5, interval: 0, repetitions: 0, nextReviewDate: new Date() }
                })),
                isPublic: setsToCreate[title].isPublic,
                source: 'CSV',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
            setsCreatedCount++;
        }

        await batch.commit();

        return NextResponse.json({ message: `${setsCreatedCount} set(s) imported successfully.` });

    } catch (error) {
        console.error('[IMPORT_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
