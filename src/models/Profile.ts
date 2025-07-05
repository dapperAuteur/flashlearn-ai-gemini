import { Schema, model, models, Document } from 'mongoose';

export interface IProfile extends Document {
  user: Schema.Types.ObjectId;
  profileName: string;
  learningGoals: string[];
  customStudyAlerts: string[];
}

const ProfileSchema = new Schema<IProfile>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  profileName: {
    type: String,
    required: true,
    trim: true,
  },
  learningGoals: {
    type: [String],
    validate: [(v: string[]) => v.length <= 3, 'A profile can have a maximum of 3 learning goals.'],
  },
  customStudyAlerts: {
    type: [String],
    validate: [(v: string[]) => v.length <= 3, 'A profile can have a maximum of 3 custom study alerts.'],
  },
}, { timestamps: true });

export default models.Profile || model<IProfile>('Profile', ProfileSchema);
