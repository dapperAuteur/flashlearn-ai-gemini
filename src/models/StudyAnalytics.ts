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
  lastSessionStarted: Date; // New field to track sessions
}

// Interface for the main StudyAnalytics document
export interface IStudyAnalytics extends Document {
  profile: Schema.Types.ObjectId;
  set: Schema.Types.ObjectId & { title: string }; // Populate set title
  cardPerformance: ICardPerformance[];
  setPerformance: ISetPerformance;
  // This will store historical performance data for charts
  performanceHistory: {
    date: Date;
    accuracy: number; // Percentage
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
    totalTimeStudied: { type: Number, default: 0 }, // Not yet implemented, but here for future use
    averageScore: { type: Number, default: 0 },
    lastSessionStarted: { type: Date, default: () => new Date(0) }, // Default to epoch
  },
  performanceHistory: [{
      date: { type: Date, required: true },
      accuracy: { type: Number, required: true },
  }]
}, { timestamps: true });

export default models.StudyAnalytics || model<IStudyAnalytics>('StudyAnalytics', StudyAnalyticsSchema);
