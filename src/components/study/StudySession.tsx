'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { IFlashcardSet } from '@/models/FlashcardSet';

type Props = {
  flashcardSet: IFlashcardSet;
};

export const StudySession = ({ flashcardSet }: Props) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = useMemo(() => {
    return flashcardSet.flashcards[currentCardIndex];
  }, [currentCardIndex, flashcardSet.flashcards]);

  const goToNextCard = useCallback(() => {
    // Ensure the next card starts on its front face
    if (isFlipped) {
      setIsFlipped(false);
      // Add a small delay to allow the card to flip back before changing content
      setTimeout(() => {
        setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcardSet.flashcards.length);
      }, 250);
    } else {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcardSet.flashcards.length);
    }
  }, [isFlipped, flashcardSet.flashcards.length]);

  const goToPreviousCard = useCallback(() => {
    // Ensure the next card starts on its front face
    if (isFlipped) {
      setIsFlipped(false);
      // Add a small delay to allow the card to flip back before changing content
      setTimeout(() => {
        if (currentCardIndex === 0) {
          setCurrentCardIndex(flashcardSet.flashcards.length - 1);
        } else {
          setCurrentCardIndex((prevIndex) => (prevIndex - 1) % flashcardSet.flashcards.length);
        }
      }, 250);
    } else {
      if (currentCardIndex === 0) {
          setCurrentCardIndex(flashcardSet.flashcards.length - 1);
        } else {
          setCurrentCardIndex((prevIndex) => (prevIndex - 1) % flashcardSet.flashcards.length);
        }
    }
  }, [isFlipped, flashcardSet.flashcards.length, currentCardIndex]);

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent default browser action (scrolling)
        flipCard();
      } else if (event.code === 'ArrowRight') {
        goToNextCard();
      } else if (event.code === 'ArrowLeft') {
        goToPreviousCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [flipCard, goToNextCard, goToPreviousCard]);

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Add a style block for the 3D transform utilities */}
      <style>{`
        .perspective {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}</style>
      
      {/* Progress Indicator */}
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
        Card {currentCardIndex + 1} of {flashcardSet.flashcards.length}
      </p>

      {/* Flippable Card */}
      <div
        className="w-full max-w-2xl h-80 perspective"
        onClick={flipCard}
      >
        <div
          className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front of the card */}
          <div className="absolute w-full h-full backface-hidden flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6">
            <p className="text-2xl text-center text-gray-900 dark:text-white">{currentCard.front}</p>
          </div>
          {/* Back of the card */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-lg p-6">
            <p className="text-xl text-center text-gray-900 dark:text-white">{currentCard.back}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full max-w-2xl justify-around">
        <button
          onClick={goToPreviousCard}
          className="rounded-full bg-green-500/20 text-green-700 dark:text-green-400 px-8 py-4 text-lg font-bold hover:bg-green-500/30 transition-colors"
        >
          Left
        </button>
        <button
          onClick={goToNextCard}
          className="rounded-full bg-red-500/20 text-red-700 dark:text-red-400 px-8 py-4 text-lg font-bold hover:bg-red-500/30 transition-colors"
        >
          Wrong
        </button>
        <button
          onClick={goToNextCard}
          className="rounded-full bg-green-500/20 text-green-700 dark:text-green-400 px-8 py-4 text-lg font-bold hover:bg-green-500/30 transition-colors"
        >
          Right
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="pt-4 text-sm text-center text-gray-500 dark:text-gray-400">
        <p>
          <strong>Pro-tip:{' '}
            <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">&larr;</kbd>{' '}
          to go to the previous card.
          </strong> Use{' '}
          <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
            Space
          </kbd>{' '}
          to flip and{' '}
          <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">&rarr;</kbd>{' '}
          to go to the next card.
        </p>
      </div>
    </div>
  );
};
