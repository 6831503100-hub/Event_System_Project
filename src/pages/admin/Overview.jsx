import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import StatusBadge from '@/components/StatusBadge';
import { Calendar, CreditCard, Inbox, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function AdminOverview() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState({ events: 0, bookings: 0, requests: 0, users: 0, newReq: 0, confirmed: 0, inProgress: 0, completed: 0, revenue: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Event.list('-created_date', 1).then((r) => r.length),
      base44.entities.Booking.list('-created_date', 200).then((r) => r),
      base44.entities.EventRequest.list('-created_date', 200).then((r) => r),
      base44.entities.User.list().then((r) => r.length).catch(() => 0),
    ])
      .then(([events, bookings, requests, users]) => {
        setStats({
          events, bookings: bookings.length, requests: requests.length, users,
          newReq: requests.filter((r) => r.status === 'pending_review').length,
          confirmed: requests.filter((r) => r.status === 'confirmed').length,
          inProgress: requests.filter((r) => r.status === 'in_progress').length,
          completed: requests.filter((r) => r.status === 'completed').length,
          revenue: bookings.filter((b) => b.payment_status === 'approved').reduce((s, b) => s + (b.total_price || 0), 0),
        });
        setRecent(requests.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label={t('admin.events')} value={stats.events} color="orange" />
        <StatCard icon={CreditCard} label={t('admin.bookings')} value={stats.bookings} color="blue" />
        <StatCard icon={Inbox} label={t('admin.requests')} value={stats.requests} color="purple" />
        <StatCard icon={Users} label={t('admin.users')} value={stats.users} color="green" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Inbox} label={t('admin.newRequests')} value={stats.newReq} color="amber" />
        <StatCard icon={TrendingUp} label={t('admin.confirmed')} value={stats.confirmed} color="emerald" />
        <StatCard icon={TrendingUp} label={t('admin.inProgress')} value={stats.inProgress} color="orange" />
        <StatCard icon={TrendingUp} label={t('admin.completed')} value={stats.completed} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-neutral-900">{t('admin.requests')}</h2>
          <Link to="/admin/requests" className="text-sm text-orange-600 font-medium flex items-center gap-1">{t('common.all')} <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {loading ? (
          <p className="text-sm text-neutral-400">{t('common.loading')}</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-neutral-400">{t('common.noResults')}</p>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <Link key={r.id} to={`/admin/requests/${r.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-800 text-sm line-clamp-1">{r.event_name}</p>
                  <p className="text-xs text-neutral-400">{r.contact_name} · {r.location}</p>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <p className="text-sm text-white/80">{lang === 'th' ? 'รายได้รวม (อนุมัติแล้ว)' : 'Total Revenue (Approved)'}</p>
        <p className="text-3xl font-bold mt-1">฿{stats.revenue.toLocaleString()}</p>
      </div>
    </div>
  );
}

const COLORS = {
  orange: 'bg-orange-50 text-orange-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${COLORS[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}