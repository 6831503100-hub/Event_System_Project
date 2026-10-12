import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Calendar, MapPin, UserCircle } from 'lucide-react';

export default function Navbar() {
  const { t, lang, toggle } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const role = user?.role || 'customer';
  const isAdmin = role === 'admin';
  const isOrganizer = role === 'organizer';

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/events', label: t('nav.events') },
    { to: '/my-requests', label: t('nav.myRequests'), auth: true },
    { to: '/my-bookings', label: t('nav.myBookings'), auth: true },
  ];

  const visibleLinks = navLinks.filter((l) => !l.auth || isAuthenticated);

  const handleLogout = () => {
    logout(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">T</div>
            <span className="font-bold text-lg text-neutral-900 hidden sm:block">ThaiTour<span className="text-orange-500">Event</span></span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {visibleLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-neutral-700 hover:text-orange-600 hover:bg-orange-50/60'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 text-sm font-semibold text-neutral-700 hover:border-orange-300 hover:text-orange-600 transition-colors"
              aria-label="Toggle language"
            >
              <span className={lang === 'th' ? 'text-orange-600' : 'text-neutral-400'}>TH</span>
              <span className="text-neutral-300">/</span>
              <span className={lang === 'en' ? 'text-orange-600' : 'text-neutral-400'}>EN</span>
            </button>

            {isAuthenticated ? (
              <div className="relative hidden lg:block" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-sm">
                    {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-100 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                    </div>
                    <Link to="/account" className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-600">
                      <UserCircle className="w-4 h-4" /> {t('nav.account')}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-600">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.admin')}
                      </Link>
                    )}
                    {isOrganizer && (
                      <Link to="/organizer" className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-600">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.organizer')}
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-neutral-700 hover:text-orange-600">{t('nav.login')}</Link>
                <Link to="/register" className="px-3.5 py-1.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">{t('nav.register')}</Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-neutral-100 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {visibleLinks.map((l) => (
              <Link key={l.to} to={l.to} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-orange-50 hover:text-orange-600">
                {l.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/account" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-orange-50">{t('nav.account')}</Link>
                {isAdmin && <Link to="/admin" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-orange-50">{t('nav.admin')}</Link>}
                {isOrganizer && <Link to="/organizer" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-orange-50">{t('nav.organizer')}</Link>}
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">{t('nav.logout')}</button>
              </>
            ) : (
              <div className="pt-2 space-y-2">
                <Link to="/login" className="block w-full text-center px-3 py-2.5 rounded-lg text-sm font-medium border border-neutral-200 text-neutral-700">{t('nav.login')}</Link>
                <Link to="/register" className="block w-full text-center px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-500">{t('nav.register')}</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}