import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram } from 'lucide-react';

export default function ContactSection() {
  const { t, lang } = useLanguage();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    base44.entities.ContactInfo.list()
      .then((res) => setInfo(res[0] || null))
      .catch(() => setInfo(null));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('home.contactTitle')}</h2>
        <p className="mt-2 text-neutral-500 max-w-xl mx-auto">{t('home.contactDesc')}</p>
      </div>
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 sm:p-10 border border-orange-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ContactItem icon={Phone} label={lang === 'th' ? 'โทร' : 'Phone'} value={info?.phone || '02-123-4567'} href={`tel:${info?.phone || ''}`} />
          <ContactItem icon={Mail} label="Email" value={info?.email || 'contact@thaitourevent.com'} href={`mailto:${info?.email || ''}`} />
          <ContactItem icon={MessageCircle} label="LINE" value={info?.line || '@thaitour'} />
          <ContactItem icon={Facebook} label="Facebook" value={info?.facebook || 'ThaiTourEvent'} href={info?.facebook || '#'} />
          <ContactItem icon={Instagram} label="Instagram" value={info?.instagram || '@thaitourevent'} href={info?.instagram || '#'} />
          <ContactItem icon={MapPin} label={lang === 'th' ? 'ที่อยู่' : 'Address'} value={info?.address || '123 Sukhumvit Rd, Bangkok'} />
        </div>
      </div>
    </section>
  );
}

function ContactItem({ icon: Icon, label, value, href }) {
  const content = (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-neutral-100 hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-neutral-800 truncate">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer" className="block">{content}</a> : content;
}