import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';

// GET handler (as fixed before)
export async function GET(
  _request: NextRequest,
  { params }: { params: { setId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { setId } = params;
    await dbConnect();
    const set = await FlashcardSet.findById(setId);
    if (!set) return new NextResponse('Flashcard set not found.', { status: 404 });

    const setProfile = await Profile.findById(set.profile);
    if (!setProfile || setProfile.user.toString() !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    return NextResponse.json(set);
  } catch (error) {
    console.error('[GET_FLASHCARD_SET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT handler for updating a flashcard set
export async function PUT(
  request: NextRequest,
  { params }: { params: { setId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { setId } = await params;
    const { title, flashcards } = await request.json();

    if (!title || !flashcards || !Array.isArray(flashcards)) {
        return new NextResponse('Title and flashcards array are required', { status: 400 });
    }

    await dbConnect();

    const set = await FlashcardSet.findById(setId);
    if (!set) {
        return new NextResponse('Set not found', { status: 404 });
    }

    // Verify ownership
    const profile = await Profile.findById(set.profile);
    if (profile?.user.toString() !== session.user.id) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // Update the set
    set.title = title;
    set.flashcards = flashcards; // Replace the entire array of flashcards
    await set.save();

    return NextResponse.json(set);

  } catch (error) {
    console.error('[UPDATE_FLASHCARD_SET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
