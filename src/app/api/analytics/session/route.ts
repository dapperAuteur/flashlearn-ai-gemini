import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import StudyAnalytics from '@/models/StudyAnalytics';
import Profile from '@/models/Profile';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    try {
        const { setId, durationInSeconds } = await req.json();
        if (!setId || durationInSeconds === undefined) {
            return new NextResponse('Set ID and duration are required.', { status: 400 });
        }

        await dbConnect();
        
        const profile = await Profile.findOne({ user: session.user.id });
        if (!profile) return new NextResponse('Profile not found', { status: 404 });

        const analytics = await StudyAnalytics.findOne({ profile: profile._id, set: setId });
        if (!analytics) {
            // This case is unlikely if a study session just happened, but good to handle.
            return new NextResponse('Analytics not found for this set.', { status: 404 });
        }

        // Add the duration of the completed session to the total
        analytics.setPerformance.totalTimeStudied += Math.round(durationInSeconds);
        await analytics.save();

        return NextResponse.json({ message: 'Session duration logged successfully.' });

    } catch (error) {
        console.error('[LOG_SESSION_DURATION_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
