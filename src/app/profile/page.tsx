'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Mail, User } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField } from '@/components/ui/InputField';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [cafes, setCafes] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch('/api/users/me', { credentials: 'include' });
      const payload = await response.json();
      if (response.ok) {
        setUser(payload.user);
        setName(payload.user.name);
        setCafes(payload.cafes || []);
      }
    };

    void loadProfile();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to update profile');
      setUser(payload.user);
      setMessage('Profile updated successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f6d7c3] text-[#c85d2b]">
              <User size={18} />
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.18em] text-[#8f6a5f]">Profile</div>
              <h1 className="text-2xl font-black text-[#2d1b16]">{user?.name || 'Your account'}</h1>
            </div>
          </div>

          <div className="space-y-3 text-sm text-[#5f463d]">
            <div className="flex items-center gap-2"><Mail size={15} className="text-[#c85d2b]" /> {user?.email}</div>
            <div className="flex items-center gap-2"><CalendarDays size={15} className="text-[#c85d2b]" /> Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</div>
          </div>

          <div className="space-y-4 pt-4">
            <InputField label="Name" value={name} onChange={(event) => setName(event.target.value)} />
            <Button className="w-full" disabled={saving} onClick={() => void saveProfile()}>{saving ? 'Saving...' : 'Update profile'}</Button>
            {message && <p className="text-sm text-[#4b362f]">{message}</p>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-[#2d1b16]">Submitted cafes</h2>
            <div className="mt-4 space-y-3">
              {cafes.length > 0 ? cafes.map((cafe) => (
                <div key={cafe._id} className="rounded-xl border border-[#f0e4d6] bg-[#fffdfb] p-3">
                  <div className="font-semibold text-[#2d1b16]">{cafe.name}</div>
                  <div className="text-sm text-[#5f463d]">{cafe.locality} · {cafe.city}</div>
                </div>
              )) : <p className="text-sm text-[#5f463d]">No cafe submissions yet.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-[#2d1b16]">Notification preferences</h2>
            <div className="mt-4 space-y-3 text-sm text-[#5f463d]">
              <label className="flex items-center gap-3"><input type="checkbox" defaultChecked /> Cafe submission updates</label>
              <label className="flex items-center gap-3"><input type="checkbox" defaultChecked /> Offer alerts</label>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
