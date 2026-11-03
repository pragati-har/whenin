import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { databaseErrorResponse } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { UserNotification } from '@/models/UserNotification';

const notificationUpdateSchema = z.union([
  z.object({ notificationId: z.string().refine(mongoose.isValidObjectId) }),
  z.object({ markAllRead: z.literal(true) }),
]);

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 401 });
  }
  if (!mongoose.isValidObjectId(payload.userId)) {
    return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 401 });
  }

  try {
    await connectDB();
    const [notifications, unreadCount] = await Promise.all([
      UserNotification.find({ userId: payload.userId }).sort({ createdAt: -1 }).limit(50).lean(),
      UserNotification.countDocuments({ userId: payload.userId, readAt: { $exists: false } }),
    ]);
    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    return databaseErrorResponse(error, 'Notification history lookup');
  }
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 401 });
  }
  if (!mongoose.isValidObjectId(payload.userId)) {
    return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid notification update.' }, { status: 400 });
  }

  const parsed = notificationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Provide a valid notification ID or markAllRead.' }, { status: 400 });
  }

  try {
    await connectDB();
    if ('markAllRead' in parsed.data) {
      await UserNotification.updateMany(
        { userId: payload.userId, readAt: { $exists: false } },
        { $set: { readAt: new Date() } },
      );
    } else {
      const notification = await UserNotification.findOneAndUpdate(
        { _id: parsed.data.notificationId, userId: payload.userId },
        { $set: { readAt: new Date() } },
        { new: true },
      );
      if (!notification) {
        return NextResponse.json({ success: false, message: 'Notification not found.' }, { status: 404 });
      }
    }

    const unreadCount = await UserNotification.countDocuments({
      userId: payload.userId,
      readAt: { $exists: false },
    });
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    return databaseErrorResponse(error, 'Notification update');
  }
}
