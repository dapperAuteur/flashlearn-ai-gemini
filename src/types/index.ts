import { Timestamp } from 'firebase/firestore';

// Basic Flashcard structure
export interface IFlashcard {
  id: string; // The document ID
  front: string;
  back: string;
  mlData: {
    easinessFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: Date | Timestamp; // Can be a Date object or Firestore Timestamp
  };
}

// Document structure for the 'flashcardSets' collection in Firestore
export interface IFlashcardSet {
  id: string; // The document ID
  userId: string;
  profileId: string;
  title: string;
  isPublic: boolean;
  source: 'Prompt' | 'PDF' | 'YouTube' | 'Audio' | 'Image' | 'CSV' | 'Text' | 'Video';
  flashcards: IFlashcard[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Document structure for the 'users' collection in Firestore
export interface IUserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  zipCode: string;
  phoneNumber?: string;
  image?: string;
  subscriptionTier: 'Free' | 'Lifetime Learner';
  createdAt: Date | Timestamp;
}

// Document structure for the 'studyAnalytics' collection
export interface IStudyAnalytics {
    id: string;
    userId: string;
    profileId: string;
    setId: string;
    set: { title: string }; // Populated data
    setPerformance: {
        averageScore: number;
        totalStudySessions: number;
        totalTimeStudied: number;
        lastSessionStarted: Date | Timestamp;
    };
    cardPerformance: {
        cardId: string;
        correctCount: number;
        incorrectCount: number;
    }[];
    performanceHistory: {
        date: Date | Timestamp;
        accuracy: number;
    }[];
}

export interface ISessionResult {
  cardId: string;
  correct: boolean;
}
