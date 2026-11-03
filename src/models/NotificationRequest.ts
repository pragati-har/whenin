import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface INotificationRequest extends Document {
  recipientEmail: string;
  userId?: mongoose.Types.ObjectId;
  cafeId?: mongoose.Types.ObjectId;
  offerId?: mongoose.Types.ObjectId;
  notificationType: 'offer' | 'cafe-submission';
  status: 'pending' | 'sent' | 'failed';
  resendMessageId?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationRequestSchema = new Schema<INotificationRequest>(
  {
    recipientEmail: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    cafeId: { type: Schema.Types.ObjectId, ref: 'Cafe' },
    offerId: { type: Schema.Types.ObjectId, ref: 'Offer' },
    notificationType: { type: String, enum: ['offer', 'cafe-submission'], required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    resendMessageId: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

notificationRequestSchema.index({ recipientEmail: 1, status: 1 });

export const NotificationRequest: Model<INotificationRequest> =
  mongoose.models.NotificationRequest || mongoose.model<INotificationRequest>('NotificationRequest', notificationRequestSchema);
