import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { databaseErrorResponse } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { createUserNotification } from '@/lib/createUserNotification';
import { createOfferEmailHTML, sendEmail } from '@/lib/email';
import { NotificationRequest } from '@/models/NotificationRequest';
import { Offer } from '@/models/Offer';
import { User } from '@/models/User';

const schema = z.object({
  email: z.string().email(),
  offerId: z.string().min(1),
  cafeName: z.string().min(1),
  offerTitle: z.string().min(1),
  discount: z.string().min(1),
  terms: z.string().min(1),
  validity: z.string().min(1),
  link: z.string().min(1),
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
    return NextResponse.json({ success: false, message: 'Valid email and offer data are required.' }, { status: 400 });
  }
  const parsed = schema.safeParse(requestBody);
  if (!parsed.success || !mongoose.isValidObjectId(parsed.data?.offerId)) {
    return NextResponse.json({ success: false, message: 'Valid email and offer data are required.' }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId).select('_id');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 401 });
    }

    const offer = await Offer.findById(parsed.data.offerId).select('_id');
    if (!offer) {
      return NextResponse.json({ success: false, message: 'Offer not found.' }, { status: 404 });
    }

    const { email, offerId, cafeName, offerTitle, discount, terms, validity, link } = parsed.data;
    const notification = await NotificationRequest.create({
      recipientEmail: email.trim().toLowerCase(),
      userId: user._id,
      offerId,
      notificationType: 'offer',
      status: 'pending',
      idempotencyKey: randomUUID(),
    });

    let inAppWarning: string | undefined;
    try {
      await createUserNotification({
        userId: user._id.toString(),
        type: 'offer',
        title: 'Offer alert requested',
        message: `Your email alert request for ${offerTitle} at ${cafeName} was recorded.`,
        offerId,
      });
    } catch (error) {
      inAppWarning = ' The in-app notification could not be saved.';
      console.error('Offer notification persistence failed:', error instanceof Error ? error.name : 'Unknown error');
    }

    const emailResult = await sendEmail({
      to: email,
      subject: `WHEN IN: ${offerTitle} at ${cafeName}`,
      html: createOfferEmailHTML({ cafeName, offerTitle, discount, terms, validity, link }),
      text: `WHEN IN offer alert: ${offerTitle} at ${cafeName}. Deal: ${discount}. Terms: ${terms}. Validity: ${validity}. View: ${link}`,
    });

    notification.status = emailResult.ok ? 'sent' : 'failed';
    if (emailResult.ok && emailResult.messageId) notification.resendMessageId = emailResult.messageId;
    await notification.save();

    return NextResponse.json({
      success: true,
      message: `${emailResult.ok ? 'Offer notification sent.' : 'Notification request saved, but email delivery failed.'}${inAppWarning || ''}`,
      emailResult,
      notification,
      ...(inAppWarning ? { inAppWarning } : {}),
    });
  } catch (error) {
    return databaseErrorResponse(error, 'Offer notification');
  }
}
