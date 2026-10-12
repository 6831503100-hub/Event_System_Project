import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  const { t, lang } = useLanguage();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    base44.entities.ContactInfo.list()
      .then((res) => setInfo(res[0] || null))
      .catch(() => setInfo(null));
  }, []);

  const company = info?.company_name || 'ThaiTourEvent';
  const phone = info?.phone || '02-123-4567';
  const email = info?.email || 'contact@thaitourevent.com';
  const address = info?.address || '123 Sukhumvit Rd, Bangkok, Thailand';

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">T</div>
            <span className="font-bold text-lg text-white">ThaiTour<span className="text-orange-500">Event</span></span>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {lang === 'th'
              ? 'แพลตฟอร์มจัดการทัวร์และ Event ครบวงจร สำหรับผู้จัดงานและผู้เข้าร่วม'
              : 'The all-in-one tour & event management platform for organizers and participants.'}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">{t('footer.links')}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-orange-400">{t('nav.home')}</Link></li>
            <li><Link to="/events" className="hover:text-orange-400">{t('nav.events')}</Link></li>
            <li><Link to="/my-bookings" className="hover:text-orange-400">{t('nav.myBookings')}</Link></li>
            <li><Link to="/my-requests" className="hover:text-orange-400">{t('nav.myRequests')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">{t('footer.contact')}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-400" /> {phone}</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-400" /> {email}</li>
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-orange-400 mt-0.5" /> {address}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">{t('footer.follow')}</h4>
          <div className="flex items-center gap-3">
            <a href={info?.facebook || '#'} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-orange-500 flex items-center justify-center transition-colors"><Facebook className="w-4 h-4" /></a>
            <a href={info?.instagram || '#'} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-orange-500 flex items-center justify-center transition-colors"><Instagram className="w-4 h-4" /></a>
            <span className="text-sm text-neutral-400">LINE: {info?.line || '@thaitour'}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} {company}. {t('footer.rights')}.
        </div>
      </div>
    </footer>
  );
}