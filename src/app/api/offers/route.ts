import { NextResponse } from 'next/server';
import { databaseErrorResponse } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { ensureDevelopmentData } from '@/lib/seedDevelopmentData';
import { Cafe } from '@/models/Cafe';
import { Offer } from '@/models/Offer';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').trim();
  const activeOnly = url.searchParams.get('active') !== 'false';

  try {
    await connectDB();
    await ensureDevelopmentData();

    const filter: Record<string, unknown> = {};
    if (activeOnly) filter.isActive = true;
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      const matchingCafes = await Cafe.find({ name: pattern }).select('_id').lean();
      filter.$or = [
        { title: pattern },
        { cafeId: { $in: matchingCafes.map((cafe) => cafe._id) } },
      ];
    }

    const offers = await Offer.find(filter).sort({ createdAt: -1 }).lean();
    const cafeIds = [...new Set(offers.map((offer) => offer.cafeId.toString()))];
    const cafes = await Cafe.find({ _id: { $in: cafeIds } }).select('_id name').lean();
    const cafeNameById = new Map(cafes.map((cafe) => [cafe._id.toString(), cafe.name]));

    return NextResponse.json({
      success: true,
      data: offers.map((offer) => ({
        ...offer,
        _id: offer._id.toString(),
        cafeId: offer.cafeId.toString(),
        cafeName: cafeNameById.get(offer.cafeId.toString()) || 'Featured cafe',
      })),
    });
  } catch (error) {
    return databaseErrorResponse(error, 'Offer listing');
  }
}
