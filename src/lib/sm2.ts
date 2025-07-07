/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { IFlashcard } from "@/types";

// Interface for the input data required by the algorithm
interface SM2Input {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  quality: number; // User's assessment of their recall quality (0-5)
}

// Interface for the output data
interface SM2Output {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Implements the SM-2 spaced repetition algorithm.
 * @param {SM2Input} input - The current learning data for a card and the user's performance.
 * @returns {SM2Output} - The updated learning data for the card.
 */
export function calculateSM2(input: SM2Input): SM2Output {
  let { easinessFactor, interval, repetitions, quality } = input;

  // 1. Check the quality of the response.
  if (quality < 3) {
    // If the response quality is low, reset the learning process for this card.
    repetitions = 0;
    interval = 1;
  } else {
    // If the response quality is good:
    // 2. Update the easiness factor.
    easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easinessFactor < 1.3) {
      easinessFactor = 1.3; // The easiness factor should not be less than 1.3.
    }

    // 3. Update repetitions and interval.
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
  }

  // 4. Calculate the next review date.
  const now = new Date();
  const nextReviewDate = new Date(now.setDate(now.getDate() + interval));

  return {
    easinessFactor,
    interval,
    repetitions,
    nextReviewDate,
  };
}
