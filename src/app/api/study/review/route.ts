/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/firebase-admin';
import { calculateSM2 } from '@/lib/sm2';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (!token) return new NextResponse('Unauthorized', { status: 401 });

        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const { setId, cardId, quality } = await req.json();
        if (!setId || !cardId || quality === undefined) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        const setRef = adminDb.collection('flashcardSets').doc(setId);
        const setDoc = await setRef.get();

        if (!setDoc.exists) return new NextResponse('Set not found', { status: 404 });
        
        const setData = setDoc.data()!;
        if (setData.userId !== userId) return new NextResponse('Forbidden', { status: 403 });

        const cardIndex = setData.flashcards.findIndex((c: any) => c._id === cardId);
        if (cardIndex === -1) return new NextResponse('Card not found', { status: 404 });
        
        const card = setData.flashcards[cardIndex];
        const newMlData = calculateSM2({
            ...card.mlData,
            nextReviewDate: card.mlData.nextReviewDate.toDate(),
            quality,
        });

        const updatedFlashcards = [...setData.flashcards];
        updatedFlashcards[cardIndex].mlData = newMlData;
        
        await setRef.update({
            flashcards: updatedFlashcards,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Placeholder for analytics update logic
        // ...

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error('REVIEW_CARD_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
