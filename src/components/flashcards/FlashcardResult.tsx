/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { IFlashcard } from '@/types';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

type Props = {
    flashcards: IFlashcard[],
    initialTitle: string,
    source: 'Audio' | 'Image' | 'Prompt' | 'PDF' | 'Text' | 'Video' | 'YouTube';
    onSaveSuccess: () => void
}

export const FlashcardResult = ({ flashcards, initialTitle, source, onSaveSuccess }: Props) => {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [setTitle, setSetTitle] = useState(initialTitle);

    const handleSaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError("You must be logged in to save a set.");
            return;
        }
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Find or create a default user profile in Firestore
            const profilesCollection = collection(db, 'users', user.uid, 'profiles');
            const q = query(profilesCollection, where("isDefault", "==", true));
            const querySnapshot = await getDocs(q);
            
            let profileId: string;

            if (querySnapshot.empty) {
                // No default profile, create one
                const newProfileRef = doc(profilesCollection);
                await setDoc(newProfileRef, {
                    profileName: 'Default Profile',
                    isDefault: true,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                });
                profileId = newProfileRef.id;
            } else {
                profileId = querySnapshot.docs[0].id;
            }

            // Add the new flashcard set to the top-level 'flashcardSets' collection
            await addDoc(collection(db, "flashcardSets"), {
                userId: user.uid,
                profileId: profileId,
                title: setTitle,
                flashcards: flashcards.map(card => ({
                    ...card,
                    // Initialize ML data for new cards
                    mlData: {
                        easinessFactor: 2.5,
                        interval: 0,
                        repetitions: 0,
                        nextReviewDate: new Date(),
                    }
                })),
                source: source,
                isPublic: false, // Default to private
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setSuccessMessage('Flashcard set saved successfully!');
            setTimeout(() => onSaveSuccess(), 2000);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred while saving.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (flashcards.length === 0) return null;

    return (
        <form onSubmit={handleSaveSubmit} className="space-y-6 animate-fade-in mt-8">
             {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert"><p>{error}</p></div>}
             {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md" role="alert"><p>{successMessage}</p></div>}

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generated Flashcards</h2>
            <div>
                <label htmlFor="setTitle" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">Set Title</label>
                <div className="mt-2">
                    <input id="setTitle" name="setTitle" type="text" value={setTitle} onChange={(e) => setSetTitle(e.target.value)} className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-indigo-600 dark:focus:ring-indigo-500" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashcards.map((card, index) => (
                    <div key={index} className="rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm p-6">
                        <p className="font-semibold text-gray-900 dark:text-white">{card.front}</p>
                        <hr className="my-4 border-gray-200 dark:border-gray-600" />
                        <p className="text-gray-600 dark:text-gray-300">{card.back}</p>
                    </div>
                ))}
            </div>
            <button type="submit" disabled={isSaving} className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Set'}</button>
        </form>
    );
};