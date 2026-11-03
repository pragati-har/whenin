'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { apiFetch } from '@/lib/api';

export type NotificationItem = {
  _id: string;
  type: 'cafe-submission' | 'offer';
  title: string;
  message: string;
  cafeId?: string;
  offerId?: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationResponse = {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
};

type NotificationFeed = {
  userId: string | null;
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
};

const emptyFeed = (userId: string | null): NotificationFeed => ({
  userId,
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
});

export function useNotifications(userId?: string | null) {
  const [feed, setFeed] = useState<NotificationFeed>(() => emptyFeed(null));

  useEffect(() => {
    if (!userId) return;

    let active = true;
    const liveNotifications = new Map<string, NotificationItem>();
    const socket = io({ withCredentials: true, autoConnect: false });
    const load = async () => {
      try {
        const payload = await apiFetch<NotificationResponse>('/api/notifications');
        if (!active) return;
        const fetchedIds = new Set(payload.data.map((item) => item._id));
        const merged = new Map(payload.data.map((item) => [item._id, item]));
        for (const [id, notification] of liveNotifications) merged.set(id, notification);
        const newerLiveUnread = [...liveNotifications.values()].filter(
          (item) => !item.readAt && !fetchedIds.has(item._id),
        ).length;
        setFeed({
          userId,
          items: [...merged.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 50),
          unreadCount: payload.unreadCount + newerLiveUnread,
          loading: false,
          error: null,
        });
      } catch (loadError) {
        if (active) {
          setFeed((previous) => ({
            ...(previous.userId === userId ? previous : emptyFeed(userId)),
            loading: false,
            error: loadError instanceof Error ? loadError.message : 'Failed to load notifications.',
          }));
        }
      }
    };

    socket.on('user-notification', (notification: NotificationItem) => {
      if (!active || !notification?._id) return;
      const alreadySeen = liveNotifications.has(notification._id);
      liveNotifications.set(notification._id, notification);
      setFeed((previous) => {
        const current = previous.userId === userId ? previous : emptyFeed(userId);
        const alreadyPresent = current.items.some((item) => item._id === notification._id);
        return {
          ...current,
          items: [
            notification,
            ...current.items.filter((item) => item._id !== notification._id),
          ].slice(0, 50),
          unreadCount: current.unreadCount + (!alreadySeen && !alreadyPresent && !notification.readAt ? 1 : 0),
        };
      });
    });
    socket.on('connect_error', () => {
      if (active) {
        setFeed((previous) => ({
          ...(previous.userId === userId ? previous : emptyFeed(userId)),
          loading: false,
          error: 'Live updates are unavailable. Notifications will still refresh when opened.',
        }));
      }
    });
    socket.on('connect', () => {
      void load();
    });
    socket.connect();

    void load();
    return () => {
      active = false;
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;
    try {
      const result = await apiFetch<{ success: boolean; unreadCount: number }>('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationId }),
      });
      setFeed((current) => current.userId !== userId ? current : {
        ...current,
        items: current.items.map((item) => (
          item._id === notificationId ? { ...item, readAt: new Date().toISOString() } : item
        )),
        unreadCount: result.unreadCount,
        error: null,
      });
    } catch (updateError) {
      setFeed((current) => current.userId !== userId ? current : {
        ...current,
        error: updateError instanceof Error ? updateError.message : 'Failed to update notification.',
      });
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      const result = await apiFetch<{ success: boolean; unreadCount: number }>('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAllRead: true }),
      });
      const readAt = new Date().toISOString();
      setFeed((current) => current.userId !== userId ? current : {
        ...current,
        items: current.items.map((item) => ({ ...item, readAt: item.readAt || readAt })),
        unreadCount: result.unreadCount,
        error: null,
      });
    } catch (updateError) {
      setFeed((current) => current.userId !== userId ? current : {
        ...current,
        error: updateError instanceof Error ? updateError.message : 'Failed to update notifications.',
      });
    }
  };

  const currentFeed = userId && feed.userId === userId ? feed : emptyFeed(userId || null);
  return {
    ...currentFeed,
    loading: Boolean(userId) && (feed.userId !== userId || feed.loading),
    markAsRead,
    markAllAsRead,
  };
}
