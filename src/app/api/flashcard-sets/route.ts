import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import User from '@/models/User';

// GET handler to fetch all flashcard sets for a user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await dbConnect();

    // Find all profiles belonging to the user
    const userProfiles = await Profile.find({ user: session.user?.id });
    const profileIds = userProfiles.map(p => p._id);

    // Find all sets linked to those profiles
    const sets = await FlashcardSet.find({ profile: { $in: profileIds } }).sort({ createdAt: -1 });

    return NextResponse.json(sets);

  } catch (error) {
    console.error('GET_FLASHCARD_SETS_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


// POST handler to create a new flashcard set
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { title, flashcards } = await req.json();

    if (!title || !flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return new NextResponse('Title and flashcards are required', { status: 400 });
    }

    await dbConnect();

    // Find the user's first profile, or create a default one if none exists.
    let userProfile = await Profile.findOne({ user: session.user?.id });

    if (!userProfile) {
      userProfile = new Profile({
        user: session.user?.id,
        profileName: 'Default Profile', // Create a default profile name
      });
      await userProfile.save();

      // Also link this new profile back to the user document
      await User.findByIdAndUpdate(session.user?.id, {
        $push: { profiles: userProfile._id },
      });
    }

    const newSet = new FlashcardSet({
      profile: userProfile._id,
      title,
      flashcards,
      source: 'Prompt', // Since this comes from the AI generator
    });

    await newSet.save();

    return NextResponse.json(newSet, { status: 201 });

  } catch (error) {
    console.error('SAVE_FLASHCARD_SET_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
