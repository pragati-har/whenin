'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField } from '@/components/ui/InputField';

export default function SubmitCafePage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    locality: '',
    city: 'Pune',
    cuisine: '',
    averagePriceForTwo: '800',
    openingHours: '',
    contactNumber: '',
    imageUrl: '',
  });
  const [notifyMe, setNotifyMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          averagePriceForTwo: Number(form.averagePriceForTwo),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to submit cafe');

      setMessage(payload.message || 'Cafe submitted successfully.');
      if (notifyMe) {
        const offerResponse = await fetch('/api/notifications/cafe-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: 'notifications@whenin.local',
            cafeName: form.name,
            cafeId: payload.cafe?._id,
          }),
        });
        if (!offerResponse.ok) {
          setMessage('Cafe submitted. Notification request queued.');
        }
      }
      setForm({
        name: '',
        description: '',
        address: '',
        locality: '',
        city: 'Pune',
        cuisine: '',
        averagePriceForTwo: '800',
        openingHours: '',
        contactNumber: '',
        imageUrl: '',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit cafe');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.18em] text-[#8f6a5f]">Suggest a Cafe</p>
          <h1 className="text-3xl font-black text-[#2d1b16]">Add a place worth discovering</h1>
        </div>

        <Card className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Cafe name" value={form.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="Example: The Bean House" />
            <InputField label="Cuisine" value={form.cuisine} onChange={(event) => handleChange('cuisine', event.target.value)} placeholder="Italian, Cafe..." />
          </div>

          <label className="block w-full text-sm font-medium text-[#2d1b16]">
            <span className="mb-2 block">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => handleChange('description', event.target.value)}
              className="min-h-28 w-full rounded-xl border border-[#e7d9cf] bg-white px-3 py-2.5 outline-none focus:border-[#c85d2b] focus:ring-2 focus:ring-[#f3d3bd]"
              placeholder="Tell people what makes this place special"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Address" value={form.address} onChange={(event) => handleChange('address', event.target.value)} placeholder="12 Market Road" />
            <InputField label="Locality" value={form.locality} onChange={(event) => handleChange('locality', event.target.value)} placeholder="Baner" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="City" value={form.city} onChange={(event) => handleChange('city', event.target.value)} placeholder="Pune" />
            <InputField label="Average price for two" type="number" value={form.averagePriceForTwo} onChange={(event) => handleChange('averagePriceForTwo', event.target.value)} placeholder="1000" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Opening hours" value={form.openingHours} onChange={(event) => handleChange('openingHours', event.target.value)} placeholder="9:00 AM - 10:00 PM" />
            <InputField label="Contact number (optional)" value={form.contactNumber} onChange={(event) => handleChange('contactNumber', event.target.value)} placeholder="+91 9988776655" />
          </div>

          <InputField label="Image URL (optional)" value={form.imageUrl} onChange={(event) => handleChange('imageUrl', event.target.value)} placeholder="https://example.com/image.jpg" />

          <label className="flex items-center gap-3 rounded-xl bg-[#f8f0eb] p-3 text-sm text-[#4b362f]">
            <input type="checkbox" checked={notifyMe} onChange={(event) => setNotifyMe(event.target.checked)} />
            Notify me when my cafe submission is added to WHEN IN.
          </label>

          {message && (
            <div className="flex items-center gap-2 rounded-xl bg-[#effaf3] px-3 py-2 text-sm text-[#0f5132]">
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}

          <Button className="w-full" disabled={submitting} onClick={() => void submit()}>
            {submitting ? 'Submitting...' : 'Submit Cafe'}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
