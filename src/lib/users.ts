import type { IUser } from '@/models/User';

export function sanitizeUser(user: IUser) {
  return {
    id: user._id.toString(),
    _id: user._id,
    name: user.name,
    email: user.email,
    notificationPreferences: user.notificationPreferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
