/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/firebase';
import Link from 'next/link';

// Define the types for our data structures
interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  flashcards: Flashcard[];
}

export default function PreviewSetPage() {
  const router = useRouter();
  const params = useParams();
  const setId = params.setId as string;

  const [user, loadingAuth] = useAuthState(auth);
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the flashcard set data
  const fetchSet = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/flashcard-sets/${setId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flashcard set. You may not have permission.');
      }
      const data = await response.json();
      setSet(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, setId]);

  useEffect(() => {
    if (!loadingAuth && user) {
      fetchSet();
    } else if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, fetchSet, router]);

  if (isLoading || loadingAuth) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!set) {
    return <div className="text-center p-8">Flashcard set not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">{set.title}</h1>
          <p className="text-gray-600 mt-1">{set.description}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/study/due?setId=${set.id}`} passHref>
            <button className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700">
              Study Due Cards
            </button>
          </Link>
          <Link href={`/sets/${set.id}/edit`} passHref>
             <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
              Edit Set
            </button>
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Flashcards in this Set ({set.flashcards.length})</h2>
        <div className="space-y-4">
          {set.flashcards.map((card, index) => (
            <div key={card.id || index} className="p-4 border rounded-lg shadow-sm bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-800">Q: {card.question}</p>
                </div>
                <div>
                  <p className="text-gray-600">A: {card.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
