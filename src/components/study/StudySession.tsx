/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { IFlashcard } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

type AugmentedFlashcard = IFlashcard & { setId: string };

type Props = {
  initialCards: AugmentedFlashcard[];
  sessionTitle: string;
};

export const StudySession = ({ initialCards, sessionTitle }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<AugmentedFlashcard[]>(initialCards);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [feedbackColor, setFeedbackColor] = useState('');
  
  // Use a ref to store the start time to prevent re-renders
  const startTimeRef = useRef<number>(Date.now());

  const currentCard = useMemo(() => {
    return cards[currentCardIndex];
  }, [currentCardIndex, cards]);

  const progressPercentage = useMemo(() => {
    return ((currentCardIndex) / cards.length) * 100;
  }, [currentCardIndex, cards.length]);

  // This function will be called when the session ends
  const logSessionDuration = useCallback(async () => {
    const durationInSeconds = (Date.now() - startTimeRef.current) / 1000;
    // We only need to log duration for the set, not every card
    const setId = initialCards[0]?.setId;
    if (setId && durationInSeconds > 2) { // Only log meaningful sessions
        try {
            await fetch('/api/analytics/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setId, durationInSeconds }),
            });
        } catch (error) {
            console.error("Failed to log session duration:", error);
        }
    }
  }, [initialCards]);

  const goToNextCard = useCallback(() => {
    if (currentCardIndex >= cards.length - 1) {
      logSessionDuration();
      router.push('/dashboard');
      return;
    }
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex((prev) => prev + 1), 250);
    } else {
      setCurrentCardIndex((prev) => prev + 1);
    }
  }, [currentCardIndex, cards.length, isFlipped, logSessionDuration, router]);

  const handleReview = useCallback(async (quality: number) => {
    if (isSubmitting || !currentCard) return;
    setIsSubmitting(true);

    if (quality >= 3) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      setFeedbackColor('bg-green-100 dark:bg-green-900/60');
    } else {
      setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      setFeedbackColor('bg-red-100 dark:bg-red-900/60');
    }

    try {
      const token = await user?.getIdToken();
      await fetch('/api/study/review', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
         },
        body: JSON.stringify({
          setId: currentCard.setId,
          cardId: currentCard.id,
          quality,
        }),
      });
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setFeedbackColor('');
        goToNextCard();
      }, 700);
    }
  }, [isSubmitting, currentCard, user, goToNextCard]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') { event.preventDefault(); setIsFlipped((prev) => !prev); }
      if (event.code === 'ArrowLeft') handleReview(1);
      if (event.code === 'ArrowRight') handleReview(5);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReview]);

  // Log duration if user navigates away or closes tab
  useEffect(() => {
      return () => {
          logSessionDuration();
      };
  }, [logSessionDuration]);

  if (!currentCard) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Complete!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Final Score: {score.correct} / {cards.length}</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                Back to Dashboard
            </button>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <style>{`
        .perspective { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
      `}</style>
      
      {/* Progress Bar and Counter */}
      <div className="w-full max-w-2xl">
        <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-indigo-700 dark:text-white">Score: {score.correct} / {score.correct + score.incorrect}</span>
            <span className="text-sm font-medium text-indigo-700 dark:text-white">Card {currentCardIndex + 1} of {cards.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      {/* Flippable Card */}
      <div
        className="w-full max-w-2xl h-80 perspective cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front of the card */}
          <div className={`absolute w-full h-full backface-hidden flex items-center justify-center rounded-lg shadow-lg p-6 transition-colors duration-300 ${feedbackColor || 'bg-white dark:bg-gray-800'}`}>
            <p className="text-2xl text-center text-gray-900 dark:text-white">{currentCard.front}</p>
          </div>
          {/* Back of the card */}
          <div className={`absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center rounded-lg shadow-lg p-6 transition-colors duration-300 ${feedbackColor || 'bg-white dark:bg-gray-700'}`}>
            <p className="text-xl text-center text-gray-900 dark:text-white">{currentCard.back}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full max-w-2xl justify-around">
        <button
          onClick={() => handleReview(1)}
          disabled={isSubmitting}
          className="rounded-full bg-red-500/20 text-red-700 dark:text-red-400 px-8 py-4 text-lg font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '...' : 'Wrong'}
        </button>
        <button
          onClick={() => handleReview(5)}
          disabled={isSubmitting}
          className="rounded-full bg-green-500/20 text-green-700 dark:text-green-400 px-8 py-4 text-lg font-bold hover:bg-green-500/30 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '...' : 'Right'}
        </button>
      </div>
       <div className="text-sm text-gray-500 dark:text-gray-400">
        Use <kbd className="font-mono p-1 bg-gray-200 dark:bg-gray-700 rounded-md">Spacebar</kbd> to flip, and <kbd className="font-mono p-1 bg-gray-200 dark:bg-gray-700 rounded-md">←</kbd> <kbd className="font-mono p-1 bg-gray-200 dark:bg-gray-700 rounded-md">→</kbd> arrows to answer.
      </div>
    </div>
  );
};
