import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import { calculateSM2 } from '@/lib/sm2';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { setId, cardId, quality } = await req.json();

    if (!setId || !cardId || quality === undefined) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    await dbConnect();

    // Find the set and verify ownership
    const set = await FlashcardSet.findById(setId);
    if (!set) {
      return new NextResponse('Set not found', { status: 404 });
    }

    const profile = await Profile.findById(set.profile);
    if (profile?.user.toString() !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Find the specific card within the set
    const card = set.flashcards.id(cardId);
    if (!card) {
      return new NextResponse('Card not found in set', { status: 404 });
    }

    // Calculate the new SM2 data
    const updatedMlData = calculateSM2({
      ...card.mlData,
      quality,
    });

    // Update the card's mlData
    card.mlData = updatedMlData;

    // Save the entire set document
    await set.save();

    return NextResponse.json(card);

  } catch (error) {
    console.error('REVIEW_CARD_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
