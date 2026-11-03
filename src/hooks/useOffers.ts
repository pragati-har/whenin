'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export type Offer = {
  _id: string;
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

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const payload = await apiFetch<{ success: boolean; data: Offer[] }>('/api/offers');
        setOffers(payload.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load offers');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  return { offers, loading, error };
}
