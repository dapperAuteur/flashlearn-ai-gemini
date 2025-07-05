/* eslint-disable @typescript-eslint/no-unused-vars */
// import { NextRequest, NextResponse } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';

type RouteContext = {
  params: { setId: string };
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { setId } = params;
    await dbConnect();

    // First, find the flashcard set by its ID
    const set = await FlashcardSet.findById(setId);

    if (!set) {
      return new NextResponse('Flashcard set not found', { status: 404 });
    }

    // Next, verify that the set belongs to the logged-in user.
    // Find the profile associated with the set.
    const setProfile = await Profile.findById(set.profile);

    // Check if the profile's user ID matches the session's user ID.
    // The 'toString()' is important to compare the ObjectId correctly.
    if (setProfile?.user.toString() !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    return NextResponse.json(set);

  } catch (error) {
    console.error('GET_SINGLE_SET_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}