import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';

/**
 * This route handles fetching a single, specific flashcard set.
 * It ensures that only the user who owns the set can access it.
 */
export async function GET(
  // The first argument is the request object, which we don't need for this GET request.
  // We can use the standard 'Request' type.
  _request: Request,
  // The second argument contains the dynamic route parameters.
  { params }: { params: { setId: string } }
) {
  try {
    // 1. Authenticate the user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Validate the incoming parameters
    const { setId } = params;
    if (!setId) {
      return new NextResponse('Flashcard Set ID is required.', { status: 400 });
    }

    // 3. Connect to the database
    await dbConnect();

    // 4. Fetch the requested flashcard set
    const set = await FlashcardSet.findById(setId);
    if (!set) {
      return new NextResponse('Flashcard set not found.', { status: 404 });
    }

    // 5. Verify that the logged-in user owns this set
    // Find the profile associated with the set to check its owner
    const setProfile = await Profile.findById(set.profile);

    // If the profile doesn't exist or its user ID doesn't match the session user's ID, deny access.
    if (!setProfile || setProfile.user.toString() !== session.user.id) {
      return new NextResponse('Forbidden: You do not have permission to access this set.', { status: 403 });
    }

    // 6. If all checks pass, return the flashcard set data
    return NextResponse.json(set);

  } catch (error) {
    // Log any unexpected errors for debugging
    console.error('[GET_FLASHCARD_SET_BY_ID]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
