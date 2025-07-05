import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Profile from '@/models/Profile';
import FlashcardSet, { IFlashcard } from '@/models/FlashcardSet';
import { StudySession } from '@/components/study/StudySession';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Review Due Cards',
  description: 'Study the flashcards that are due for review.',
};

type AugmentedFlashcard = IFlashcard & { setId: string };

// Fetches only the cards that are due for review for a specific user
async function getDueCards(userId: string): Promise<AugmentedFlashcard[]> {
    await dbConnect();
    const userProfiles = await Profile.find({ user: userId });
    if (userProfiles.length === 0) return [];

    const profileIds = userProfiles.map(p => p._id);
    const sets = await FlashcardSet.find({ profile: { $in: profileIds } });

    const now = new Date();
    const dueCards: AugmentedFlashcard[] = [];

    for (const set of sets) {
        for (const card of set.flashcards) {
            if (new Date(card.mlData.nextReviewDate) <= now) {
                // Important: Augment the card with its parent set ID
                dueCards.push({ ...JSON.parse(JSON.stringify(card)), setId: set._id.toString() });
            }
        }
    }

    // Sort due cards by their review date, oldest first
    dueCards.sort((a, b) => new Date(a.mlData.nextReviewDate).getTime() - new Date(b.mlData.nextReviewDate).getTime());

    return dueCards;
}


export default async function DueStudyPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect(`/auth/signin?callbackUrl=/study/due`);
    }

    const dueCards = await getDueCards(session.user.id);

    if (dueCards.length === 0) {
        return (
            <div className="text-center py-12 mx-auto max-w-lg">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Caught Up!</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">You have no cards due for review right now. Great job!</p>
                 <div className="mt-6">
                    <Link 
                        href="/dashboard"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-center mb-8 text-gray-900 dark:text-white">
                Review Session
            </h1>
            <StudySession initialCards={dueCards} sessionTitle="Review Due Cards" />
        </div>
    );
}
