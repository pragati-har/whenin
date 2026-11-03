'use client';

import { useState } from 'react';
import { MailCheck, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OfferCard } from '@/components/offers/OfferCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useOffers } from '@/hooks/useOffers';

export default function OffersPage() {
  const { offers, loading } = useOffers();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>('');

  const sendOfferNotification = async () => {
    if (!selectedOffer) return;
    setSending(true);
    setResult('');

    try {
      const response = await fetch('/api/notifications/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          offerId: selectedOffer._id,
          cafeName: selectedOffer.cafeName || 'Featured cafe',
          offerTitle: selectedOffer.title,
          discount: selectedOffer.discountDetails,
          terms: selectedOffer.terms,
          validity: `${new Date(selectedOffer.validFrom).toLocaleDateString()} - ${new Date(selectedOffer.validUntil).toLocaleDateString()}`,
          link: `${window.location.origin}/offers`,
        }),
      });
      const payload = await response.json();
      setResult(payload.message || 'Notification request processed.');
      if (!response.ok) throw new Error(payload.message || 'Failed');
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[#8f6a5f]">Dine-in Offers</p>
          <h1 className="text-3xl font-black text-[#2d1b16]">Fresh deals from nearby cafes</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0e6] px-3 py-2 text-sm font-medium text-[#c85d2b]">
          <Sparkles size={16} />
          {offers.filter((offer) => offer.isActive !== false).length} active offers
        </div>
      </div>

      {loading ? (
        <Card>Loading offers...</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <div key={offer._id} className="space-y-3">
              <OfferCard offer={offer} />
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setSelectedOffer(offer);
                  setResult('');
                }}
              >
                Notify Me
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(selectedOffer)} title="Offer notification" onClose={() => setSelectedOffer(null)}>
        {selectedOffer && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#f9f3ee] p-4">
              <div className="text-sm uppercase tracking-[0.15em] text-[#8f6a5f]">{selectedOffer.cafeName}</div>
              <h3 className="mt-2 text-xl font-semibold text-[#2d1b16]">{selectedOffer.title}</h3>
              <p className="mt-2 text-sm text-[#5f463d]">{selectedOffer.discountDetails}</p>
            </div>

            <label className="block text-sm font-medium text-[#2d1b16]">
              <span className="mb-2 block">Recipient email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#e7d9cf] bg-white px-3 py-2.5 outline-none focus:border-[#c85d2b] focus:ring-2 focus:ring-[#f3d3bd]"
                placeholder="your@email.com"
              />
            </label>

            {result && <p className="text-sm text-[#4b362f]">{result}</p>}

            <Button className="w-full" disabled={sending || !email} onClick={() => void sendOfferNotification()} icon={<MailCheck size={16} />}>
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
