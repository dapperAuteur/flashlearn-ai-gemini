import { Schema, model, models, Document } from 'mongoose';

// Interface for individual card performance
interface ICardPerformance {
  cardId: Schema.Types.ObjectId;
  correctCount: number;
  incorrectCount: number;
}

// Interface for the overall set performance
interface ISetPerformance {
  totalStudySessions: number;
  totalTimeStudied: number; // in seconds
  averageScore: number;
  lastSessionStarted: Date;
}

// Interface for the main StudyAnalytics document
export interface IStudyAnalytics extends Document {
  profile: Schema.Types.ObjectId;
  set: Schema.Types.ObjectId & { title: string };
  cardPerformance: ICardPerformance[];
  setPerformance: ISetPerformance;
  performanceHistory: {
    date: Date;
    accuracy: number;
  }[];
}

const StudyAnalyticsSchema = new Schema<IStudyAnalytics>({
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  set: {
    type: Schema.Types.ObjectId,
    ref: 'FlashcardSet',
    required: true,
  },
  cardPerformance: [{
    cardId: { type: Schema.Types.ObjectId, required: true },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
  }],
  setPerformance: {
    totalStudySessions: { type: Number, default: 0 },
    totalTimeStudied: { type: Number, default: 0 }, // This will now be updated
    averageScore: { type: Number, default: 0 },
    lastSessionStarted: { type: Date, default: () => new Date(0) },
  },
  performanceHistory: [{
      date: { type: Date, required: true },
      accuracy: { type: Number, required: true },
  }]
}, { timestamps: true });

export default models.StudyAnalytics || model<IStudyAnalytics>('StudyAnalytics', StudyAnalyticsSchema);
