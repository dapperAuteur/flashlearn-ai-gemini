import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';

// This endpoint fetches all flashcards that are due for review.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await dbConnect();

    // Find all profiles belonging to the user
    const userProfiles = await Profile.find({ user: session.user.id });
    const profileIds = userProfiles.map(p => p._id);

    // Find all sets linked to those profiles
    const sets = await FlashcardSet.find({ profile: { $in: profileIds } });

    const now = new Date();
    const dueCards = [];

    // Iterate through sets and their flashcards to find due ones
    for (const set of sets) {
      for (const card of set.flashcards) {
        if (card.mlData.nextReviewDate <= now) {
          // Augment the card data with its parent set's ID and title
          dueCards.push({
            ...card.toObject(),
            setId: set._id,
            setTitle: set.title,
          });
        }
      }
    }

    // Sort due cards by their review date, oldest first
    dueCards.sort((a, b) => new Date(a.mlData.nextReviewDate).getTime() - new Date(b.mlData.nextReviewDate).getTime());

    return NextResponse.json(dueCards);

  } catch (error) {
    console.error('GET_DUE_CARDS_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
