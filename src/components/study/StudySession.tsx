/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { IFlashcard } from '@/models/FlashcardSet';
import { useRouter } from 'next/navigation';

type AugmentedFlashcard = IFlashcard & { setId: string };

type Props = {
  initialCards: AugmentedFlashcard[];
  sessionTitle: string;
};

export const StudySession = ({ initialCards, sessionTitle }: Props) => {
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
      await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: currentCard.setId, cardId: currentCard._id, quality }),
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
  }, [isSubmitting, currentCard]);

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
      {/* ... (rest of the JSX is the same as before) ... */}
    </div>
  );
};
