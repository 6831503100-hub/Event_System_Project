import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/i18n';
import { formatDate } from '@/lib/constants';
import { Search, Shield } from 'lucide-react';

export default function UsersAdmin() {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    base44.entities.User.list()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (u, role) => {
    try {
      await base44.entities.User.update(u.id, { role });
      setUsers((us) => us.map((x) => x.id === u.id ? { ...x, role } : x));
    } catch {}
  };

  const filtered = users.filter((u) => {
    if (!query.trim()) return true;
    return (u.full_name + u.email).toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 bg-white max-w-sm">
        <Search className="w-4 h-4 text-neutral-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('common.search')} className="w-full outline-none text-sm" />
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">{t('common.loading')}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">{lang === 'th' ? 'ชื่อ' : 'Name'}</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">{t('account.role')}</th>
                <th className="text-left px-4 py-3">{lang === 'th' ? 'วันที่สมัคร' : 'Joined'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800">{u.full_name || '-'}</td>
                  <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role || 'customer'} onChange={(e) => changeRole(u, e.target.value)} className="px-2 py-1 rounded-lg border border-neutral-200 text-xs bg-white">
                      <option value="customer">{t('role.customer')}</option>
                      <option value="organizer">{t('role.organizer')}</option>
                      <option value="admin">{t('role.admin')}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(u.created_date, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}