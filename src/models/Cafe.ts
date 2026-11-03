import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ICafe extends Document {
  name: string;
  slug: string;
  description: string;
  address: string;
  locality: string;
  city: string;
  cuisine: string;
  averagePriceForTwo: number;
  openingHours: string;
  contactNumber?: string;
  images: string[];
  rating?: number;
  featured: boolean;
  submissionSource: 'seed' | 'user';
  submittedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cafeSchema = new Schema<ICafe>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    cuisine: { type: String, required: true },
    averagePriceForTwo: { type: Number, required: true },
    openingHours: { type: String, required: true },
    contactNumber: { type: String },
    images: { type: [String], default: [] },
    rating: { type: Number, default: 4.4 },
    featured: { type: Boolean, default: false },
    submissionSource: { type: String, enum: ['seed', 'user'], default: 'seed' },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'cafes' },
);

cafeSchema.index({ city: 1, cuisine: 1, featured: 1, name: 1 });

if (mongoose.models.Cafe?.collection.name !== undefined && mongoose.models.Cafe.collection.name !== 'cafes') {
  mongoose.deleteModel('Cafe');
}

export const Cafe: Model<ICafe> = mongoose.models.Cafe || mongoose.model<ICafe>('Cafe', cafeSchema);
