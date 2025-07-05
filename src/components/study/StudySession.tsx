/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { IFlashcard } from '@/models/FlashcardSet';
import { useRouter } from 'next/navigation';

// The component now accepts a more generic list of cards.
// Each card object must be augmented with its parent set's ID.
type AugmentedFlashcard = IFlashcard & { setId: string; _id: string };

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

  const currentCard = useMemo(() => {
    return cards[currentCardIndex];
  }, [currentCardIndex, cards]);

  const handleReview = useCallback(async (quality: number) => {
    if (isSubmitting || !currentCard) return;
    setIsSubmitting(true);

    const goToNextCard = () => {
      if (currentCardIndex >= cards.length - 1) {
        // End of session, navigate back to dashboard
        router.push('/dashboard');
        return;
      }

      if (isFlipped) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentCardIndex((prevIndex) => prevIndex + 1);
        }, 250);
      } else {
        setCurrentCardIndex((prevIndex) => prevIndex + 1);
      }
    };

    try {
      await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId: currentCard.setId,
          cardId: currentCard._id,
          quality,
        }),
      });
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
      goToNextCard();
    }
  }, [isSubmitting, currentCard, cards, currentCardIndex, isFlipped, router]);

  
  
  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setIsFlipped((prev) => !prev);
      }
      if (event.code === 'ArrowLeft') {
        handleReview(1); // Wrong
      }
      if (event.code === 'ArrowRight') {
        handleReview(5); // Right
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleReview]);


  if (!currentCard) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Complete!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Great work! You&apos;ve reviewed all the cards.</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                Back to Dashboard
            </button>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <style>{`
        .perspective { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
      `}</style>
      
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
        {sessionTitle}
      </p>
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Card {currentCardIndex + 1} of {cards.length}
      </p>

      <div
        className="w-full max-w-2xl h-80 perspective cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          <div className="absolute w-full h-full backface-hidden flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6">
            <p className="text-2xl text-center text-gray-900 dark:text-white">{currentCard.front}</p>
          </div>
          <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-lg p-6">
            <p className="text-xl text-center text-gray-900 dark:text-white">{currentCard.back}</p>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-2xl justify-around">
        <button
          onClick={() => handleReview(1)} // Quality 1 for "Wrong"
          disabled={isSubmitting}
          className="rounded-full bg-red-500/20 text-red-700 dark:text-red-400 px-8 py-4 text-lg font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? '...' : 'Wrong'}
        </button>
        <button
          onClick={() => handleReview(5)} // Quality 5 for "Right"
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
