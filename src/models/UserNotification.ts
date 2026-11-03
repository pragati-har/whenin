import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IUserNotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'cafe-submission' | 'offer';
  title: string;
  message: string;
  cafeId?: mongoose.Types.ObjectId;
  offerId?: mongoose.Types.ObjectId;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userNotificationSchema = new Schema<IUserNotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['cafe-submission', 'offer'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    cafeId: { type: Schema.Types.ObjectId, ref: 'Cafe' },
    offerId: { type: Schema.Types.ObjectId, ref: 'Offer' },
    readAt: { type: Date },
  },
  { timestamps: true },
);

userNotificationSchema.index({ userId: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, readAt: 1 });

export const UserNotification: Model<IUserNotification> =
  mongoose.models.UserNotification || mongoose.model<IUserNotification>('UserNotification', userNotificationSchema);
