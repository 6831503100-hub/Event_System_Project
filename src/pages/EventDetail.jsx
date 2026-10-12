import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage, localized } from '@/lib/i18n';
import { Image } from '@/components/ui/image';
import { formatDate, formatPrice } from '@/lib/constants';
import { Calendar, Clock, MapPin, Users, Tag, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    base44.entities.Event.get(id)
      .then((res) => setEvent(res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-neutral-400">{t('common.loading')}</div>;
  if (error || !event) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-neutral-500 mb-4">{t('common.error')}</p>
      <Link to="/events" className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">{t('common.back')}</Link>
    </div>
  );

  const name = localized(event, 'name', lang);
  const desc = localized(event, 'desc', lang);
  const location = localized(event, 'location', lang);
  const hasDiscount = event.original_price && event.original_price > event.price;
  const discountPct = hasDiscount ? Math.round((1 - event.price / event.original_price) * 100) : 0;
  const soldOut = (event.available_seats ?? 0) <= 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-orange-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative rounded-3xl overflow-hidden shadow-lg aspect-[4/3]">
          <Image src={event.image_url} alt={name} className="w-full h-full" fittingType="fill" />
          {hasDiscount && (
            <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-bold bg-orange-500 text-white shadow">
              {t('promo.discount')} {discountPct}%
            </span>
          )}
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600 mb-3">
            {t(`cat.${event.category}`)}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">{name}</h1>

          <div className="space-y-2.5 text-sm text-neutral-600 mb-5">
            <Info icon={Calendar} label={t('common.date')} value={formatDate(event.date, lang)} />
            <Info icon={Clock} label={t('common.time')} value={`${event.start_time || '-'} - ${event.end_time || '-'}`} />
            <Info icon={MapPin} label={t('common.location')} value={`${location || event.province}${event.province ? ', ' + event.province : ''}`} />
            <Info icon={Users} label={t('common.availableSeats')} value={`${event.available_seats ?? 0} / ${event.total_seats ?? '-'}`} />
          </div>

          <div className="bg-orange-50 rounded-2xl p-5 mb-5">
            <div className="flex items-end justify-between">
              <div>
                {hasDiscount && <p className="text-sm text-neutral-400 line-through">{formatPrice(event.original_price)}</p>}
                <p className="text-3xl font-bold text-orange-600">{formatPrice(event.price)}</p>
                <p className="text-xs text-neutral-500 mt-1">{lang === 'th' ? 'ต่อคน' : 'per person'}</p>
              </div>
              {soldOut ? (
                <span className="px-5 py-2.5 rounded-xl bg-neutral-200 text-neutral-500 font-semibold text-sm">{lang === 'th' ? 'เต็มแล้ว' : 'Sold out'}</span>
              ) : (
                <button
                  onClick={() => navigate(`/booking/${event.id}`)}
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors shadow-lg"
                >
                  {t('common.bookNow')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-neutral-900 mb-3">{t('detail.description')}</h2>
        <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{desc || '-'}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FactBox label={t('detail.category')} value={t(`cat.${event.category}`)} />
        <FactBox label={t('common.region')} value={event.region ? t('region.' + event.region) : '-'} />
        <FactBox label={t('common.province')} value={event.province || '-'} />
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-neutral-400">{label}</p>
        <p className="font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

function FactBox({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-4">
      <p className="text-xs text-neutral-400 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-neutral-800 mt-1">{value}</p>
    </div>
  );
}