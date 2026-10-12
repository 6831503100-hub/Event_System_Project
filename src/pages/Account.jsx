import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { UserCircle, Mail, Phone, Shield, CheckCircle2 } from 'lucide-react';

export default function Account() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // phone stored on user entity via updateMe if supported
    setFullName(user?.full_name || '');
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: fullName, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {} finally { setSaving(false); }
  };

  const role = user?.role || 'customer';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('account.title')}</h1>

      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-2xl font-bold">
            {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-neutral-900 text-lg">{fullName || user?.email}</p>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
              <Shield className="w-3 h-3" /> {t(`role.${role}`)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('account.fullName')}</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-orange-400 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('account.email')}</label>
            <input value={user?.email || ''} disabled className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-100 bg-neutral-50 text-sm text-neutral-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('account.phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="-" className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-orange-400 outline-none text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm">
            {saving ? t('common.loading') : t('account.save')}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> {t('account.saved')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}