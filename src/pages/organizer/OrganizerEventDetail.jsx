import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatPrice } from '@/lib/constants';
import { ArrowLeft, Play, CheckCircle2, Clock, MapPin, Users, Calendar } from 'lucide-react';

export default function OrganizerEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.EventRequest.get(id),
      base44.entities.OrganizerAssignment.filter({ request_id: id }, '-created_date', 5),
    ]).then(([r, a]) => { setReq(r); setAssignment(a[0]); })
      .catch(() => setReq(null))
      .finally(() => setLoading(false));
  }, [id]);

  const logHistory = async (old, neu, note) => {
    try {
      await base44.entities.EventStatusHistory.create({
        entity_type: 'event_request', entity_id: id, old_status: old, new_status: neu,
        changed_by: user?.id, changed_by_name: user?.full_name || user?.email, note,
      });
    } catch {}
  };

  const setStatus = async (newStatus) => {
    setBusy(true);
    const old = req.status;
    try {
      await base44.entities.EventRequest.update(id, { status: newStatus });
      await logHistory(old, newStatus, lang === 'th' ? 'ผู้จัดอัปเดตสถานะ' : 'Organizer updated status');
      setReq({ ...req, status: newStatus });
    } finally { setBusy(false); }
  };

  if (loading) return <p className="text-sm text-neutral-400">{t('common.loading')}</p>;
  if (!req) return (
    <div className="text-center py-12">
      <p className="text-neutral-500 mb-4">{t('common.error')}</p>
      <button onClick={() => navigate('/organizer')} className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">{t('common.back')}</button>
    </div>
  );

  const canStart = req.status === 'confirmed';
  const canComplete = req.status === 'in_progress';

  return (
    <div className="space-y-5 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-orange-600">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-neutral-900 flex-1">{req.event_name}</h1>
        <StatusBadge status={req.status} />
      </div>

      {assignment?.notes && (
        <div className="bg-orange-50 rounded-xl p-4 text-sm text-neutral-700">
          <b>{lang === 'th' ? 'หมายเหตุจากแอดมิน: ' : 'Admin note: '}</b>{assignment.notes}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <h2 className="font-semibold text-neutral-900 mb-3">{lang === 'th' ? 'รายละเอียดงาน' : 'Event Details'}</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info icon={Calendar} label={t('common.date')} value={formatDate(req.date, lang)} />
          <Info icon={Clock} label={t('common.time')} value={`${req.start_time || '-'} - ${req.end_time || '-'}`} />
          <Info icon={MapPin} label={t('common.location')} value={req.location} />
          <Info icon={Users} label={t('request.participants')} value={req.participants} />
        </div>
        {req.equipment && <p className="mt-3 text-sm"><b>{t('request.equipment')}:</b> {req.equipment}</p>}
        {req.details && <p className="mt-2 text-sm"><b>{lang === 'th' ? 'ความต้องการพิเศษ: ' : 'Special instructions: '}</b>{req.details}</p>}
        {req.theme && <p className="mt-2 text-sm"><b>{t('request.theme')}:</b> {req.theme}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <h2 className="font-semibold text-neutral-900 mb-3">{lang === 'th' ? 'ข้อมูลผู้ติดต่อ' : 'Contact'}</h2>
        <div className="text-sm space-y-1">
          <p>{req.contact_name}</p>
          <p className="text-neutral-500">{req.phone} · {req.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <h2 className="font-semibold text-neutral-900 mb-3">{lang === 'th' ? 'อัปเดตสถานะ' : 'Update Status'}</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatus('in_progress')} disabled={busy || !canStart} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-40">
            <Play className="w-4 h-4" /> {t('org.markInProgress')}
          </button>
          <button onClick={() => setStatus('completed')} disabled={busy || !canComplete} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold disabled:opacity-40">
            <CheckCircle2 className="w-4 h-4" /> {t('org.markCompleted')}
          </button>
        </div>
        {!canStart && !canComplete && <p className="text-xs text-neutral-400 mt-2">{lang === 'th' ? 'ไม่สามารถอัปเดตสถานะได้ในขณะนี้' : 'No status update available right now'}</p>}
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
      <div><p className="text-xs text-neutral-400">{label}</p><p className="font-medium text-neutral-800">{value || '-'}</p></div>
    </div>
  );
}