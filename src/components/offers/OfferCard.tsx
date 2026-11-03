import { CalendarRange, Percent, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function OfferCard({ offer }: { offer: any }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0e6] px-2 py-1 text-xs font-medium text-[#c85d2b]">
          <Sparkles size={12} />
          Offer
        </div>
        <span className="text-xs text-[#7a5d53]">{offer.isActive ? 'Active' : 'Inactive'}</span>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#2d1b16]">{offer.title}</h3>
        <p className="text-sm text-[#5f463d]">{offer.cafeName || 'Featured cafe'}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-[#5f463d]">
        <Percent size={14} className="text-[#c85d2b]" />
        {offer.discountDetails}
      </div>

      <p className="text-sm text-[#5f463d]">{offer.description}</p>

      <div className="flex items-center gap-2 text-sm text-[#5f463d]">
        <CalendarRange size={14} className="text-[#c85d2b]" />
        {new Date(offer.validFrom).toLocaleDateString()} - {new Date(offer.validUntil).toLocaleDateString()}
      </div>
    </Card>
  );
}
