import { UserNotification } from '@/models/UserNotification';
import { emitUserNotification, type NotificationSocketPayload } from '@/lib/socket';

type CreateUserNotificationInput = {
  userId: string;
  type: NotificationSocketPayload['type'];
  title: string;
  message: string;
  cafeId?: string;
  offerId?: string;
};

export async function createUserNotification(input: CreateUserNotificationInput) {
  const notification = await UserNotification.create(input);
  const payload: NotificationSocketPayload = {
    _id: notification._id.toString(),
    userId: notification.userId.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    ...(notification.cafeId ? { cafeId: notification.cafeId.toString() } : {}),
    ...(notification.offerId ? { offerId: notification.offerId.toString() } : {}),
    readAt: notification.readAt?.toISOString() || null,
    createdAt: notification.createdAt.toISOString(),
  };

  emitUserNotification(input.userId, payload);
  return payload;
}
