import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IOffer extends Document {
  cafeId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  discountDetails: string;
  terms: string;
  validFrom: Date;
  validUntil: Date;
  applicableDays: string[];
  minimumOrderAmount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    cafeId: { type: Schema.Types.ObjectId, ref: 'Cafe', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    discountDetails: { type: String, required: true },
    terms: { type: String, required: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    applicableDays: { type: [String], default: [] },
    minimumOrderAmount: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

offerSchema.index({ cafeId: 1, isActive: 1, validUntil: 1 });

export const Offer: Model<IOffer> = mongoose.models.Offer || mongoose.model<IOffer>('Offer', offerSchema);
