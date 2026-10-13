import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/constants';
import { Calendar, MapPin, Users, Inbox, ChevronRight } from 'lucide-react';

export default function OrganizerOverview() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.OrganizerAssignment.filter({ organizer_id: user.id }, '-created_date', 100)
      .then((asgn) => {
        setAssignments(asgn);
        return Promise.all(asgn.map((a) => base44.entities.EventRequest.get(a.request_id).catch(() => null)));
      })
      .then((reqs) => setRequests(reqs.filter(Boolean)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const stats = {
    assigned: requests.length,
    upcoming: requests.filter((r) => r.status === 'confirmed').length,
    inProgress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label={t('org.assigned')} value={stats.assigned} color="orange" />
        <Card label={t('org.upcoming')} value={stats.upcoming} color="blue" />
        <Card label={t('org.inProgress')} value={stats.inProgress} color="amber" />
        <Card label={t('org.completed')} value={stats.completed} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <h2 className="font-semibold text-neutral-900 mb-4">{t('org.assigned')}</h2>
        {loading ? (
          <p className="text-sm text-neutral-400">{t('common.loading')}</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3"><Inbox className="w-6 h-6 text-neutral-300" /></div>
            <p className="text-neutral-400 text-sm">{t('org.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <Link key={r.id} to={`/organizer/${r.id}`} className="block bg-white rounded-xl border border-neutral-100 p-4 hover:shadow-md hover:border-orange-200 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-neutral-900 line-clamp-1">{r.event_name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-neutral-500">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-orange-400" /> {formatDate(r.date, lang)}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-orange-400" /> {r.location}</span>
                      <span className="flex items-center gap-1"><Users className="w-4 h-4 text-orange-400" /> {r.participants}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={r.status} />
                    <ChevronRight className="w-5 h-5 text-neutral-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const COLORS = { orange: 'bg-orange-50 text-orange-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', green: 'bg-green-50 text-green-600' };
function Card({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-4">
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}