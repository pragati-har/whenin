import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { databaseErrorResponse } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { Cafe } from '@/models/Cafe';
import { User } from '@/models/User';
import { sanitizeUser } from '@/lib/users';

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  notificationPreferences: z.object({
    cafeSubmission: z.boolean().optional(),
    offerAlerts: z.boolean().optional(),
  }).optional(),
});

function unauthorized() {
  return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 401 });
}

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
    return unauthorized();
  }
  if (!mongoose.isValidObjectId(payload.userId)) return unauthorized();

  try {
    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    const cafes = await Cafe.find({ submittedBy: user._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, user: sanitizeUser(user), cafes });
  } catch (error) {
    return databaseErrorResponse(error, 'Profile lookup');
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
    return unauthorized();
  }
  if (!mongoose.isValidObjectId(payload.userId)) return unauthorized();

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid profile update.' }, { status: 400 });
  }
  const parsed = profileSchema.safeParse(requestBody);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid profile update.' }, { status: 400 });
  }

  const updates: Record<string, string | boolean> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.notificationPreferences?.cafeSubmission !== undefined) {
    updates['notificationPreferences.cafeSubmission'] = parsed.data.notificationPreferences.cafeSubmission;
  }
  if (parsed.data.notificationPreferences?.offerAlerts !== undefined) {
    updates['notificationPreferences.offerAlerts'] = parsed.data.notificationPreferences.offerAlerts;
  }

  try {
    await connectDB();
    const user = await User.findByIdAndUpdate(
      payload.userId,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!user) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    return NextResponse.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return databaseErrorResponse(error, 'Profile update');
  }
}
