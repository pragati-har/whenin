export type NotificationSocketPayload = {
  _id: string;
  userId: string;
  type: 'cafe-submission' | 'offer';
  title: string;
  message: string;
  cafeId?: string;
  offerId?: string;
  readAt: string | null;
  createdAt: string;
};

type SocketServer = {
  to(room: string): {
    emit(event: string, payload: NotificationSocketPayload): void;
  };
};

declare global {
  var whenInSocket: SocketServer | undefined;
}

export function emitUserNotification(userId: string, notification: NotificationSocketPayload) {
  if (!globalThis.whenInSocket) {
    console.warn('Socket.IO server is unavailable; notification was persisted for later retrieval.');
    return;
  }

  globalThis.whenInSocket.to(`user:${userId}`).emit('user-notification', notification);
}
