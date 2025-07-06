import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FlashcardSet from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import StudyAnalytics from '@/models/StudyAnalytics';
import { calculateSM2 } from '@/lib/sm2';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { setId, cardId, quality } = await req.json();
    if (!setId || !cardId || quality === undefined) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    await dbConnect();

    const set = await FlashcardSet.findById(setId);
    if (!set) return new NextResponse('Set not found', { status: 404 });

    const profile = await Profile.findById(set.profile);
    if (profile?.user.toString() !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const card = set.flashcards.id(cardId);
    if (!card) return new NextResponse('Card not found in set', { status: 404 });

    // --- Spaced Repetition Logic ---
    card.mlData = calculateSM2({ ...card.mlData, quality });
    await set.save();

    // --- Analytics Logging Logic ---
    let analytics = await StudyAnalytics.findOne({ profile: profile._id, set: setId });
    if (!analytics) {
      analytics = new StudyAnalytics({ profile: profile._id, set: setId });
    }

    let cardPerf = analytics.cardPerformance.find(p => p.cardId.toString() === cardId);
    if (!cardPerf) {
      analytics.cardPerformance.push({ cardId, correctCount: 0, incorrectCount: 0 });
      cardPerf = analytics.cardPerformance[analytics.cardPerformance.length - 1];
    }

    if (quality >= 3) {
      cardPerf.correctCount += 1;
    } else {
      cardPerf.incorrectCount += 1;
    }

    // Recalculate overall set accuracy
    const totalCorrect = analytics.cardPerformance.reduce((sum, p) => sum + p.correctCount, 0);
    const totalIncorrect = analytics.cardPerformance.reduce((sum, p) => sum + p.incorrectCount, 0);
    const totalAttempts = totalCorrect + totalIncorrect;
    const newAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    
    analytics.setPerformance.averageScore = newAccuracy;
    
    // Add a new entry to performance history
    analytics.performanceHistory.push({ date: new Date(), accuracy: newAccuracy });

    await analytics.save();

    return NextResponse.json(card);

  } catch (error) {
    console.error('REVIEW_CARD_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
