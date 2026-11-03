import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { databaseErrorResponse } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { Cafe } from '@/models/Cafe';
import { NotificationRequest } from '@/models/NotificationRequest';
import { User } from '@/models/User';

const schema = z.object({
  email: z.string().email(),
  cafeName: z.string().min(1),
  cafeId: z.string().optional(),
});

export async function POST(request: Request) {
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

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Valid submission details are required.' }, { status: 400 });
  }
  const parsed = schema.safeParse(requestBody);
  if (!parsed.success || (parsed.data.cafeId && !mongoose.isValidObjectId(parsed.data.cafeId))) {
    return NextResponse.json({ success: false, message: 'Valid submission details are required.' }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId).select('_id');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 401 });
    }

    if (parsed.data.cafeId) {
      const cafe = await Cafe.findById(parsed.data.cafeId).select('_id');
      if (!cafe) return NextResponse.json({ success: false, message: 'Cafe not found.' }, { status: 404 });
    }

    const { email, cafeName, cafeId } = parsed.data;
    const notification = await NotificationRequest.create({
      recipientEmail: email.trim().toLowerCase(),
      userId: user._id,
      cafeId,
      notificationType: 'cafe-submission',
      status: 'pending',
      idempotencyKey: randomUUID(),
    });

    const emailResult = await sendEmail({
      to: email,
      subject: `WHEN IN: Your cafe was submitted - ${cafeName}`,
      html: `<div style="font-family:Arial,sans-serif;padding:24px"><h1>WHEN IN</h1><p>Your cafe suggestion, <strong>${cafeName}</strong>, has been received and is now available to the community.</p></div>`,
      text: `Your cafe suggestion, ${cafeName}, has been received and added to WHEN IN.`,
    });

    notification.status = emailResult.ok ? 'sent' : 'failed';
    if (emailResult.ok && emailResult.messageId) notification.resendMessageId = emailResult.messageId;
    await notification.save();

    return NextResponse.json({
      success: true,
      message: 'Submission notification processed.',
      emailResult,
      notification,
    });
  } catch (error) {
    return databaseErrorResponse(error, 'Cafe submission notification');
  }
}
