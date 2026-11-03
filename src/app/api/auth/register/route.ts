import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { signToken } from '@/lib/auth';
import { databaseErrorResponse, isDuplicateKeyError } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { sanitizeUser } from '@/lib/users';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Name, email and password are required.' }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  let stage = 'database connection';

  try {
    await connectDB();
    stage = 'duplicate-account lookup';
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'An account already exists with that email.' }, { status: 409 });
    }

    stage = 'password hashing';
    const passwordHash = await bcrypt.hash(password, 10);
    stage = 'user insert';
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      notificationPreferences: { cafeSubmission: true, offerAlerts: true },
    });

    stage = 'JWT signing';
    const token = signToken({ userId: newUser._id.toString(), email: newUser.email, name: newUser.name });
    stage = 'response creation';
    const response = NextResponse.json({ success: true, user: sanitizeUser(newUser) });
    response.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ success: false, message: 'An account already exists with that email.' }, { status: 409 });
    }
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ success: false, message: 'Name, email and password are required.' }, { status: 400 });
    }
    return databaseErrorResponse(error, `User registration during ${stage}`);
  }
}
