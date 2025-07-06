import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import StudyAnalytics from '@/models/StudyAnalytics';
import Profile from '@/models/Profile';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    await dbConnect();

    const userProfiles = await Profile.find({ user: session.user.id });
    const profileIds = userProfiles.map(p => p._id);

    // Find all analytics documents for the user's profiles and populate the set title
    const analytics = await StudyAnalytics.find({ profile: { $in: profileIds } })
      .populate('set', 'title') // This joins the 'set' field and retrieves the 'title'
      .sort({ updatedAt: -1 });

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('GET_ANALYTICS_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
