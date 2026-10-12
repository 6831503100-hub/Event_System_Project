import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage, localized } from '@/lib/i18n';
import EventCard from '@/components/EventCard';
import { REGIONS, REGION_PROVINCES } from '@/lib/constants';
import { Search, SlidersHorizontal, X, ChevronDown, MapPin } from 'lucide-react';

export default function Events() {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('all'); // all | tour | event
  const [region, setRegion] = useState('all');
  const [province, setProvince] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    base44.entities.Event.list('-created_date', 200)
      .then((res) => setEvents(res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // keep url query in sync
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setQuery(q);
  }, [searchParams]);

  const provinces = region === 'all' ? [] : REGION_PROVINCES[region] || [];

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (category === 'tour' || category === 'all') {
        if (region !== 'all' && e.region !== region) return false;
        if (province !== 'all' && e.province !== province) return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const name = (localized(e, 'name', lang) + ' ' + localized(e, 'name', lang === 'th' ? 'en' : 'th')).toLowerCase();
        const loc = (localized(e, 'location', lang) + ' ' + (e.province || '')).toLowerCase();
        if (!name.includes(q) && !loc.includes(q)) return false;
      }
      return true;
    });
  }, [events, category, region, province, query, lang]);

  const heading = useMemo(() => {
    if (category === 'event') return t('events.events');
    if (category === 'tour') {
      if (province !== 'all') return `${t('events.tours')} ${province}`;
      if (region !== 'all') return `${t('events.tours')} ${t('region.' + region)}`;
      return t('events.tours');
    }
    return t('events.title');
  }, [category, region, province, t]);

  const selectCategory = (c) => {
    setCategory(c);
    setRegion('all');
    setProvince('all');
  };

  const selectRegion = (r) => {
    setRegion(r);
    setProvince('all');
  };

  const reset = () => {
    setCategory('all');
    setRegion('all');
    setProvince('all');
    setQuery('');
    setSearchParams({});
  };

  const hasFilters = category !== 'all' || region !== 'all' || province !== 'all' || query.trim();

  return (
    <div>
      {/* Page heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{heading}</h1>
        <p className="text-neutral-500 text-sm mt-1">
          {loading ? t('common.loading') : `${filtered.length} ${lang === 'th' ? 'รายการ' : 'items'}`}
        </p>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-y border-neutral-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
          {/* Search + category row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 focus-within:border-orange-400 bg-white">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.searchPlaceholder')}
                className="w-full outline-none text-sm text-neutral-800 bg-transparent"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <Pill active={category === 'all'} onClick={() => selectCategory('all')}>{t('common.all')}</Pill>
              <Pill active={category === 'tour'} onClick={() => selectCategory('tour')}>{t('cat.tour')}</Pill>
              <Pill active={category === 'event'} onClick={() => selectCategory('event')}>{t('cat.event')}</Pill>
            </div>
          </div>

          {/* Region + province filters (collapsible on mobile) */}
          {(category === 'tour' || category === 'all') && (
            <div className="space-y-3">
              {/* Mobile toggle button */}
              <button
                onClick={() => setFiltersOpen((o) => !o)}
                className="sm:hidden w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700"
              >
                <span className="flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  {region === 'all' ? t('common.region') : `${t('region.' + region)}${province !== 'all' ? ` · ${province}` : ''}`}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Region pills */}
              <div className={`${filtersOpen ? 'flex' : 'hidden'} sm:flex items-center gap-2 flex-wrap`}>
                <span className="text-xs font-semibold text-neutral-400 shrink-0 hidden sm:inline">{t('common.region')}:</span>
                <Pill small active={region === 'all'} onClick={() => selectRegion('all')}>{t('common.all')}</Pill>
                {REGIONS.map((r) => (
                  <Pill key={r} small active={region === r} onClick={() => selectRegion(r)}>{t('region.' + r)}</Pill>
                ))}
              </div>

              {/* Province pills (only when a region is selected) */}
              {region !== 'all' && provinces.length > 0 && (
                <div className={`${filtersOpen ? 'flex' : 'hidden'} sm:flex items-center gap-2 flex-wrap`}>
                  <span className="text-xs font-semibold text-neutral-400 shrink-0 hidden sm:inline">{t('common.province')}:</span>
                  <Pill small active={province === 'all'} onClick={() => setProvince('all')}>{t('common.all')}</Pill>
                  {provinces.map((p) => (
                    <Pill key={p} small active={province === p} onClick={() => setProvince(p)}>{p}</Pill>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasFilters && (
            <div className="flex items-center justify-between">
              <button onClick={reset} className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-orange-600">
                <X className="w-3.5 h-3.5" /> {t('common.reset')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-8 scroll-mt-44">
        {error ? (
          <div className="text-center py-16">
            <p className="text-neutral-500 mb-3">{t('common.error')}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">{t('common.retry')}</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                  <div className="h-3 bg-neutral-100 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <SlidersHorizontal className="w-7 h-7 text-neutral-300" />
            </div>
            <p className="text-neutral-500 mb-4">{t('events.noResults')}</p>
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">{t('common.reset')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children, small }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full font-medium transition-colors whitespace-nowrap ${
        small ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'
      } ${
        active
          ? 'bg-orange-500 text-white border border-orange-500'
          : 'bg-white text-neutral-600 border border-neutral-200 hover:border-orange-300 hover:text-orange-600'
      }`}
    >
      {children}
    </button>
  );
}