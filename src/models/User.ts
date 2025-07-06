import { Schema, model, models, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  zipCode: string;
  phoneNumber?: string;
  image?: string; // Field for profile image URL
  password?: string;
  role: 'Student' | 'Admin';
  profiles: Schema.Types.ObjectId[];
  stripeCustomerId?: string;
  subscriptionTier: 'Free' | 'Lifetime Learner';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  zipCode: { type: String, required: true, trim: true },
  phoneNumber: { type: String, trim: true },
  image: { type: String }, // URL from Cloudinary
  password: { type: String, required: false },
  role: { type: String, enum: ['Student', 'Admin'], default: 'Student' },
  profiles: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
  stripeCustomerId: { type: String, unique: true, sparse: true },
  subscriptionTier: { type: String, enum: ['Free', 'Lifetime Learner'], default: 'Free' },
}, { timestamps: true });

export default models.User || model<IUser>('User', UserSchema);
