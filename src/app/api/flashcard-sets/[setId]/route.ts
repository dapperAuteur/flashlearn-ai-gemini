import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import User from '@/models/User';

// GET handler (remains the same)
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

// PUT handler for updating a flashcard set (now includes isPublic)
export async function PUT(
  request: NextRequest,
  { params }: { params: { setId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { setId } = params;
    const { title, flashcards, isPublic } = await request.json();

    if (!title || !flashcards || !Array.isArray(flashcards) || isPublic === undefined) {
        return new NextResponse('Title, flashcards array, and isPublic status are required', { status: 400 });
    }

    await dbConnect();
    const set = await FlashcardSet.findById(setId);
    if (!set) return new NextResponse('Set not found', { status: 404 });

    const profile = await Profile.findById(set.profile);
    if (profile?.user.toString() !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

    set.title = title;
    set.flashcards = flashcards;
    set.isPublic = isPublic;
    await set.save();

    return NextResponse.json(set);

  } catch (error) {
    console.error('[UPDATE_FLASHCARD_SET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE handler for "soft deleting" a set
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { setId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    try {
        const { setId } = params;
        await dbConnect();
        
        const set = await FlashcardSet.findById(setId);
        if (!set) return new NextResponse('Set not found', { status: 404 });

        // Verify ownership before deleting
        const profile = await Profile.findById(set.profile);
        if (profile?.user.toString() !== session.user.id) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Instead of deleting, we disassociate the set from the user's profile
        // This makes it "deleted" from the user's library but keeps it for public access if needed.
        await FlashcardSet.findByIdAndUpdate(setId, { $unset: { profile: "" } });
        
        // Also remove it from the user's profile array for consistency
        await User.findOneAndUpdate({ _id: session.user.id }, { $pull: { profiles: profile._id } });

        return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion

    } catch (error) {
        console.error('[DELETE_FLASHCARD_SET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
