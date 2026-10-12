import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/lib/i18n';
import { LayoutDashboard, Calendar, CreditCard, Inbox, Users, Phone } from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const items = [
    { to: '/admin', label: t('admin.overview'), icon: LayoutDashboard },
    { to: '/admin/events', label: t('admin.events'), icon: Calendar },
    { to: '/admin/bookings', label: t('admin.bookings'), icon: CreditCard },
    { to: '/admin/requests', label: t('admin.requests'), icon: Inbox },
    { to: '/admin/users', label: t('admin.users'), icon: Users },
    { to: '/admin/contact', label: t('admin.contact'), icon: Phone },
  ];
  return <AdminLayout title={t('admin.title')} items={items} />;
}