import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/lib/i18n';
import { LayoutDashboard, Calendar } from 'lucide-react';

export default function OrganizerDashboard() {
  const { t } = useLanguage();
  const items = [
    { to: '/organizer', label: t('org.title'), icon: LayoutDashboard },
  ];
  return <AdminLayout title={t('org.title')} items={items} />;
}