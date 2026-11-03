import { Cafe } from '@/models/Cafe';
import { Offer } from '@/models/Offer';
import { demoCafes, demoOffers } from './demoData';

let developmentSeedPromise: Promise<void> | null = null;

async function seedDevelopmentData() {
  await Cafe.bulkWrite(
    demoCafes.map((demoCafe) => {
      const { _id, createdAt, updatedAt, ...cafe } = demoCafe;
      void _id;
      void createdAt;
      void updatedAt;
      return {
        updateOne: {
          filter: { slug: cafe.slug },
          update: { $setOnInsert: cafe },
          upsert: true,
        },
      };
    }),
    { ordered: false },
  );

  const cafes = await Cafe.find({ slug: { $in: demoCafes.map((cafe) => cafe.slug) } })
    .select('_id slug')
    .lean();
  const cafeBySlug = new Map(cafes.map((cafe) => [cafe.slug, cafe._id]));
  const slugByLegacyId = new Map(demoCafes.map((cafe) => [cafe._id, cafe.slug]));

  const operations = demoOffers.flatMap((demoOffer) => {
    const { _id, cafeId, cafeName, ...offer } = demoOffer;
    void _id;
    void cafeName;
    const slug = slugByLegacyId.get(cafeId);
    const databaseCafeId = slug ? cafeBySlug.get(slug) : undefined;
    if (!databaseCafeId) return [];

    return [{
      updateOne: {
        filter: { cafeId: databaseCafeId, title: offer.title },
        update: { $setOnInsert: { ...offer, cafeId: databaseCafeId } },
        upsert: true,
      },
    }];
  });

  if (operations.length > 0) {
    await Offer.bulkWrite(operations, { ordered: false });
  }
}

export async function ensureDevelopmentData() {
  if (process.env.NODE_ENV !== 'development') return;

  if (!developmentSeedPromise) {
    developmentSeedPromise = seedDevelopmentData().catch((error: unknown) => {
      developmentSeedPromise = null;
      throw error;
    });
  }

  await developmentSeedPromise;
}
