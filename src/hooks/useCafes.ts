'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export type CafeSummary = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  locality: string;
  city: string;
  cuisine: string;
  averagePriceForTwo: number;
  images: string[];
  rating?: number;
  featured?: boolean;
  createdAt?: string;
};

export function useCafes(search = '', page = 1, limit = 10, city = '', cuisine = '') {
  const [cafes, setCafes] = useState<CafeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ page: String(page), limit: String(limit), search, city, cuisine });
        const payload = await apiFetch<{ success: boolean; pagination: typeof pagination; data: CafeSummary[] }>(`/api/cafes?${query.toString()}`, {
          signal: controller.signal,
        });
        setCafes(payload.data || []);
        setPagination(payload.pagination || { ...pagination, currentPage: page });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cafes');
      } finally {
        setLoading(false);
      }
    };

    void run();
    return () => controller.abort();
  }, [search, page, limit, city, cuisine]);

  return { cafes, loading, error, pagination };
}
