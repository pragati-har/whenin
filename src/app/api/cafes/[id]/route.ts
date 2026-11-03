import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { databaseErrorResponse, isDuplicateKeyError } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { ensureDevelopmentData } from '@/lib/seedDevelopmentData';
import { Cafe } from '@/models/Cafe';

const cafeUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  address: z.string().min(5).optional(),
  locality: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  cuisine: z.string().min(2).optional(),
  averagePriceForTwo: z.number().min(1).optional(),
  openingHours: z.string().min(3).optional(),
  contactNumber: z.string().optional(),
  imageUrl: z.string().optional(),
}).refine((value) => Object.keys(value).length > 0);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function invalidCafeId(id: string) {
  return !mongoose.isValidObjectId(id);
}

function unauthorized() {
  return NextResponse.json({ success: false, message: 'Invalid or expired token.' }, { status: 401 });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (invalidCafeId(id)) {
    return NextResponse.json({ success: false, message: 'Cafe not found.' }, { status: 404 });
  }

  try {
    await connectDB();
    await ensureDevelopmentData();
    const cafe = await Cafe.findById(id).lean();
    if (!cafe) {
      return NextResponse.json({ success: false, message: 'Cafe not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, cafe });
  } catch (error) {
    return databaseErrorResponse(error, 'Cafe detail lookup');
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  if (invalidCafeId(id)) {
    return NextResponse.json({ success: false, message: 'Cafe not found.' }, { status: 404 });
  }
  if (!mongoose.isValidObjectId(payload.userId)) return unauthorized();

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid cafe update.' }, { status: 400 });
  }
  const parsed = cafeUpdateSchema.safeParse(requestBody);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid cafe update.' }, { status: 400 });
  }

  try {
    await connectDB();
    const cafe = await Cafe.findById(id);
    if (!cafe) return NextResponse.json({ success: false, message: 'Cafe not found.' }, { status: 404 });
    if (cafe.submittedBy?.toString() !== payload.userId) {
      return NextResponse.json({ success: false, message: 'You can only edit your own cafe submissions.' }, { status: 403 });
    }

    const { imageUrl, ...updates } = parsed.data;
    const nextName = updates.name || cafe.name;
    const nextCity = updates.city || cafe.city;
    if (updates.name || updates.city) {
      const duplicate = await Cafe.exists({
        _id: { $ne: cafe._id },
        name: new RegExp(`^${escapeRegex(nextName)}$`, 'i'),
        city: new RegExp(`^${escapeRegex(nextCity)}$`, 'i'),
      });
      if (duplicate) {
        return NextResponse.json({ success: false, message: 'This cafe already exists in the directory.' }, { status: 409 });
      }
    }

    const updateData = {
      ...updates,
      ...(imageUrl !== undefined ? { images: imageUrl ? [imageUrl] : [] } : {}),
    };
    const updatedCafe = await Cafe.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );
    return NextResponse.json({ success: true, cafe: updatedCafe });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ success: false, message: 'This cafe already exists in the directory.' }, { status: 409 });
    }
    return databaseErrorResponse(error, 'Cafe update');
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  if (invalidCafeId(id)) {
    return NextResponse.json({ success: false, message: 'Cafe not found.' }, { status: 404 });
  }
  if (!mongoose.isValidObjectId(payload.userId)) return unauthorized();

  try {
    await connectDB();
    const cafe = await Cafe.findById(id);
    if (!cafe) return NextResponse.json({ success: false, message: 'Cafe not found.' }, { status: 404 });
    if (cafe.submittedBy?.toString() !== payload.userId) {
      return NextResponse.json({ success: false, message: 'You can only delete your own cafe submissions.' }, { status: 403 });
    }
    await Cafe.deleteOne({ _id: cafe._id });
    return NextResponse.json({ success: true, message: 'Cafe deleted.' });
  } catch (error) {
    return databaseErrorResponse(error, 'Cafe deletion');
  }
}
