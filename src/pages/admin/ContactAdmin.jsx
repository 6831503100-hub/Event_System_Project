import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { Save, CheckCircle2 } from 'lucide-react';

export default function ContactAdmin() {
  const { t, lang } = useLanguage();
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({ company_name: '', phone: '', email: '', line: '', facebook: '', instagram: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.ContactInfo.list()
      .then((res) => { setInfo(res[0] || null); if (res[0]) setForm(res[0]); })
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (info?.id) {
        await base44.entities.ContactInfo.update(info.id, form);
      } else {
        const created = await base44.entities.ContactInfo.create(form);
        setInfo(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
        <h2 className="font-semibold text-neutral-900">{t('admin.contactInfo')}</h2>
        <Field label={lang === 'th' ? 'ชื่อบริษัท' : 'Company name'} value={form.company_name} onChange={(v) => set('company_name', v)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('account.phone')} value={form.phone} onChange={(v) => set('phone', v)} />
          <Field label={t('account.email')} value={form.email} onChange={(v) => set('email', v)} />
          <Field label="LINE" value={form.line} onChange={(v) => set('line', v)} />
          <Field label="Facebook" value={form.facebook} onChange={(v) => set('facebook', v)} />
          <Field label="Instagram" value={form.instagram} onChange={(v) => set('instagram', v)} />
        </div>
        <Field label={lang === 'th' ? 'ที่อยู่' : 'Address'} value={form.address} onChange={(v) => set('address', v)} />
        <div className="flex items-center gap-3 pt-2">
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? t('common.loading') : t('common.save')}
          </button>
          {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><CheckCircle2 className="w-4 h-4" /> {t('account.saved')}</span>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-orange-400 outline-none text-sm" />
    </div>
  );
}