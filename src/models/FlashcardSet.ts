import { Schema, model, models, Document } from 'mongoose';

// Interface for the embedded Flashcard document
export interface IFlashcard {
  front: string;
  back: string;
  // ML data for spaced repetition
  mlData: {
    easinessFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: Date;
  };
}

// Interface for the FlashcardSet document
export interface IFlashcardSet extends Document {
  profile: Schema.Types.ObjectId;
  title: string;
  isPublic: boolean;
  source: 'Prompt' | 'PDF' | 'YouTube' | 'Audio' | 'Image' | 'CSV';
  flashcards: IFlashcard[];
}

const FlashcardSchema = new Schema<IFlashcard>({
  front: {
    type: String,
    required: true,
    trim: true,
  },
  back: {
    type: String,
    required: true,
    trim: true,
  },
  mlData: {
    easinessFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    nextReviewDate: { type: Date, default: Date.now },
  },
});

const FlashcardSetSchema = new Schema<IFlashcardSet>({
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  source: {
    type: String,
    enum: ['Prompt', 'PDF', 'YouTube', 'Audio', 'Image', 'CSV'],
    default: 'Prompt',
  },
  flashcards: [FlashcardSchema], // Embedding flashcards
}, { timestamps: true });

export default models.FlashcardSet || model<IFlashcardSet>('FlashcardSet', FlashcardSetSchema);
