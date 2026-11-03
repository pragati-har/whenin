import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IEmailLog extends Document {
  recipient: string;
  subject: string;
  emailType: 'cafe-submission-confirmation' | 'new-cafe-notification' | 'offer-notification' | 'welcome';
  provider: string;
  providerMessageId?: string;
  status: 'queued' | 'sent' | 'failed';
  errorCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    emailType: { type: String, required: true },
    provider: { type: String, default: 'resend' },
    providerMessageId: { type: String },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
    errorCode: { type: String },
  },
  { timestamps: true },
);

export const EmailLog: Model<IEmailLog> = mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', emailLogSchema);
