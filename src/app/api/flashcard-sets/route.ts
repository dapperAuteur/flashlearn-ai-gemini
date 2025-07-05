import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import User from '@/models/User';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { title, flashcards } = await req.json();

    if (!title || !flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return new NextResponse('Title and flashcards are required', { status: 400 });
    }

    await dbConnect();

    // Find the user's first profile, or create a default one if none exists.
    let userProfile = await Profile.findOne({ user: session.user.id });

    if (!userProfile) {
      userProfile = new Profile({
        user: session.user.id,
        profileName: 'Default Profile', // Create a default profile name
      });
      await userProfile.save();

      // Also link this new profile back to the user document
      await User.findByIdAndUpdate(session.user.id, {
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
