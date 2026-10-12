import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage, localized } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import { formatDate, formatPrice } from '@/lib/constants';
import { Minus, Plus, Upload, CheckCircle2, QrCode, ArrowLeft, CreditCard } from 'lucide-react';

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: info, 2: payment, 3: success
  const [tickets, setTickets] = useState(1);
  const [form, setForm] = useState({ name: user?.full_name || '', phone: '', email: user?.email || '' });
  const [errors, setErrors] = useState({});
  const [slipUrl, setSlipUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    base44.entities.Event.get(id)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-neutral-400">{t('common.loading')}</div>;
  if (!event) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-neutral-500 mb-4">{t('common.error')}</p>
      <Link to="/events" className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">{t('common.back')}</Link>
    </div>
  );

  const total = (event.price || 0) * tickets;
  const maxTickets = Math.min(event.available_seats || 10, 10);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('common.required');
    if (!form.phone.trim()) e.phone = t('common.required');
    if (!form.email.trim()) e.email = t('common.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goPayment = () => {
    if (!validate()) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setSlipUrl(file_url);
    } catch (err) {
      setErrors({ ...errors, slip: t('common.error') });
    } finally {
      setUploading(false);
    }
  };

  const submitBooking = async () => {
    if (!slipUrl) { setErrors({ ...errors, slip: t('common.required') }); return; }
    setSubmitting(true);
    try {
      const created = await base44.entities.Booking.create({
        event_id: event.id,
        event_name: localized(event, 'name', lang),
        event_image_url: event.image_url,
        event_date: event.date,
        customer_name: form.name,
        phone: form.phone,
        email: form.email,
        ticket_count: tickets,
        total_price: total,
        status: 'pending',
        payment_status: 'paid',
        payment_slip_url: slipUrl,
        payment_method: 'PromptPay QR',
      });
      // log status history
      try {
        await base44.entities.EventStatusHistory.create({
          entity_type: 'booking',
          entity_id: created.id,
          old_status: null,
          new_status: 'pending',
          changed_by: user?.id,
          changed_by_name: user?.full_name || user?.email,
          note: lang === 'th' ? 'สร้างการจอง พร้อมแนบสลิป' : 'Booking created with payment slip',
        });
      } catch {}
      // decrement available seats
      try {
        await base44.entities.Event.update(event.id, { available_seats: Math.max(0, (event.available_seats || 0) - tickets) });
      } catch {}
      setBookingId(created.id);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors({ ...errors, submit: t('common.error') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-orange-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </button>

      <h1 className="text-2xl font-bold text-neutral-900 mb-5">{t('booking.title')}</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-orange-500' : 'bg-neutral-100'}`} />}
          </div>
        ))}
      </div>

      {/* Event summary */}
      <div className="flex gap-4 bg-white rounded-2xl border border-neutral-100 p-3 mb-5">
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
          <Image src={event.image_url} alt="" className="w-full h-full" fittingType="fill" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900 line-clamp-1">{localized(event, 'name', lang)}</p>
          <p className="text-sm text-neutral-500">{formatDate(event.date, lang)}</p>
          <p className="text-sm text-orange-600 font-semibold mt-1">{formatPrice(event.price)}</p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h2 className="font-semibold text-neutral-900 mb-3">{t('booking.selectTickets')}</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">{formatPrice(event.price)} × {tickets}</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setTickets((n) => Math.max(1, n - 1))} className="w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center hover:border-orange-400 disabled:opacity-40" disabled={tickets <= 1}><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center font-semibold">{tickets}</span>
                <button onClick={() => setTickets((n) => Math.min(maxTickets, n + 1))} className="w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center hover:border-orange-400 disabled:opacity-40" disabled={tickets >= maxTickets}><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
            <h2 className="font-semibold text-neutral-900">{t('booking.customerInfo')}</h2>
            <Field label={t('booking.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} />
            <Field label={t('booking.phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} error={errors.phone} />
            <Field label={t('booking.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} error={errors.email} />
          </div>

          <div className="bg-orange-50 rounded-2xl p-5 flex items-center justify-between">
            <span className="font-semibold text-neutral-700">{t('common.total')}</span>
            <span className="text-2xl font-bold text-orange-600">{formatPrice(total)}</span>
          </div>

          <button onClick={goPayment} className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors">
            {t('booking.payment')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h2 className="font-semibold text-neutral-900 mb-1">{t('booking.paymentInstructions')}</h2>
            <p className="text-sm text-neutral-500 mb-4">{t('booking.qrPrompt')} <span className="font-bold text-orange-600">{formatPrice(total)}</span></p>
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 bg-white border-2 border-neutral-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <QrCode className="w-32 h-32 text-neutral-800" />
                <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-neutral-500">PromptPay</div>
              </div>
              <p className="text-xs text-neutral-400 mt-2">{lang === 'th' ? ' PromptPay ที่ใช้สแกน' : 'Scan to pay via PromptPay'}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h2 className="font-semibold text-neutral-900 mb-1">{t('booking.uploadSlip')}</h2>
            <p className="text-sm text-neutral-500 mb-4">{t('booking.uploadSlipHint')}</p>
            {slipUrl ? (
              <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">{lang === 'th' ? 'แนบสลิปแล้ว' : 'Slip attached'}</span>
                <button onClick={() => setSlipUrl('')} className="ml-auto text-xs text-red-500 hover:underline">{t('common.cancel')}</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-xl py-8 cursor-pointer hover:border-orange-400 transition-colors">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-500">{t('booking.uploadSlip')}</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} />
              </label>
            )}
            {errors.slip && <p className="text-xs text-red-500 mt-2">{errors.slip}</p>}
          </div>

          {errors.submit && <p className="text-sm text-red-500 text-center">{errors.submit}</p>}

          <button onClick={submitBooking} disabled={submitting || !slipUrl} className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2">
            {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {t('booking.submitPayment')}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center py-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">{t('booking.success')}</h2>
          <p className="text-neutral-500 text-sm mb-6">{lang === 'th' ? 'รอแอดมินตรวจสอบการชำระเงิน' : 'Admin will review your payment shortly.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/my-bookings" className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm">{t('nav.myBookings')}</Link>
            <Link to="/events" className="px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-sm">{t('nav.events')}</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white outline-none text-sm transition-colors ${error ? 'border-red-300' : 'border-neutral-200 focus:border-orange-400'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}