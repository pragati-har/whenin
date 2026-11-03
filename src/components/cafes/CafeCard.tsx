import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, UtensilsCrossed } from 'lucide-react';

export function CafeCard({ cafe }: { cafe: any }) {
  return (
    <Link href={`/cafes/${cafe._id}`} className="group block overflow-hidden rounded-2xl border border-[#f0e4d6] bg-[#fffdfb] shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-52 overflow-hidden">
        <Image
          src={cafe.images?.[0] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'}
          alt={cafe.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-[#2d1b16]">{cafe.name}</h3>
            <p className="text-sm text-[#5f463d]">{cafe.locality}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[#fff0e6] px-2 py-1 text-xs font-medium text-[#c85d2b]">
            <Star size={12} fill="currentColor" />
            {cafe.rating || 4.5}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#5f463d]">
          <UtensilsCrossed size={14} />
          <span>{cafe.cuisine}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#5f463d]">
          <MapPin size={14} />
          <span>{cafe.city}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-[#6f544d]">
          <span>₹{cafe.averagePriceForTwo || 800} for two</span>
          <span className="font-medium text-[#c85d2b]">View details</span>
        </div>
      </div>
    </Link>
  );
}
