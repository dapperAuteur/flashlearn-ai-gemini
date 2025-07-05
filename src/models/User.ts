import { Schema, model, models, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string; // Password is required but will be handled by auth provider
  role: 'Student' | 'Admin';
  profiles: Schema.Types.ObjectId[];
  stripeCustomerId?: string;
  subscriptionTier: 'Free' | 'Lifetime Learner';
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    // Password is not always required, e.g., for OAuth providers
    required: false,
  },
  role: {
    type: String,
    enum: ['Student', 'Admin'],
    default: 'Student',
  },
  profiles: [{
    type: Schema.Types.ObjectId,
    ref: 'Profile',
  }],
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true,
  },
  subscriptionTier: {
    type: String,
    enum: ['Free', 'Lifetime Learner'],
    default: 'Free',
  },
}, { timestamps: true });

export default models.User || model<IUser>('User', UserSchema);
