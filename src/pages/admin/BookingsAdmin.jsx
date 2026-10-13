import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { Image } from '@/components/ui/image';
import { formatPrice, formatDate, statusLabel } from '@/lib/constants';
import { CheckCircle2, XCircle, Search, Eye } from 'lucide-react';

export default function BookingsAdmin() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewSlip, setViewSlip] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.Booking.list('-created_date', 200)
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const logHistory = async (b, newPay) => {
    try {
      await base44.entities.EventStatusHistory.create({
        entity_type: 'booking', entity_id: b.id, old_status: b.payment_status, new_status: newPay,
        changed_by: user?.id, changed_by_name: user?.full_name || user?.email,
        note: lang === 'th' ? 'อัปเดตการชำระเงิน' : 'Payment status updated',
      });
    } catch {}
  };

  const approve = async (b) => {
    await base44.entities.Booking.update(b.id, { payment_status: 'approved', status: 'confirmed' });
    await logHistory(b, 'approved');
    load();
  };

  const reject = async (b) => {
    await base44.entities.Booking.update(b.id, { payment_status: 'rejected' });
    await logHistory(b, 'rejected');
    load();
  };

  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.payment_status !== filter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (b.event_name + b.customer_name + b.email).toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 bg-white">
          <Search className="w-4 h-4 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('common.search')} className="w-full outline-none text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-sm">
          <option value="all">{t('common.all')}</option>
          <option value="pending">{statusLabel('pending', lang)}</option>
          <option value="paid">{statusLabel('paid', lang)}</option>
          <option value="approved">{statusLabel('approved', lang)}</option>
          <option value="rejected">{statusLabel('rejected', lang)}</option>
        </select>
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
                <th className="text-left px-4 py-3">{t('nav.events')}</th>
                <th className="text-left px-4 py-3">{t('common.tickets')}</th>
                <th className="text-left px-4 py-3">{t('common.total')}</th>
                <th className="text-left px-4 py-3">{t('myBookings.paymentStatus')}</th>
                <th className="text-right px-4 py-3">{lang === 'th' ? 'จัดการ' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-800">{b.customer_name}</p>
                    <p className="text-xs text-neutral-400">{b.email} · {b.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-neutral-700 line-clamp-1">{b.event_name}</p>
                    <p className="text-xs text-neutral-400">{formatDate(b.event_date, lang)}</p>
                  </td>
                  <td className="px-4 py-3">{b.ticket_count}</td>
                  <td className="px-4 py-3 font-medium text-orange-600">{formatPrice(b.total_price)}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.payment_status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {b.payment_slip_url && (
                        <button onClick={() => setViewSlip(b.payment_slip_url)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title={lang === 'th' ? 'ดูสลิป' : 'View slip'}><Eye className="w-4 h-4" /></button>
                      )}
                      {b.payment_status === 'paid' && (
                        <>
                          <button onClick={() => approve(b)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title={t('admin.approvePayment')}><CheckCircle2 className="w-4 h-4" /></button>
                          <button onClick={() => reject(b)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title={t('admin.rejectPayment')}><XCircle className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setViewSlip(null)}>
          <div className="max-w-md w-full">
            <Image src={viewSlip} alt="slip" className="w-full rounded-2xl" />
            <button onClick={() => setViewSlip(null)} className="mt-3 w-full py-2.5 rounded-xl bg-white text-neutral-700 text-sm font-semibold">{t('common.back')}</button>
          </div>
        </div>
      )}
    </div>
  );
}