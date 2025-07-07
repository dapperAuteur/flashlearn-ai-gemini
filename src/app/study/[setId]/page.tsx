/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { StudySession, AugmentedFlashcard } from '@/components/study/StudySession';
import { RawFirestoreCard, StudySetDocument } from '@/types';

export default function StudyPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const setId = params.setId as string;

    const [set, setSet] = useState<StudySetDocument | null>(null);
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
                        const data = { id: docSnap.id, ...docSnap.data() } as StudySetDocument;
                        setSet(data);
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

    // Transform the raw card data into the shape expected by the StudySession component.
    // This includes mapping _id to id, converting Timestamps, and adding parent set data.
    const augmentedCards: AugmentedFlashcard[] = set.flashcards.map((card) => ({
        ...card,
        id: card._id, // Map _id to id
        setId: set.id,
        mlData: {
            ...card.mlData,
            nextReviewDate: card.mlData.nextReviewDate.toDate(),
        },
        // Add timestamps from the parent set, as embedded cards don't have their own
        createdAt: set.createdAt,
        updatedAt: set.updatedAt,
    }));

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-center mb-8 text-gray-900 dark:text-white">{set.title}</h1>
            <StudySession initialCards={augmentedCards} sessionTitle={set.title} />
        </div>
    );
}