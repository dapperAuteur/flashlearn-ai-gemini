/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/firebase';
import { IFlashcard, ISessionResult } from '@/types';

function StudyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setId = searchParams.get('setId');

  const [user, loadingAuth] = useAuthState(auth);
  const [dueCards, setDueCards] = useState<IFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<ISessionResult[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Fetch due flashcards
  const fetchDueCards = useCallback(async () => {
    if (!user || !setId) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/flashcards/due?setId=${setId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch due cards.');
      const data = await response.json();
      setDueCards(data);
      if (data.length > 0) {
        setSessionStartTime(Date.now());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, setId]);

  useEffect(() => {
    if (!loadingAuth && user) {
      fetchDueCards();
    } else if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, fetchDueCards, router]);

  // Handle user's answer
  const handleAnswer = (correct: boolean) => {
    const card = dueCards[currentCardIndex];
    setSessionResults([...sessionResults, { cardId: card.id, correct }]);

    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      setIsSessionComplete(true);
    }
  };

  // Submit results when session is complete
  const submitResults = useCallback(async () => {
    if (!user || !setId || !sessionStartTime) return;
    const sessionTime = Math.round((Date.now() - sessionStartTime) / 1000); // in seconds
    try {
      const token = await user.getIdToken();
      // Submit granular review data
      await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ setId, reviewResults: sessionResults }),
      });
      // Submit overall session analytics
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ setId, sessionResults, sessionTime }),
      });
    } catch (err) {
      console.error("Failed to submit results:", err);
      // Handle submission error if needed
    }
  }, [user, setId, sessionResults, sessionStartTime]);

  useEffect(() => {
    if (isSessionComplete) {
      submitResults();
    }
  }, [isSessionComplete, submitResults]);

  if (isLoading || loadingAuth) return <div className="text-center p-8">Loading Study Session...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  
  if (isSessionComplete) {
    const correctCount = sessionResults.filter(r => r.correct).length;
    const totalCount = sessionResults.length;
    return (
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold mb-4">Session Complete!</h1>
        <p className="text-xl mb-6">You scored {correctCount} out of {totalCount} ({totalCount > 0 ? ((correctCount/totalCount)*100).toFixed(0) : 0}%)</p>
        <button onClick={() => router.push(`/sets/${setId}/preview`)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
          Back to Set
        </button>
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">You&apos;re all caught up!</h1>
        <p className="mb-6">There are no cards due for review in this set right now.</p>
        <button onClick={() => router.push(`/sets/${setId}/preview`)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
          Back to Set
        </button>
      </div>
    );
  }

  const currentCard = dueCards[currentCardIndex];

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-2xl mb-4">
        <p className="text-lg font-medium text-gray-600">Card {currentCardIndex + 1} of {dueCards.length}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((currentCardIndex + 1) / dueCards.length) * 100}%` }}></div>
        </div>
      </div>

      <div 
        className="w-full max-w-2xl h-80 flex items-center justify-center text-center p-6 bg-white rounded-lg shadow-lg cursor-pointer perspective"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`transition-transform duration-500 w-full h-full preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute w-full h-full backface-hidden flex items-center justify-center">
            <p className="text-2xl font-semibold">{currentCard.front}</p>
          </div>
          <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center">
            <p className="text-xl">{currentCard.back}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 w-full max-w-2xl">
        {!isFlipped ? (
          <button onClick={() => setIsFlipped(true)} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600">
            Flip Card
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleAnswer(false)} className="bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600">
              Incorrect
            </button>
            <button onClick={() => handleAnswer(true)} className="bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600">
              Correct
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Use Suspense to handle client-side rendering of components that use searchParams
export default function StudyPage() {
    return (
        <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
            <StudyPageContent />
        </Suspense>
    );
}
