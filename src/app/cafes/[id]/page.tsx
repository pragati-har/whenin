'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { MapPin, Star } from 'lucide-react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';

function CafeDetailContent() {
  const params = useParams<{ id: string }>();
  const [cafe, setCafe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCafe = async () => {
      const response = await fetch(`/api/cafes/${params.id}`, { credentials: 'include' });
      const payload = await response.json();
      if (response.ok) setCafe(payload.cafe);
      setLoading(false);
    };

    if (params?.id) void loadCafe();
  }, [params]);

  if (loading) return <AppShell><div className="text-[#5f463d]">Loading cafe details...</div></AppShell>;
  if (!cafe) return <AppShell><div className="text-[#5f463d]">Cafe not found.</div></AppShell>;

  return (
    <AppShell>
      <div className="overflow-hidden rounded-[28px] border border-[#f0e4d6] bg-white shadow-sm">
        <div className="relative h-80 w-full">
          <Image
            src={cafe.images?.[0] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'}
            alt={cafe.name}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-[#8f6a5f]">{cafe.cuisine}</div>
              <h1 className="mt-2 text-3xl font-black text-[#2d1b16]">{cafe.name}</h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0e6] px-3 py-2 text-sm font-medium text-[#c85d2b]">
              <Star size={14} fill="currentColor" />
              {cafe.rating || 4.5}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <p className="text-[#5f463d]">{cafe.description}</p>
              <div className="flex items-center gap-2 text-sm text-[#5f463d]">
                <MapPin size={15} className="text-[#c85d2b]" />
                {cafe.address}, {cafe.locality}, {cafe.city}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f9f3ee] p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#8f6a5f]">Pricing</div>
                  <div className="mt-2 font-semibold text-[#2d1b16]">₹{cafe.averagePriceForTwo || 800} for two</div>
                </div>
                <div className="rounded-xl bg-[#f9f3ee] p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#8f6a5f]">Opening hours</div>
                  <div className="mt-2 font-semibold text-[#2d1b16]">{cafe.openingHours}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-[#f0e4d6] bg-[#fffaf5] p-4">
              <div className="text-sm uppercase tracking-[0.18em] text-[#8f6a5f]">Quick facts</div>
              <div className="space-y-2 text-sm text-[#5f463d]">
                <div><span className="font-medium text-[#2d1b16]">Locality:</span> {cafe.locality}</div>
                <div><span className="font-medium text-[#2d1b16]">City:</span> {cafe.city}</div>
                <div><span className="font-medium text-[#2d1b16]">Contact:</span> {cafe.contactNumber || 'Not verified'}</div>
                <div><span className="font-medium text-[#2d1b16]">Submission source:</span> {cafe.submissionSource || 'Community'}</div>
              </div>
              <Link href="/dashboard"><Button variant="secondary" className="mt-3 w-full">Back to discovery</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function CafeDetailPage() {
  return (
    <Suspense fallback={<AppShell><div className="text-[#5f463d]">Loading cafe details...</div></AppShell>}>
      <CafeDetailContent />
    </Suspense>
  );
}
