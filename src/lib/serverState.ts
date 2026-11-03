export type ServerCafe = {
  _id: string;
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
  featured?: boolean;
  submissionSource?: 'seed' | 'user';
  submittedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ServerOffer = {
  _id: string;
  cafeId: string;
  cafeName?: string;
  title: string;
  description: string;
  discountDetails: string;
  terms: string;
  validFrom: string;
  validUntil: string;
  applicableDays: string[];
  minimumOrderAmount?: number;
  isActive?: boolean;
};
