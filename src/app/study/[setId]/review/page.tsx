/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { StudySession } from '@/components/study/StudySession';
import Link from 'next/link';

// Define a type for our Firestore flashcard set documents
interface FlashcardSetDocument {
  id: string;
  title: string;
  userId: string;
  flashcards: any[];
}

export default function ReviewSetPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const setId = params.setId as string;

    const [set, setSet] = useState<FlashcardSetDocument | null>(null);
    const [dueCards, setDueCards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            router.push(`/auth/signin?callbackUrl=/study/${setId}/review`);
            return;
        }

        if (setId) {
            const fetchAndFilterSet = async () => {
                try {
                    const setRef = doc(db, 'flashcardSets', setId);
                    const docSnap = await getDoc(setRef);

                    if (docSnap.exists() && docSnap.data().userId === user.uid) {
                        const setData = { id: docSnap.id, ...docSnap.data() } as FlashcardSetDocument;
                        setSet(setData);

                        // Filter for due cards
                        const now = new Date();
                        const filteredCards = setData.flashcards.filter(card => {
                            const nextReviewDate = (card.mlData.nextReviewDate as Timestamp).toDate();
                            return nextReviewDate <= now;
                        });
                        
                        const augmentedCards = filteredCards.map(card => ({ ...card, setId: setData.id }));
                        setDueCards(augmentedCards);

                    } else {
                        setError("Set not found or you don't have permission to view it.");
                    }
                } catch (err) {
                    console.error(err);
                    setError("Failed to load the study set.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAndFilterSet();
        }
    }, [setId, user, isAuthLoading, router]);

    if (isAuthLoading || isLoading) {
        return <div className="text-center py-12">Loading Review Session...</div>;
    }

    if (error) {
        return <div className="text-center py-12 text-red-500">{error}</div>;
    }

    if (dueCards.length === 0) {
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
                Reviewing: {set?.title}
            </h1>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
                {dueCards.length} card{dueCards.length > 1 ? 's' : ''} due
            </p>
            <StudySession initialCards={dueCards} sessionTitle={`Reviewing: ${set?.title}`} />
        </div>
    );
}
