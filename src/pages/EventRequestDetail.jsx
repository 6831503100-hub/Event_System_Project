import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatPrice, statusLabel, eventTypeLabel } from '@/lib/constants';
import { Upload, CheckCircle2, ArrowLeft, MessageSquare, History, DollarSign, X } from 'lucide-react';

export default function EventRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChanges, setShowChanges] = useState(false);
  const [changesText, setChangesText] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [slipUrl, setSlipUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.EventRequest.get(id),
      base44.entities.EventStatusHistory.filter({ entity_type: 'event_request', entity_id: id }, '-created_date', 50),
      base44.entities.Quotation.filter({ request_id: id }, '-created_date', 20).catch(() => []),
    ])
      .then(([r, h, q]) => { setReq(r); setHistory(h); setQuotations(q); })
      .catch(() => setReq(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const logHistory = async (oldStatus, newStatus, note) => {
    try {
      await base44.entities.EventStatusHistory.create({
        entity_type: 'event_request', entity_id: id, old_status: oldStatus, new_status: newStatus,
        changed_by: user?.id, changed_by_name: user?.full_name || user?.email, note,
      });
    } catch {}
  };

  const confirm = async () => {
    setBusy(true);
    const old = req.status;
    try {
      await base44.entities.EventRequest.update(id, { status: 'confirmed', deposit_paid: false });
      await logHistory(old, 'confirmed', lang === 'th' ? 'ลูกค้ายืนยันคำเสนอ' : 'Customer confirmed proposal');
      load();
    } finally { setBusy(false); }
  };

  const requestChanges = async () => {
    if (!changesText.trim()) return;
    setBusy(true);
    const old = req.status;
    try {
      await base44.entities.EventRequest.update(id, {
        status: 'under_review',
        customer_change_request: changesText,
      });
      await logHistory(old, 'under_review', lang === 'th' ? 'ลูกค้าขอแก้ไข: ' + changesText : 'Customer requested changes: ' + changesText);
      setShowChanges(false);
      setChangesText('');
      load();
    } finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!confirmAction(lang === 'th' ? 'ยกเลิกคำขอนี้?' : 'Cancel this request?')) return;
    setBusy(true);
    const old = req.status;
    try {
      await base44.entities.EventRequest.update(id, { status: 'cancelled' });
      await logHistory(old, 'cancelled', lang === 'th' ? 'ลูกค้ายกเลิกคำขอ' : 'Customer cancelled request');
      load();
    } finally { setBusy(false); }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setSlipUrl(file_url);
    } catch {} finally { setUploading(false); }
  };

  const payDeposit = async () => {
    if (!slipUrl) return;
    setBusy(true);
    const old = req.status;
    try {
      await base44.entities.EventRequest.update(id, { deposit_paid: true, deposit_slip_url: slipUrl, status: 'confirmed' });
      await logHistory(old, 'confirmed', lang === 'th' ? 'ชำระเงินมัดจำแล้ว' : 'Deposit paid');
      setShowDeposit(false);
      setSlipUrl('');
      load();
    } finally { setBusy(false); }
  };

  const respondQuotation = async (q, decision) => {
    setBusy(true);
    const old = req.status;
    try {
      await base44.entities.Quotation.update(q.id, { status: decision });
      if (decision === 'accepted') {
        await base44.entities.EventRequest.update(id, { status: 'confirmed' });
        await logHistory(old, 'confirmed', lang === 'th' ? 'ลูกค้าตกลงตามใบเสนอราคา → แปลงเป็น Order' : 'Customer accepted quotation → converted to Order');
      } else {
        await base44.entities.EventRequest.update(id, {
          status: 'under_review',
          customer_change_request: lang === 'th' ? 'ปฏิเสธใบเสนอราคา' : 'Quotation rejected',
        });
        await logHistory(old, 'under_review', lang === 'th' ? 'ลูกค้าปฏิเสธใบเสนอราคา' : 'Customer rejected quotation');
      }
      load();
    } finally { setBusy(false); }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-neutral-400">{t('common.loading')}</div>;
  if (!req) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-neutral-500 mb-4">{t('common.error')}</p>
      <Link to="/my-requests" className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">{t('common.back')}</Link>
    </div>
  );

  const latestQuotation = quotations[0];
  const canConfirm = req.status === 'waiting_customer_confirmation';
  const canRequestChanges = ['waiting_customer_confirmation', 'waiting_customer_info', 'under_review'].includes(req.status);
  const canCancel = !['completed', 'cancelled'].includes(req.status);
  const canPayDeposit = req.status === 'confirmed' && !req.deposit_paid && req.deposit != null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-orange-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex-1">{req.event_name}</h1>
        <StatusBadge status={req.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Requirements */}
          <Section title={lang === 'th' ? 'รายละเอียดคำขอ' : 'Request Details'}>
            <DetailGrid items={[
              [t('request.eventType'), eventTypeLabel(req.event_type, lang)],
              [t('request.date'), formatDate(req.date, lang)],
              [t('request.startTime'), req.start_time],
              [t('request.endTime'), req.end_time],
              [t('request.location'), req.location],
              [t('request.participants'), req.participants],
              [t('request.budget'), formatPrice(req.budget)],
              [t('request.theme'), req.theme],
            ]} />
            {req.equipment && <p className="mt-3 text-sm text-neutral-600"><b>{t('request.equipment')}:</b> {req.equipment}</p>}
            {req.details && <p className="mt-2 text-sm text-neutral-600"><b>{t('request.details')}:</b> {req.details}</p>}
            {req.reference_file_url && (
              <a href={req.reference_file_url} target="_blank" rel="noreferrer" className="inline-block mt-3 text-sm text-orange-600 underline">{lang === 'th' ? 'ดูไฟล์อ้างอิง' : 'View reference file'}</a>
            )}
          </Section>

          {/* Contact */}
          <Section title={lang === 'th' ? 'ข้อมูลผู้ติดต่อ' : 'Contact'}>
            <DetailGrid items={[
              [t('request.contactName'), req.contact_name],
              [t('request.phone'), req.phone],
              [t('request.email'), req.email],
            ]} />
          </Section>

          {/* Admin public notes */}
          {req.admin_notes_public && (
            <Section title={t('requestDetail.adminNotes')}>
              <div className="bg-orange-50 rounded-xl p-4 text-sm text-neutral-700 whitespace-pre-line">{req.admin_notes_public}</div>
            </Section>
          )}

          {/* Customer change request echo */}
          {req.customer_change_request && (
            <Section title={lang === 'th' ? 'คำขอแก้ไขจากลูกค้า' : 'Customer Change Request'}>
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-neutral-700 whitespace-pre-line">{req.customer_change_request}</div>
            </Section>
          )}

          {/* Quotation */}
          {latestQuotation && (
            <Section title={lang === 'th' ? 'ใบเสนอราคา (Quotation)' : 'Quotation'}>
              <div className="space-y-2.5 text-sm">
                <Row label={lang === 'th' ? 'ราคารวม' : 'Total price'} value={formatPrice(latestQuotation.price)} highlight />
                <Row label={lang === 'th' ? 'เงินมัดจำ' : 'Deposit'} value={formatPrice(latestQuotation.deposit)} />
                <Row label={lang === 'th' ? 'ยอดคงเหลือ' : 'Remaining'} value={formatPrice(Math.max(0, (latestQuotation.price || 0) - (latestQuotation.deposit || 0)))} />
              </div>
              {latestQuotation.details && <p className="mt-3 text-sm text-neutral-600 whitespace-pre-line">{latestQuotation.details}</p>}
              <div className="mt-3 text-xs text-neutral-400">
                {latestQuotation.status === 'sent'
                  ? (lang === 'th' ? 'รอการยืนยันจากคุณ' : 'Waiting for your confirmation')
                  : latestQuotation.status === 'accepted'
                    ? (lang === 'th' ? 'คุณตกลงราคานี้แล้ว (แปลงเป็น Order)' : 'Accepted (converted to Order)')
                    : (lang === 'th' ? 'ถูกปฏิเสธ' : 'Rejected')}
              </div>
              {latestQuotation.status === 'sent' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => respondQuotation(latestQuotation, 'accepted')} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-semibold text-sm">{lang === 'th' ? 'ตกลงตามใบเสนอราคา' : 'Accept quotation'}</button>
                  <button onClick={() => respondQuotation(latestQuotation, 'rejected')} disabled={busy} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-sm">{lang === 'th' ? 'ปฏิเสธ' : 'Reject'}</button>
                </div>
              )}
            </Section>
          )}

          {/* Status history */}
          <Section title={t('requestDetail.statusHistory')}>
            <div className="space-y-3">
              {history.length === 0 && <p className="text-sm text-neutral-400">-</p>}
              {history.map((h) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5" />
                    {history.indexOf(h) < history.length - 1 && <div className="w-0.5 flex-1 bg-neutral-200" />}
                  </div>
                  <div className="pb-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.new_status} />
                      {h.old_status && <span className="text-xs text-neutral-400">{statusLabel(h.old_status, lang)} →</span>}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{formatDate(h.created_date, lang)} · {h.changed_by_name || '-'}</p>
                    {h.note && <p className="text-sm text-neutral-600 mt-1">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Sidebar: pricing + actions */}
        <div className="space-y-5">
          <Section title={lang === 'th' ? 'การเงิน' : 'Pricing'}>
            <div className="space-y-2.5 text-sm">
              <Row label={t('requestDetail.proposedPrice')} value={formatPrice(req.proposed_price)} highlight />
              <Row label={t('requestDetail.deposit')} value={formatPrice(req.deposit)} />
              <Row label={t('requestDetail.remaining')} value={formatPrice(req.remaining_balance)} />
              {req.deposit_paid && (
                <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2.5 text-green-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {lang === 'th' ? 'ชำระมัดจำแล้ว' : 'Deposit paid'}
                </div>
              )}
            </div>
          </Section>

          <Section title={lang === 'th' ? 'การดำเนินการ' : 'Actions'}>
            <div className="space-y-2">
              {canPayDeposit && (
                <button onClick={() => setShowDeposit(true)} className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm">{t('requestDetail.payDeposit')}</button>
              )}
              {canConfirm && (
                <button onClick={confirm} disabled={busy} className="w-full py-2.5 rounded-xl bg-green-500 text-white font-semibold text-sm">{t('requestDetail.confirm')}</button>
              )}
              {canRequestChanges && (
                <button onClick={() => setShowChanges(true)} className="w-full py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-sm">{t('requestDetail.requestChanges')}</button>
              )}
              {canCancel && (
                <button onClick={cancel} disabled={busy} className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-sm">{t('requestDetail.cancelRequest')}</button>
              )}
              {!canConfirm && !canRequestChanges && !canCancel && !canPayDeposit && (
                <p className="text-sm text-neutral-400 text-center py-2">{lang === 'th' ? 'ไม่มีการดำเนินการที่พร้อมได้' : 'No actions available'}</p>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Request changes modal */}
      {showChanges && (
        <Modal title={t('requestDetail.changesPrompt')} onClose={() => setShowChanges(false)}>
          <textarea value={changesText} onChange={(e) => setChangesText(e.target.value)} rows={4} placeholder={t('requestDetail.changesPlaceholder')} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-orange-400 outline-none text-sm" />
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowChanges(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold">{t('common.cancel')}</button>
            <button onClick={requestChanges} disabled={busy || !changesText.trim()} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">{t('common.submit')}</button>
          </div>
        </Modal>
      )}

      {/* Deposit payment modal */}
      {showDeposit && (
        <Modal title={t('requestDetail.payDeposit')} onClose={() => setShowDeposit(false)}>
          <div className="text-center mb-4">
            <div className="w-40 h-40 mx-auto bg-white border-2 border-neutral-200 rounded-2xl flex items-center justify-center">
              <div className="grid grid-cols-8 gap-0.5 p-3">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-sm ${(i * 7 + 3) % 3 === 0 ? 'bg-neutral-900' : 'bg-white'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-2">{t('booking.qrPrompt')} <span className="font-bold text-orange-600">{formatPrice(req.deposit)}</span></p>
          </div>
          {slipUrl ? (
            <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">{lang === 'th' ? 'แนบสลิปแล้ว' : 'Slip attached'}</span>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl py-6 cursor-pointer hover:border-orange-400">
              {uploading ? <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" /> : <Upload className="w-6 h-6 text-neutral-400 mb-1" />}
              <span className="text-sm text-neutral-500">{t('booking.uploadSlip')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} />
            </label>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowDeposit(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold">{t('common.cancel')}</button>
            <button onClick={payDeposit} disabled={busy || !slipUrl} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">{t('booking.submitPayment')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function confirmAction(msg) { return window.confirm(msg); }

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <h2 className="font-semibold text-neutral-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function DetailGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs text-neutral-400">{label}</p>
          <p className="font-medium text-neutral-800">{value || '-'}</p>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={highlight ? 'font-bold text-orange-600 text-base' : 'font-medium text-neutral-800'}>{value}</span>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-neutral-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}