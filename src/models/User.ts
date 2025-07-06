import { Schema, model, models, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  zipCode: string;
  phoneNumber?: string;
  password?: string;
  role: 'Student' | 'Admin';
  profiles: Schema.Types.ObjectId[];
  stripeCustomerId?: string;
  subscriptionTier: 'Free' | 'Lifetime Learner';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required.'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  zipCode: {
    type: String,
    required: [true, 'Zip code is required.'],
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
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
