import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage, localized } from '@/lib/i18n';
import { Image } from '@/components/ui/image';
import { REGIONS, REGION_PROVINCES, formatPrice } from '@/lib/constants';
import { Plus, Pencil, Trash2, X, Star, Search } from 'lucide-react';

const EMPTY = {
  name_th: '', name_en: '', desc_th: '', desc_en: '', category: 'tour', region: 'north',
  province: '', location_th: '', location_en: '', date: '', start_time: '', end_time: '',
  price: '', original_price: '', available_seats: '', total_seats: '', image_url: '', is_featured: false, is_promotion: false,
};

export default function EventsAdmin() {
  const { t, lang } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | event

  const load = () => {
    setLoading(true);
    base44.entities.Event.list('-created_date', 200)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = events.filter((e) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (e.name_th + e.name_en + (e.province || '')).toLowerCase().includes(q);
  });

  const save = async (data) => {
    const payload = {
      ...data,
      price: Number(data.price) || 0,
      original_price: data.original_price ? Number(data.original_price) : null,
      available_seats: Number(data.available_seats) || 0,
      total_seats: Number(data.total_seats) || 0,
    };
    if (editing === 'new') {
      await base44.entities.Event.create(payload);
    } else {
      await base44.entities.Event.update(editing.id, payload);
    }
    setEditing(null);
    load();
  };

  const remove = async (e) => {
    if (!window.confirm(lang === 'th' ? 'ลบรายการนี้?' : 'Delete this item?')) return;
    await base44.entities.Event.delete(e.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 bg-white max-w-sm">
          <Search className="w-4 h-4 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('common.search')} className="w-full outline-none text-sm" />
        </div>
        <button onClick={() => setEditing('new')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold">
          <Plus className="w-4 h-4" /> {t('admin.addEvent')}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">{t('common.loading')}</p>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">{lang === 'th' ? 'รายการ' : 'Event'}</th>
                <th className="text-left px-4 py-3">{t('common.category')}</th>
                <th className="text-left px-4 py-3">{t('common.province')}</th>
                <th className="text-left px-4 py-3">{t('common.price')}</th>
                <th className="text-left px-4 py-3">{t('common.availableSeats')}</th>
                <th className="text-right px-4 py-3">{t('common.edit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                        {e.image_url && <Image src={e.image_url} alt="" className="w-full h-full" fittingType="fill" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-800 line-clamp-1 flex items-center gap-1">{localized(e, 'name', lang)} {e.is_featured && <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />}</p>
                        <p className="text-xs text-neutral-400">{e.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{t(`cat.${e.category}`)}</td>
                  <td className="px-4 py-3">{e.province || '-'}</td>
                  <td className="px-4 py-3 font-medium text-orange-600">{formatPrice(e.price)}</td>
                  <td className="px-4 py-3">{e.available_seats}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditing(e)} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(e)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EventForm
          initial={editing === 'new' ? EMPTY : editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function EventForm({ initial, onClose, onSave }) {
  const { t, lang } = useLanguage();
  const [form, setForm] = useState({ ...initial, image_url: initial.image_url || '' });
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const provinces = form.region ? REGION_PROVINCES[form.region] || [] : [];

  const upload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set('image_url', file_url);
    } catch {} finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900">{initial.id ? t('admin.editEvent') : t('admin.addEvent')}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-neutral-400" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <In label={lang === 'th' ? 'ชื่อ (TH)' : 'Name (TH)'} value={form.name_th} onChange={(v) => set('name_th', v)} />
          <In label={lang === 'th' ? 'ชื่อ (EN)' : 'Name (EN)'} value={form.name_en} onChange={(v) => set('name_en', v)} />
          <div className="sm:col-span-2"><In label={lang === 'th' ? 'คำอธิบาย (TH)' : 'Description (TH)'} value={form.desc_th} onChange={(v) => set('desc_th', v)} textarea /></div>
          <div className="sm:col-span-2"><In label={lang === 'th' ? 'คำอธิบาย (EN)' : 'Description (EN)'} value={form.desc_en} onChange={(v) => set('desc_en', v)} textarea /></div>
          <Sel label={t('common.category')} value={form.category} onChange={(v) => set('category', v)} opts={[['tour', t('cat.tour')], ['event', t('cat.event')]]} />
          <Sel label={t('common.region')} value={form.region} onChange={(v) => set('region', v)} opts={REGIONS.map((r) => [r, t('region.' + r)])} />
          <Sel label={t('common.province')} value={form.province} onChange={(v) => set('province', v)} opts={[['', '-'], ...provinces.map((p) => [p, p])]} />
          <In label={lang === 'th' ? 'สถานที่ (TH)' : 'Location (TH)'} value={form.location_th} onChange={(v) => set('location_th', v)} />
          <In label={lang === 'th' ? 'สถานที่ (EN)' : 'Location (EN)'} value={form.location_en} onChange={(v) => set('location_en', v)} />
          <In label={t('common.date')} type="date" value={form.date} onChange={(v) => set('date', v)} />
          <In label={t('request.startTime')} type="time" value={form.start_time} onChange={(v) => set('start_time', v)} />
          <In label={t('request.endTime')} type="time" value={form.end_time} onChange={(v) => set('end_time', v)} />
          <In label={t('common.price')} type="number" value={form.price} onChange={(v) => set('price', v)} />
          <In label={lang === 'th' ? 'ราคาเดิม' : 'Original price'} type="number" value={form.original_price} onChange={(v) => set('original_price', v)} />
          <In label={t('common.availableSeats')} type="number" value={form.available_seats} onChange={(v) => set('available_seats', v)} />
          <In label={lang === 'th' ? 'ที่นั่งทั้งหมด' : 'Total seats'} type="number" value={form.total_seats} onChange={(v) => set('total_seats', v)} />
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{lang === 'th' ? 'รูปภาพ' : 'Image'}</label>
          {form.image_url ? (
            <div className="relative w-full h-32 rounded-xl overflow-hidden">
              <Image src={form.image_url} alt="" className="w-full h-full" fittingType="fill" />
              <button onClick={() => set('image_url', '')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl py-6 cursor-pointer hover:border-orange-400">
              {uploading ? <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" /> : <Plus className="w-6 h-6 text-neutral-400" />}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files[0])} />
            </label>
          )}
        </div>
        <div className="flex items-center gap-5 mt-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="accent-orange-500" /> {lang === 'th' ? 'แนะนำ/แสดงบนหน้าแรก' : 'Featured'}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.is_promotion} onChange={(e) => set('is_promotion', e.target.checked)} className="accent-orange-500" /> {lang === 'th' ? 'โปรโมชัน' : 'Promotion'}</label>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold">{t('common.cancel')}</button>
          <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold">{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
}

function In({ label, value, onChange, type = 'text', textarea }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:border-orange-400 outline-none text-sm" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:border-orange-400 outline-none text-sm" />
      )}
    </div>
  );
}
function Sel({ label, value, onChange, opts }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:border-orange-400 outline-none text-sm bg-white">
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}