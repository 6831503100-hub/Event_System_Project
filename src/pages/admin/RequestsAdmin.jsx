import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import StatusBadge from '@/components/StatusBadge';
import { REQUEST_STATUSES, formatPrice, formatDate, statusLabel, eventTypeLabel } from '@/lib/constants';
import { Search, Filter, ChevronRight } from 'lucide-react';

export default function RequestsAdmin() {
  const { t, lang } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    base44.entities.EventRequest.list('-created_date', 200)
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (r.event_name + r.contact_name + r.location + r.event_type).toLowerCase().includes(q);
    }
    return true;
  });

  const counts = REQUEST_STATUSES.reduce((acc, s) => {
    acc[s] = requests.filter((r) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['pending_review', t('admin.newRequests')],
          ['under_review', t('admin.underReview')],
          ['waiting_customer_confirmation', t('admin.waitingConfirm')],
          ['confirmed', t('admin.confirmed')],
          ['in_progress', t('admin.inProgress')],
          ['completed', t('admin.completed')],
        ].map(([s, label]) => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)} className={`text-left p-3 rounded-2xl border transition-colors ${statusFilter === s ? 'border-orange-400 bg-orange-50' : 'border-neutral-100 bg-white hover:border-orange-200'}`}>
            <p className="text-2xl font-bold text-neutral-900">{counts[s] || 0}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 bg-white">
          <Search className="w-4 h-4 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('common.search')} className="w-full outline-none text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-sm">
            <option value="all">{t('common.all')}</option>
            {REQUEST_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s, lang)}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-8">{t('common.noResults')}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">{lang === 'th' ? 'ลูกค้า' : 'Customer'}</th>
                <th className="text-left px-4 py-3">{lang === 'th' ? 'Event' : 'Event'}</th>
                <th className="text-left px-4 py-3">{t('common.date')}</th>
                <th className="text-left px-4 py-3">{t('common.location')}</th>
                <th className="text-left px-4 py-3">{t('request.budget')}</th>
                <th className="text-left px-4 py-3">{lang === 'th' ? 'สถานะ' : 'Status'}</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-800">{r.contact_name}</p>
                    <p className="text-xs text-neutral-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-neutral-700 line-clamp-1">{r.event_name}</p>
                    <p className="text-xs text-neutral-400">{eventTypeLabel(r.event_type, lang)}</p>
                  </td>
                  <td className="px-4 py-3">{formatDate(r.date, lang)}</td>
                  <td className="px-4 py-3">{r.location}</td>
                  <td className="px-4 py-3">{formatPrice(r.budget)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/requests/${r.id}`} className="inline-flex items-center gap-1 text-orange-600 text-sm font-medium">{t('common.viewDetails')} <ChevronRight className="w-4 h-4" /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}