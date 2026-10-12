import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Upload, CheckCircle2, ArrowLeft } from 'lucide-react';

const EVENT_TYPES = [
  { th: 'ปาร์ตี้/งานเลี้ยง', en: 'Party / Banquet' },
  { th: 'ทัวร์กลุ่ม', en: 'Group Tour' },
  { th: 'ประชุม/สัมมนา', en: 'Conference / Seminar' },
  { th: 'งานแต่งงาน', en: 'Wedding' },
  { th: 'ทริปทีมบิลดิ้ง', en: 'Team Building Trip' },
  { th: 'เทศกาล/งานวัฒนธรรม', en: 'Festival / Cultural' },
  { th: 'อื่นๆ', en: 'Other' },
];

export default function CustomEventRequest() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    event_name: '', event_type: '', date: '', start_time: '', end_time: '',
    location: '', participants: '', budget: '', theme: '', equipment: '', details: '',
    contact_name: user?.full_name || '', phone: '', email: user?.email || '',
  });
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    ['event_name', 'event_type', 'date', 'location', 'contact_name', 'phone', 'email'].forEach((k) => {
      if (!String(form[k] || '').trim()) e[k] = t('common.required');
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setFileUrl(file_url);
    } catch {} finally { setUploading(false); }
  };

  const submit = async () => {
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setSubmitting(true);
    try {
      const created = await base44.entities.EventRequest.create({
        ...form,
        participants: Number(form.participants) || 0,
        budget: Number(form.budget) || 0,
        reference_file_url: fileUrl,
        status: 'pending_review',
      });
      try {
        await base44.entities.EventStatusHistory.create({
          entity_type: 'event_request',
          entity_id: created.id,
          old_status: null,
          new_status: 'pending_review',
          changed_by: user?.id,
          changed_by_name: user?.full_name || user?.email,
          note: lang === 'th' ? 'ส่งคำขอใหม่' : 'New request submitted',
        });
      } catch {}
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrors({ submit: t('common.error') });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{t('request.success')}</h2>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={() => navigate('/my-requests')} className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm">{t('nav.myRequests')}</button>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-sm">{t('nav.home')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-orange-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">{t('request.title')}</h1>
      <p className="text-neutral-500 text-sm mb-6">{lang === 'th' ? 'แจ้งความต้องการของคุณ ทีมงานจะติดต่อกลับ' : 'Tell us your needs and our team will reach out.'}</p>

      <div className="bg-white rounded-2xl border border-neutral-100 p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('request.eventName')} value={form.event_name} onChange={(v) => set('event_name', v)} error={errors.event_name} required />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.eventType')} *</label>
            <select value={form.event_type} onChange={(e) => set('event_type', e.target.value)} className={`w-full px-3.5 py-2.5 rounded-xl border bg-white outline-none text-sm ${errors.event_type ? 'border-red-300' : 'border-neutral-200 focus:border-orange-400'}`}>
              <option value="">--</option>
              {EVENT_TYPES.map((tp) => <option key={tp.en} value={tp.en}>{lang === 'th' ? tp.th : tp.en}</option>)}
            </select>
            {errors.event_type && <p className="text-xs text-red-500 mt-1">{errors.event_type}</p>}
          </div>
          <Field label={t('request.date')} type="date" value={form.date} onChange={(v) => set('date', v)} error={errors.date} required />
          <Field label={t('request.location')} value={form.location} onChange={(v) => set('location', v)} error={errors.location} required />
          <Field label={t('request.startTime')} type="time" value={form.start_time} onChange={(v) => set('start_time', v)} />
          <Field label={t('request.endTime')} type="time" value={form.end_time} onChange={(v) => set('end_time', v)} />
          <Field label={t('request.participants')} type="number" value={form.participants} onChange={(v) => set('participants', v)} />
          <Field label={t('request.budget')} type="number" value={form.budget} onChange={(v) => set('budget', v)} />
          <Field label={t('request.theme')} value={form.theme} onChange={(v) => set('theme', v)} />
          <Field label={t('request.equipment')} value={form.equipment} onChange={(v) => set('equipment', v)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.details')}</label>
          <textarea value={form.details} onChange={(e) => set('details', e.target.value)} rows={4} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-orange-400 outline-none text-sm" />
        </div>

        <div className="border-t border-neutral-100 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={t('request.contactName')} value={form.contact_name} onChange={(v) => set('contact_name', v)} error={errors.contact_name} required />
          <Field label={t('request.phone')} value={form.phone} onChange={(v) => set('phone', v)} error={errors.phone} required />
          <Field label={t('request.email')} value={form.email} onChange={(v) => set('email', v)} error={errors.email} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('request.reference')}</label>
          {fileUrl ? (
            <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">{lang === 'th' ? 'แนบไฟล์แล้ว' : 'File attached'}</span>
              <button onClick={() => setFileUrl('')} className="ml-auto text-xs text-red-500 hover:underline">{t('common.cancel')}</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl py-6 cursor-pointer hover:border-orange-400 transition-colors">
              {uploading ? <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" /> : <Upload className="w-6 h-6 text-neutral-400 mb-1" />}
              <span className="text-sm text-neutral-500">{t('request.reference')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} />
            </label>
          )}
        </div>

        {errors.submit && <p className="text-sm text-red-500 text-center">{errors.submit}</p>}

        <button onClick={submit} disabled={submitting} className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold transition-colors">
          {submitting ? t('common.loading') : t('request.submit')}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, error, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}{required && ' *'}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white outline-none text-sm transition-colors ${error ? 'border-red-300' : 'border-neutral-200 focus:border-orange-400'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}