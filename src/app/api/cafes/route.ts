import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';
import { slugify } from '@/lib/utils';
import { databaseErrorResponse, isDuplicateKeyError } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { createUserNotification } from '@/lib/createUserNotification';
import { ensureDevelopmentData } from '@/lib/seedDevelopmentData';
import { Cafe } from '@/models/Cafe';
import { User } from '@/models/User';

const cafeSchema = z.object({
  name: z.string().trim().min(2, 'Enter a cafe name with at least 2 characters.'),
  description: z.string().trim().min(10, 'Enter a description with at least 10 characters.'),
  address: z.string().trim().min(5, 'Enter an address with at least 5 characters.'),
  locality: z.string().trim().min(2, 'Enter a locality with at least 2 characters.'),
  city: z.string().trim().min(2, 'Enter a city with at least 2 characters.'),
  cuisine: z.string().trim().min(2, 'Enter a cuisine with at least 2 characters.'),
  averagePriceForTwo: z.number({ error: 'Enter the average price for two as a number.' }).min(1, 'Average price for two must be greater than zero.'),
  openingHours: z.string().trim().min(3, 'Enter opening hours with at least 3 characters.'),
  contactNumber: z.string().optional(),
  imageUrl: z.string().optional(),
});

function parsePage(value: string | null, fallback = 1) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

function parseLimit(value: string | null, fallback = DEFAULT_PAGE_SIZE) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parsePage(url.searchParams.get('page'));
  const limit = parseLimit(url.searchParams.get('limit'));
  const search = (url.searchParams.get('search') || '').trim();
  const city = (url.searchParams.get('city') || process.env.TARGET_CITY || 'Pune').trim();
  const cuisine = (url.searchParams.get('cuisine') || '').trim();

  try {
    await connectDB();
    await ensureDevelopmentData();

    const filter: Record<string, unknown> = {};
    if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
    if (search) {
      const searchPattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { name: searchPattern },
        { locality: searchPattern },
        { cuisine: searchPattern },
      ];
    }
    if (cuisine) filter.cuisine = new RegExp(`^${escapeRegex(cuisine)}$`, 'i');

    const totalRecords = await Cafe.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const currentPage = Math.min(page, totalPages);
    const data = await Cafe.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      pagination: {
        currentPage,
        pageSize: limit,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
      data,
    });
  } catch (error) {
    return databaseErrorResponse(error, 'Cafe listing');
  }
}

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
    return NextResponse.json({ success: false, message: 'Not authenticated or invalid token.' }, { status: 401 });
  }

  if (!mongoose.isValidObjectId(payload.userId)) {
    return NextResponse.json({ success: false, message: 'Not authenticated or invalid token.' }, { status: 401 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Missing required cafe details.' }, { status: 400 });
  }
  const body = cafeSchema.safeParse(parsedBody);
  if (!body.success) {
    const fieldErrors = body.error.issues.reduce<Record<string, string[]>>((errors, issue) => {
      const field = issue.path.join('.') || 'request';
      errors[field] = [...(errors[field] || []), issue.message];
      return errors;
    }, {});
    return NextResponse.json(
      { success: false, message: Object.values(fieldErrors).flat()[0] || 'Please correct the cafe details.', fieldErrors },
      { status: 400 },
    );
  }

  const { name, description, address, locality, city, cuisine, averagePriceForTwo, openingHours, contactNumber, imageUrl } = body.data;

  try {
    await connectDB();
    const user = await User.findById(payload.userId).select('_id');
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authenticated or invalid token.' }, { status: 401 });
    }

    const duplicate = await Cafe.exists({
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      city: new RegExp(`^${escapeRegex(city)}$`, 'i'),
    });
    if (duplicate) {
      return NextResponse.json({ success: false, message: 'This cafe already exists in the directory.' }, { status: 409 });
    }

    const cafe = await Cafe.create({
      name,
      slug: `${slugify(name)}-${Date.now()}`,
      description,
      address,
      locality,
      city,
      cuisine,
      averagePriceForTwo,
      openingHours,
      contactNumber: contactNumber || '',
      images: imageUrl ? [imageUrl] : ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'],
      rating: 4.5,
      featured: false,
      submissionSource: 'user',
      submittedBy: user._id,
    });

    let notificationWarning: string | undefined;
    try {
      await createUserNotification({
        userId: user._id.toString(),
        type: 'cafe-submission',
        title: 'Cafe submitted',
        message: `${cafe.name} has been added to WHEN IN.`,
        cafeId: cafe._id.toString(),
      });
    } catch (error) {
      notificationWarning = 'Cafe was submitted, but its in-app notification could not be saved.';
      console.error('Cafe notification persistence failed:', error instanceof Error ? error.name : 'Unknown error');
    }

    return NextResponse.json({
      success: true,
      cafe,
      message: notificationWarning || 'Cafe submitted successfully.',
      ...(notificationWarning ? { notificationWarning } : {}),
    }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ success: false, message: 'This cafe already exists in the directory.' }, { status: 409 });
    }
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ success: false, message: 'Missing required cafe details.' }, { status: 400 });
    }
    return databaseErrorResponse(error, 'Cafe submission');
  }
}
