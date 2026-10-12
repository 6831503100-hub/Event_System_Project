import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, LayoutDashboard, Calendar, CreditCard, Inbox, Users, Phone, ClipboardList, ArrowLeft, LogOut } from 'lucide-react';

export default function AdminLayout({ title, items }) {
  const { t, lang, toggle } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(false); navigate('/'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">T</div>
          <div>
            <p className="font-bold text-white text-sm">ThaiTourEvent</p>
            <p className="text-xs text-neutral-400">{title}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = location.pathname === item.to || (item.to !== '/admin' && item.to !== '/organizer' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-orange-500 text-white' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-neutral-800 space-y-1">
        <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> {t('nav.home')}
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" /> {t('nav.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-neutral-900 fixed inset-y-0 left-0 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-neutral-900 h-full">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-neutral-100">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-neutral-900">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="px-2.5 py-1 rounded-lg border border-neutral-200 text-sm font-semibold">
              <span className={lang === 'th' ? 'text-orange-600' : 'text-neutral-400'}>TH</span>
              <span className="text-neutral-300">/</span>
              <span className={lang === 'en' ? 'text-orange-600' : 'text-neutral-400'}>EN</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-sm">
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}