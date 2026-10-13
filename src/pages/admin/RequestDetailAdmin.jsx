import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { formatPrice, formatDate, statusLabel, eventTypeLabel } from '@/lib/constants';
import { ArrowLeft, Save, MessageSquarePlus, UserPlus, X, Phone, Mail, History, DollarSign, FileText } from 'lucide-react';

export default function RequestDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('manage');

  // editable fields
  const [proposedPrice, setProposedPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [assignment, setAssignment] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [qPrice, setQPrice] = useState('');
  const [qDeposit, setQDeposit] = useState('');
  const [qDetails, setQDetails] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.EventRequest.get(id),
      base44.entities.EventStatusHistory.filter({ entity_type: 'event_request', entity_id: id }, '-created_date', 50),
      base44.entities.AdminNote.filter({ request_id: id }, '-created_date', 50),
      base44.entities.User.list().catch(() => []),
      base44.entities.OrganizerAssignment.filter({ request_id: id }, '-created_date', 10).catch(() => []),
      base44.entities.Quotation.filter({ request_id: id }, '-created_date', 20).catch(() => []),
    ]).then(([r, h, n, u, a, q]) => {
      setReq(r); setHistory(h); setNotes(n); setUsers(u); setQuotations(q);
      setProposedPrice(r.proposed_price ?? '');
      setDeposit(r.deposit ?? '');
      setAssignment(a[0]?.organizer_id || '');
    }).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const logHistory = async (oldStatus, newStatus, note) => {
    try {
      await base44.entities.EventStatusHistory.create({
        entity_type: 'event_request', entity_id: id, old_status: oldStatus, new_status: newStatus,
        changed_by: user?.id, changed_by_name: user?.full_name || user?.email, note,
      });
    } catch {}
  };

  const updateStatus = async (newStatus, note) => {
    setBusy(true);
    const old = req.status;
    try {
      await base44.entities.EventRequest.update(id, { status: newStatus });
      await logHistory(old, newStatus, note);
      load();
    } finally { setBusy(false); }
  };

  const savePricing = async () => {
    setBusy(true);
    try {
      const pp = Number(proposedPrice) || 0;
      const dep = Number(deposit) || 0;
      await base44.entities.EventRequest.update(id, {
        proposed_price: pp, deposit: dep, remaining_balance: Math.max(0, pp - dep),
      });
      load();
    } finally { setBusy(false); }
  };

  const createQuotation = async () => {
    const pp = Number(qPrice) || 0;
    if (pp <= 0) return;
    setBusy(true);
    try {
      const dep = Number(qDeposit) || 0;
      await base44.entities.Quotation.create({
        request_id: id, request_name: req.event_name,
        price: pp, deposit: dep, details: qDetails,
        status: 'sent', issued_by: user?.full_name || user?.email,
      });
      await base44.entities.EventRequest.update(id, {
        proposed_price: pp, deposit: dep, remaining_balance: Math.max(0, pp - dep),
        status: 'waiting_customer_confirmation',
      });
      await logHistory(req.status, 'waiting_customer_confirmation', lang === 'th' ? 'ออกใบเสนอราคา (Quotation)' : 'Quotation issued');
      setQPrice(''); setQDeposit(''); setQDetails('');
      load();
    } finally { setBusy(false); }
  };

  const addNote = async (isInternal) => {
    const content = isInternal ? internalNote : publicNote;
    if (!content.trim()) return;
    setBusy(true);
    try {
      await base44.entities.AdminNote.create({
        request_id: id, content, is_internal: isInternal, author_name: user?.full_name || user?.email,
      });
      if (!isInternal) {
        await base44.entities.EventRequest.update(id, { admin_notes_public: content });
      }
      setInternalNote(''); setPublicNote('');
      load();
    } finally { setBusy(false); }
  };

  const assignOrganizer = async () => {
    if (!assignment) return;
    setBusy(true);
    try {
      const org = users.find((u) => u.id === assignment);
      // remove old assignments then create
      await base44.entities.OrganizerAssignment.deleteMany({ request_id: id }).catch(() => {});
      await base44.entities.OrganizerAssignment.create({
        request_id: id, request_name: req.event_name,
        organizer_id: assignment, organizer_name: org?.full_name || org?.email,
        assigned_by: user?.id, assigned_by_name: user?.full_name || user?.email,
        notes: assignNote,
      });
      await base44.entities.EventRequest.update(id, { organizer_id: assignment });
      await logHistory(req.status, req.status, (lang === 'th' ? 'มอบหมายผู้จัด: ' : 'Assigned organizer: ') + (org?.full_name || org?.email));
      setAssignNote('');
      load();
    } finally { setBusy(false); }
  };

  if (loading) return <p className="text-sm text-neutral-400">{t('common.loading')}</p>;
  if (!req) return (
    <div className="text-center py-12">
      <p className="text-neutral-500 mb-4">{t('common.error')}</p>
      <Link to="/admin/requests" className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">{t('common.back')}</Link>
    </div>
  );

  const organizers = users.filter((u) => u.role === 'organizer' || u.role === 'admin');

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-orange-600">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-neutral-900 flex-1">{req.event_name}</h1>
        <StatusBadge status={req.status} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        {[['manage', t('admin.overview')], ['quote', lang === 'th' ? 'ใบเสนอราคา' : 'Quotation'], ['notes', lang === 'th' ? 'โน้ต' : 'Notes'], ['history', t('requestDetail.statusHistory')]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-orange-500 text-orange-600' : 'border-transparent text-neutral-500'}`}>{l}</button>
        ))}
      </div>

      {tab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <Card title={lang === 'th' ? 'รายละเอียดคำขอ' : 'Request Details'}>
              <Grid items={[
                [t('request.eventType'), eventTypeLabel(req.event_type, lang)],
                [t('request.date'), formatDate(req.date, lang)],
                [t('request.startTime'), req.start_time],
                [t('request.endTime'), req.end_time],
                [t('request.location'), req.location],
                [t('request.participants'), req.participants],
                [t('request.budget'), formatPrice(req.budget)],
                [t('request.theme'), req.theme],
              ]} />
              {req.equipment && <p className="mt-2 text-sm"><b>{t('request.equipment')}:</b> {req.equipment}</p>}
              {req.details && <p className="mt-1 text-sm"><b>{t('request.details')}:</b> {req.details}</p>}
            </Card>

            <Card title={lang === 'th' ? 'ข้อมูลผู้ติดต่อ' : 'Contact'}>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-400" /> {req.contact_name} · {req.phone}</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-400" /> {req.email}</p>
              </div>
              {req.customer_change_request && (
                <div className="mt-3 bg-blue-50 rounded-xl p-3 text-sm">{lang === 'th' ? 'ลูกค้าขอแก้ไข: ' : 'Customer change request: '}{req.customer_change_request}</div>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card title={lang === 'th' ? 'การเงิน' : 'Pricing'}>
              <div className="grid grid-cols-2 gap-3">
                <Num label={t('requestDetail.proposedPrice')} value={proposedPrice} onChange={setProposedPrice} />
                <Num label={t('requestDetail.deposit')} value={deposit} onChange={setDeposit} />
              </div>
              <button onClick={savePricing} disabled={busy} className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">
                <Save className="w-4 h-4" /> {t('admin.setPrice')}
              </button>
              <div className="mt-3 text-sm text-neutral-500">{t('requestDetail.remaining')}: <b className="text-neutral-800">{formatPrice(req.remaining_balance)}</b></div>
            </Card>

            <Card title={lang === 'th' ? 'สถานะ' : 'Status Actions'}>
              <div className="flex flex-wrap gap-2">
                <ActionBtn onClick={() => updateStatus('under_review', lang === 'th' ? 'เริ่มตรวจสอบ' : 'Started review')} disabled={busy}>{t('admin.underReview')}</ActionBtn>
                <ActionBtn onClick={() => updateStatus('waiting_customer_info', lang === 'th' ? 'ขอข้อมูลเพิ่มเติม' : 'Requested more info')} disabled={busy}>{t('admin.requestInfo')}</ActionBtn>
                <ActionBtn primary onClick={() => updateStatus('waiting_customer_confirmation', lang === 'th' ? 'ส่งคำเสนอให้ลูกค้า' : 'Sent proposal to customer')} disabled={busy}>{t('admin.confirmDetails')}</ActionBtn>
                <ActionBtn onClick={() => updateStatus('in_progress', lang === 'th' ? 'เริ่มดำเนินงาน' : 'Started event')} disabled={busy}>{t('admin.inProgress')}</ActionBtn>
                <ActionBtn onClick={() => updateStatus('completed', lang === 'th' ? 'เสร็จสิ้น' : 'Completed')} disabled={busy}>{t('admin.completed')}</ActionBtn>
                <ActionBtn danger onClick={() => { if (window.confirm(lang === 'th' ? 'ยกเลิก?' : 'Cancel?')) updateStatus('cancelled', lang === 'th' ? 'ยกเลิก' : 'Cancelled'); }} disabled={busy}>{t('admin.cancelRequest')}</ActionBtn>
              </div>
            </Card>

            <Card title={t('admin.assignOrganizer')}>
              <select value={assignment} onChange={(e) => setAssignment(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white mb-2">
                <option value="">--</option>
                {organizers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email} ({t(`role.${u.role}`)})</option>)}
              </select>
              <input value={assignNote} onChange={(e) => setAssignNote(e.target.value)} placeholder={lang === 'th' ? 'หมายเหตุ' : 'Notes'} className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm mb-2" />
              <button onClick={assignOrganizer} disabled={busy || !assignment} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold disabled:opacity-50">
                <UserPlus className="w-4 h-4" /> {t('admin.assignOrganizer')}
              </button>
              {organizers.length === 0 && <p className="text-xs text-neutral-400 mt-2">{lang === 'th' ? 'ยังไม่มีผู้ใช้ที่เป็นผู้จัด' : 'No organizer users yet'}</p>}
            </Card>
          </div>
        </div>
      )}

      {tab === 'quote' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title={lang === 'th' ? 'ออกใบเสนอราคา (Quotation)' : 'Issue Quotation'}>
            <div className="grid grid-cols-2 gap-3">
              <Num label={lang === 'th' ? 'ราคารวม' : 'Total price'} value={qPrice} onChange={setQPrice} />
              <Num label={lang === 'th' ? 'เงินมัดจำ' : 'Deposit'} value={qDeposit} onChange={setQDeposit} />
            </div>
            <textarea value={qDetails} onChange={(e) => setQDetails(e.target.value)} rows={3} placeholder={lang === 'th' ? 'รายการที่รวมในใบเสนอราคา' : 'Items included'} className="w-full mt-3 px-3 py-2 rounded-xl border border-neutral-200 text-sm" />
            <button onClick={createQuotation} disabled={busy || !(Number(qPrice) > 0)} className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">
              <FileText className="w-4 h-4" /> {lang === 'th' ? 'ส่งใบเสนอราคาให้ลูกค้า' : 'Send quotation to customer'}
            </button>
          </Card>
          <Card title={lang === 'th' ? 'ใบเสนอราคาทั้งหมด' : 'All Quotations'}>
            {quotations.length === 0 ? <p className="text-sm text-neutral-400">-</p> : (
              <div className="space-y-2">
                {quotations.map((q) => (
                  <div key={q.id} className="border border-neutral-100 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-orange-600">{formatPrice(q.price)}</span>
                      <QuoteBadge status={q.status} lang={lang} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">{formatDate(q.created_date, lang)} · {q.issued_by}</p>
                    {q.details && <p className="text-sm text-neutral-600 mt-1 whitespace-pre-line">{q.details}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title={lang === 'th' ? 'โน้ตภายใน' : 'Internal Notes'}>
            <textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm" />
            <button onClick={() => addNote(true)} className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold"><MessageSquarePlus className="w-4 h-4" /> {t('admin.addNote')}</button>
            <div className="mt-4 space-y-2">
              {notes.filter((n) => n.is_internal).map((n) => (
                <div key={n.id} className="bg-neutral-50 rounded-xl p-3">
                  <p className="text-sm text-neutral-700">{n.content}</p>
                  <p className="text-xs text-neutral-400 mt-1">{n.author_name} · {formatDate(n.created_date, lang)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card title={lang === 'th' ? 'ข้อความถึงลูกค้า' : 'Message to Customer'}>
            <textarea value={publicNote} onChange={(e) => setPublicNote(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm" placeholder={lang === 'th' ? 'ข้อความที่ลูกค้าเห็นได้' : 'Visible to customer'} />
            <button onClick={() => addNote(false)} className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold"><MessageSquarePlus className="w-4 h-4" /> {t('admin.addNote')}</button>
            <div className="mt-4 space-y-2">
              {notes.filter((n) => !n.is_internal).map((n) => (
                <div key={n.id} className="bg-orange-50 rounded-xl p-3">
                  <p className="text-sm text-neutral-700">{n.content}</p>
                  <p className="text-xs text-neutral-400 mt-1">{n.author_name} · {formatDate(n.created_date, lang)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'history' && (
        <Card title={t('requestDetail.statusHistory')}>
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.new_status} />
                    {h.old_status && <span className="text-xs text-neutral-400">{statusLabel(h.old_status, lang)} →</span>}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{formatDate(h.created_date, lang)} · {h.changed_by_name}</p>
                  {h.note && <p className="text-sm text-neutral-600 mt-1">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return <div className="bg-white rounded-2xl border border-neutral-100 p-5"><h2 className="font-semibold text-neutral-900 mb-3">{title}</h2>{children}</div>;
}
function Grid({ items }) {
  return <div className="grid grid-cols-2 gap-3 text-sm">{items.map(([l, v]) => <div key={l}><p className="text-xs text-neutral-400">{l}</p><p className="font-medium text-neutral-800">{v || '-'}</p></div>)}</div>;
}
function Num({ label, value, onChange }) {
  return <div><label className="block text-xs text-neutral-500 mb-1">{label}</label><input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm" /></div>;
}
function ActionBtn({ children, onClick, primary, danger, disabled }) {
  const cls = primary ? 'bg-orange-500 text-white' : danger ? 'border border-red-200 text-red-600' : 'border border-neutral-200 text-neutral-700';
  return <button onClick={onClick} disabled={disabled} className={`px-3.5 py-2 rounded-xl text-sm font-medium ${cls} disabled:opacity-50 hover:opacity-90`}>{children}</button>;
}
function QuoteBadge({ status, lang }) {
  const map = {
    sent: ['bg-blue-50 text-blue-700', lang === 'th' ? 'ส่งแล้ว (รอลูกค้า)' : 'Sent (waiting)'],
    accepted: ['bg-green-50 text-green-700', lang === 'th' ? 'ลูกค้าตกลง → Order' : 'Accepted → Order'],
    rejected: ['bg-red-50 text-red-600', lang === 'th' ? 'ถูกปฏิเสธ' : 'Rejected'],
  };
  const [cls, label] = map[status] || map.sent;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
}