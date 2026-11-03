'use client';

import Link from 'next/link';
import { Bell, Coffee, MapPinned, LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/hooks/useNotifications';
import { useState } from 'react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { logout, state } = useAuth();
  const { items, unreadCount, loading, error, markAsRead, markAllAsRead } = useNotifications(state.user?.id);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fffaf5] text-[#2d1b16]">
      <header className="border-b border-[#f3e3d8] bg-[#fffdfb]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-[#2d1b16]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6d7c3] text-[#c85d2b]">
              <Coffee size={18} />
            </div>
            <div>
              <div className="text-lg font-bold">WHEN IN</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#8f6a5f]">Discover your city</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#5f463d] md:flex">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/offers">Offers</Link>
            <Link href="/submit-cafe">Suggest a Cafe</Link>
            <Link href="/profile">Profile</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-[#f6f0ea] px-3 py-1.5 text-sm text-[#4b362f] md:flex">
              <MapPinned size={14} className="text-[#c85d2b]" />
              Pune
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative rounded-full bg-[#f6f0ea] p-2 text-[#c85d2b]"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c85d2b] px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#f0e4d6] bg-white p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-[#2d1b16]">Notifications</h2>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void markAllAsRead()}
                        className="text-xs font-medium text-[#c85d2b] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {loading && <p className="px-2 py-3 text-sm text-[#5f463d]">Loading notifications...</p>}
                  {error && <p className="px-2 py-2 text-xs text-red-700">{error}</p>}
                  {!loading && items.length === 0 && (
                    <p className="px-2 py-3 text-sm text-[#5f463d]">You are all caught up.</p>
                  )}
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {items.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          if (!item.readAt) void markAsRead(item._id);
                        }}
                        className={`block w-full rounded-xl px-3 py-2 text-left ${item.readAt ? 'bg-white' : 'bg-[#fff4ec]'}`}
                      >
                        <span className="block text-sm font-semibold text-[#2d1b16]">{item.title}</span>
                        <span className="mt-1 block text-xs text-[#5f463d]">{item.message}</span>
                        <span className="mt-1 block text-[10px] text-[#8f6a5f]">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="hidden text-sm text-[#4b362f] md:inline">{state.user?.name ?? 'Guest'}</span>
            <Link href="/profile" className="rounded-full border border-[#f0d6c7] p-2 text-[#2d1b16]">
              <UserCircle2 size={18} />
            </Link>
            <Button variant="ghost" onClick={() => void logout()} className="gap-1 px-3 py-2 text-sm">
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
