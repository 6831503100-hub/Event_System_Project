import React from 'react';
import { statusColor, statusLabel } from '@/lib/constants';
import { useLanguage } from '@/lib/i18n';

export default function StatusBadge({ status }) {
  const { lang } = useLanguage();
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(status)}`}>
      {statusLabel(status, lang)}
    </span>
  );
}