import React from 'react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { useLanguage, localized } from '@/lib/i18n';
import { formatDate, formatPrice } from '@/lib/constants';
import { MapPin, Calendar, Users, Tag } from 'lucide-react';

export default function EventCard({ event }) {
  const { lang, t } = useLanguage();
  const name = localized(event, 'name', lang);
  const location = localized(event, 'location', lang);
  const seats = event.available_seats ?? 0;
  const hasDiscount = event.original_price && event.original_price > event.price;
  const discountPct = hasDiscount ? Math.round((1 - event.price / event.original_price) * 100) : 0;
  const fewLeft = seats > 0 && seats <= 5;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={event.image_url}
          alt={name}
          className="w-full h-full"
          fittingType="fill"
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-neutral-800 backdrop-blur">
            {t(`cat.${event.category}`)}
          </span>
          {hasDiscount && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow">
              {t('promo.discount')} {discountPct}%
            </span>
          )}
          {fewLeft && !hasDiscount && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500 text-white shadow">
              {t('promo.fewLeft')} {seats} {t('common.seats')}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-neutral-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{name}</h3>
        <div className="mt-2 space-y-1.5 text-sm text-neutral-500">
          <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-orange-400" /> {formatDate(event.date, lang)}</div>
          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-400" /> {location || event.province}</div>
          <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-orange-400" /> {seats} {t('common.availableSeats')}</div>
        </div>
        <div className="mt-3 pt-3 border-t border-neutral-100 flex items-end justify-between">
          <div>
            {hasDiscount && (
              <p className="text-xs text-neutral-400 line-through">{formatPrice(event.original_price)}</p>
            )}
            <p className="text-lg font-bold text-orange-600">{formatPrice(event.price)}</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-white bg-orange-500 group-hover:bg-orange-600 transition-colors">
            {t('common.bookNow')}
          </span>
        </div>
      </div>
    </Link>
  );
}