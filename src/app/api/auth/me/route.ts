import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/auth';
import { databaseErrorResponse } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { sanitizeUser } from '@/lib/users';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  if (!mongoose.isValidObjectId(payload.userId)) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ success: false, user: null }, { status: 401 });
    return NextResponse.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return databaseErrorResponse(error, 'Current-user lookup');
  }
}
