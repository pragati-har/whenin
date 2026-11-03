import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { databaseErrorResponse } from '@/lib/apiErrors';
import { connectDB } from '@/lib/db';
import { ensureDevelopmentData } from '@/lib/seedDevelopmentData';
import { Cafe } from '@/models/Cafe';
import { Offer } from '@/models/Offer';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: 'Offer not found.' }, { status: 404 });
  }

  try {
    await connectDB();
    await ensureDevelopmentData();
    const offer = await Offer.findById(id).lean();
    if (!offer) {
      return NextResponse.json({ success: false, message: 'Offer not found.' }, { status: 404 });
    }

    const cafe = await Cafe.findById(offer.cafeId).select('_id name').lean();
    return NextResponse.json({
      success: true,
      data: {
        ...offer,
        _id: offer._id.toString(),
        cafeId: offer.cafeId.toString(),
        cafeName: cafe?.name || 'Featured cafe',
      },
    });
  } catch (error) {
    return databaseErrorResponse(error, 'Offer detail lookup');
  }
}
