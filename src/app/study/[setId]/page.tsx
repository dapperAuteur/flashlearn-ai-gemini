/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { StudySession } from '@/components/study/StudySession';

// Define a type for our Firestore flashcard set documents
interface FlashcardSetDocument {
  id: string;
  title: string;
  userId: string;
  flashcards: any[];
}

export default function StudyPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const setId = params.setId as string;

    const [set, setSet] = useState<FlashcardSetDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            router.push(`/auth/signin?callbackUrl=/study/${setId}`);
            return;
        }

        if (setId) {
            const fetchSet = async () => {
                try {
                    const setRef = doc(db, 'flashcardSets', setId);
                    const docSnap = await getDoc(setRef);
                    if (docSnap.exists() && docSnap.data().userId === user.uid) {
                        setSet({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        setError("Set not found or you don't have permission to view it.");
                    }
                } catch (err) {
                    setError("Failed to load the study set.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSet();
        }
    }, [setId, user, isAuthLoading, router]);

    if (isAuthLoading || isLoading) return <div className="text-center py-12">Loading...</div>;
    if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
    if (!set) return null;

    const augmentedCards = set.flashcards.map((card: any) => ({ ...card, setId: set.id }));

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-center mb-8 text-gray-900 dark:text-white">{set.title}</h1>
            <StudySession initialCards={augmentedCards} sessionTitle={set.title} />
        </div>
    );
}