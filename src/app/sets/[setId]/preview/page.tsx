import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import FlashcardSet, { IFlashcardSet } from '@/models/FlashcardSet';
import Profile from '@/models/Profile';
import Link from 'next/link';

async function getFlashcardSet(setId: string, userId: string): Promise<IFlashcardSet | null> {
    try {
        await dbConnect();
        const set = await FlashcardSet.findById(setId);
        if (!set) return null;

        const profile = await Profile.findById(set.profile);
        if (profile?.user.toString() !== userId) return null;
        
        return JSON.parse(JSON.stringify(set));
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { setId: string } }): Promise<Metadata> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { title: 'Preview Set' };
    
    const set = await getFlashcardSet(params.setId, session.user.id);
    return {
        title: set ? `Previewing: ${set.title}` : 'Set not found',
    };
}

export default async function PreviewSetPage({ params }: { params: { setId: string } }) {
    const session = await getServerSession(authOptions);
    const { setId } = params;

    if (!session?.user?.id) {
        redirect(`/auth/signin?callbackUrl=/sets/${setId}/preview`);
    }

    const flashcardSet = await getFlashcardSet(setId, session.user.id);

    if (!flashcardSet) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flashcard Set Not Found</h1>
                <p className="text-gray-600 dark:text-gray-400">This set may not exist or you may not have permission to view it.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {flashcardSet.title}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {flashcardSet.flashcards.length} cards
                    </p>
                </div>
                <Link 
                    href={`/study/${flashcardSet._id}`}
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                    Study This Set
                </Link>
            </div>

            <div className="flow-root">
                <ul role="list" className="-my-8 divide-y divide-gray-200 dark:divide-gray-700">
                    {flashcardSet.flashcards.map((card, index) => (
                        <li key={card._id || index} className="py-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                <div>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">{card.front}</p>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <p className="text-lg text-gray-600 dark:text-gray-300">{card.back}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
