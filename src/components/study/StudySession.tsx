'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  // State to manage the feedback animation
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const currentCard = useMemo(() => {
    return cards[currentCardIndex];
  }, [currentCardIndex, cards]);

  const progressPercentage = useMemo(() => {
    return ((currentCardIndex + 1) / cards.length) * 100;
  }, [currentCardIndex, cards.length]);

  const handleReview = useCallback(async (quality: number) => {
    if (isSubmitting || !currentCard) return;
    setIsSubmitting(true);
    setFeedback(quality >= 3 ? 'correct' : 'incorrect');

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
      // Wait for animation to finish before moving to the next card
      setTimeout(() => {
        setIsSubmitting(false);
        setFeedback(null);
        goToNextCard();
      }, 700);
    }
  }, [isSubmitting, currentCard]);

  const goToNextCard = () => {
    if (currentCardIndex >= cards.length - 1) {
      router.push('/dashboard');
      return;
    }
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex((prev) => prev + 1), 250);
    } else {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setIsFlipped((prev) => !prev);
      }
      if (event.code === 'ArrowLeft') handleReview(1);
      if (event.code === 'ArrowRight') handleReview(5);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReview]);

  if (!currentCard) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Complete!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Great work! You've reviewed all the cards.</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                Back to Dashboard
            </button>
        </div>
    );
  }

  // Determine animation class based on feedback state
  const feedbackAnimationClass = feedback === 'correct' ? 'animate-flashCorrect' : feedback === 'incorrect' ? 'animate-flashIncorrect' : '';

  return (
    <div className="flex flex-col items-center space-y-6">
      <style>{`
        .perspective { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
      `}</style>
      
      {/* Progress Bar and Counter */}
      <div className="w-full max-w-2xl">
        <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-indigo-700 dark:text-white">Progress</span>
            <span className="text-sm font-medium text-indigo-700 dark:text-white">Card {currentCardIndex + 1} of {cards.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      {/* Flippable Card */}
      <div
        className="w-full max-w-2xl h-80 perspective cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''} ${feedbackAnimationClass}`}
        >
          <div className={`absolute w-full h-full backface-hidden flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6 transition-all duration-300 ${isFlipped ? 'shadow-indigo-500/50' : ''}`}>
            <p className="text-2xl text-center text-gray-900 dark:text-white">{currentCard.front}</p>
          </div>
          <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-lg p-6">
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
