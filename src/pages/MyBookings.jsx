import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatPrice } from '@/lib/constants';
import { Calendar, Ticket, Inbox } from 'lucide-react';

export default function MyBookings() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.Booking.filter({ created_by_id: user.id }, '-created_date', 100)
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('myBookings.title')}</h1>

      {loading ? (
        <div className="text-center py-16 text-neutral-400">{t('common.loading')}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-7 h-7 text-neutral-300" />
          </div>
          <p className="text-neutral-500 mb-4">{t('myBookings.empty')}</p>
          <Link to="/events" className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold">{t('common.bookNow')}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-neutral-100 p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
              <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                {b.event_image_url && <Image src={b.event_image_url} alt="" className="w-full h-full" fittingType="fill" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 line-clamp-1">{b.event_name}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-neutral-500">
                  <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-orange-400" /> {formatDate(b.event_date, lang)}</div>
                  <div className="flex items-center gap-1.5"><Ticket className="w-4 h-4 text-orange-400" /> {b.ticket_count} {t('common.tickets')}</div>
                  <div>{t('myBookings.bookingDate')}: {formatDate(b.created_date, lang)}</div>
                  <div className="font-semibold text-orange-600">{formatPrice(b.total_price)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <StatusBadge status={b.status} />
                  <span className="text-xs text-neutral-400">{t('myBookings.paymentStatus')}:</span>
                  <StatusBadge status={b.payment_status} />
                </div>
                {b.admin_note && (
                  <p className="mt-2 text-xs text-neutral-500 bg-neutral-50 rounded-lg p-2">{b.admin_note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}