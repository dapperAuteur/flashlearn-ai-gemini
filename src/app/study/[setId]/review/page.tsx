/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import FlashcardSet, { IFlashcardSet, IFlashcard } from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import { StudySession } from '@/components/study/StudySession';
import Link from 'next/link';

type AugmentedFlashcard = IFlashcard & { setId: string };

// This function fetches the data on the server
async function getDueCardsForSet(setId: string, userId: string): Promise<{set: IFlashcardSet, dueCards: AugmentedFlashcard[]} | null> {
    try {
        await dbConnect();
        const set = await FlashcardSet.findById(setId);
        if (!set) return null;

        const profile = await Profile.findById(set.profile);
        if (profile?.user.toString() !== userId) {
            return null; // User does not own this set
        }

        const now = new Date();
        const dueCards = set.flashcards
            .filter((card: { mlData: { nextReviewDate: string | number | Date; }; }) => new Date(card.mlData.nextReviewDate) <= now)
            .map((card: any) => ({ ...JSON.parse(JSON.stringify(card)), setId: set._id.toString() }));
            
        return { set: JSON.parse(JSON.stringify(set)), dueCards };
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { setId: string } }): Promise<Metadata> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { title: 'Review Set' };
    
    const data = await getDueCardsForSet(params.setId, session.user.id);
    return {
        title: data ? `Reviewing: ${data.set.title}` : 'Set not found',
    };
}


export default async function ReviewSetPage({ params }: { params: { setId: string } }) {
    const session = await getServerSession(authOptions);
    const { setId } = await params;

    if (!session?.user?.id) {
        redirect(`/auth/signin?callbackUrl=/study/${setId}/review`);
    }

    const data = await getDueCardsForSet(setId, session.user.id);

    if (!data) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcard Set Not Found</h1>
                <p className="text-gray-600 dark:text-gray-400">This set may not exist or you may not have permission to view it.</p>
            </div>
        );
    }

    if (data.dueCards.length === 0) {
        return (
             <div className="text-center py-12 mx-auto max-w-lg">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Caught Up!</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">You have no cards due for review in this set. Great job!</p>
                 <div className="mt-6">
                    <Link 
                        href="/dashboard"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-center mb-2 text-gray-900 dark:text-white">
                Reviewing: {data.set.title}
            </h1>
             <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
                {data.dueCards.length} card{data.dueCards.length > 1 ? 's' : ''} due
            </p>
            <StudySession initialCards={data.dueCards} sessionTitle={`Reviewing: ${data.set.title}`} />
        </div>
    );
}
