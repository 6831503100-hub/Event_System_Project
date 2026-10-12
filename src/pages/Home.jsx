import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage, localized } from '@/lib/i18n';
import { Image } from '@/components/ui/image';
import HeroCarousel from '@/components/HeroCarousel';
import EventCard from '@/components/EventCard';
import ContactSection from '@/components/ContactSection';
import { formatDate, formatPrice } from '@/lib/constants';
import { Search, Sparkles, ArrowRight, Calendar, MapPin, Users, Tag } from 'lucide-react';

export default function Home() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    base44.entities.Event.list('-created_date', 100)
      .then((res) => setEvents(res))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = events.filter((e) => e.is_featured);
  const promotions = events.filter((e) => e.is_promotion || (e.original_price && e.original_price > e.price));
  const current = events;

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/events?q=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      {/* Search hero */}
      <section className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-orange-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-5xl font-bold mb-3">{t('home.searchTitle')}</h1>
            <p className="text-white/70 text-sm sm:text-base">{t('home.searchSub')}</p>
          </div>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-neutral-400 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('common.searchPlaceholder')}
                  className="w-full py-3 text-neutral-800 outline-none bg-transparent text-sm sm:text-base"
                />
              </div>
              <button type="submit" className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors">
                {t('common.search')}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Hero carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-10 relative z-10">
        {loading ? (
          <div className="aspect-[16/9] sm:aspect-[21/9] rounded-3xl bg-neutral-100 animate-pulse" />
        ) : featured.length ? (
          <HeroCarousel items={featured} />
        ) : (
          <div className="aspect-[16/9] sm:aspect-[21/9] rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400">
            {t('common.loading')}
          </div>
        )}
      </section>

      {/* Recommended / Promotion */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-500" /> {t('home.recommended')}
            </h2>
          </div>
        </div>
        {loading ? (
          <GridSkeleton />
        ) : promotions.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {promotions.slice(0, 8).map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <EmptyState text={t('common.noResults')} />
        )}
      </section>

      {/* Current tours/events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">{t('home.current')}</h2>
            <p className="text-neutral-500 text-sm mt-1">{t('home.currentSub')}</p>
          </div>
          <Link to="/events" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:gap-2.5 transition-all">
            {t('common.all')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <GridSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {current.slice(0, 9).map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </section>

      {/* Custom event CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('home.customCtaTitle')}</h2>
            <p className="text-white/90">{t('home.customCtaDesc')}</p>
          </div>
          <Link
            to="/custom-request"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-orange-600 font-semibold hover:bg-orange-50 transition-colors shadow-lg shrink-0"
          >
            {t('home.customCtaBtn')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <ContactSection />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-neutral-100 rounded animate-pulse" />
            <div className="h-3 bg-neutral-100 rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-neutral-100 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-12 text-neutral-400">{text}</div>
  );
}