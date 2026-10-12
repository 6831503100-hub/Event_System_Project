import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatPrice } from '@/lib/constants';
import { Calendar, MapPin, Inbox, ChevronRight } from 'lucide-react';

export default function MyEventRequests() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.EventRequest.filter({ created_by_id: user.id }, '-updated_date', 100)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t('myRequests.title')}</h1>
        <Link to="/custom-request" className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold">{t('home.customCtaBtn')}</Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-neutral-400">{t('common.loading')}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-7 h-7 text-neutral-300" />
          </div>
          <p className="text-neutral-500 mb-4">{t('myRequests.empty')}</p>
          <Link to="/custom-request" className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold">{t('home.customCtaBtn')}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link key={r.id} to={`/requests/${r.id}`} className="block bg-white rounded-2xl border border-neutral-100 p-4 hover:shadow-md hover:border-orange-200 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-neutral-900 line-clamp-1">{r.event_name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-neutral-500">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-orange-400" /> {formatDate(r.date, lang)}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-orange-400" /> {r.location}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <StatusBadge status={r.status} />
                    {r.proposed_price != null && (
                      <span className="text-sm text-neutral-500">{t('myRequests.estimatedPrice')}: <span className="font-semibold text-orange-600">{formatPrice(r.proposed_price)}</span></span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-neutral-400">{t('myRequests.lastUpdated')}</p>
                  <p className="text-xs text-neutral-500">{formatDate(r.updated_date, lang)}</p>
                  <ChevronRight className="w-5 h-5 text-neutral-300 ml-auto mt-2" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}