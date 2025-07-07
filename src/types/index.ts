import { Timestamp } from 'firebase/firestore';

// Basic Flashcard structure
export interface IFlashcardBasic {
  id: string; // The document ID
  front: string;
  back: string;
}

// Complete Flashcard structure
export interface IFlashcard {
  id: string; // The document ID
  _id: string; // The document ID
  front: string;
  back: string;
  mlData: {
    easinessFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: Date | Timestamp; // Can be a Date object or Firestore Timestamp
  };
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Document structure for the 'flashcardSets' collection in Firestore
export interface IFlashcardSet {
  id: string; // The document ID
  _id: string; // The document ID
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
  id?: string; // The document ID
  firstName: string;
  lastName: string;
  email: string;
  zipCode: string;
  phoneNumber?: string;
  image?: string;
  subscriptionTier: 'Free' | 'Lifetime Learner';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
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
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
}

export interface ISessionResult {
  cardId: string;
  correct: boolean;
}

// This interface represents a raw flashcard as it's stored embedded within a set in Firestore.
// It likely uses `_id` and lacks its own timestamps.
export interface RawFirestoreCard {
  _id: string;
  front: string;
  back: string;
  mlData: {
    easinessFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: Timestamp;
  };
}

// This interface represents the complete flashcard set document fetched from Firestore.
export interface StudySetDocument {
  id: string;
  title: string;
  userId: string;
  flashcards: RawFirestoreCard[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}