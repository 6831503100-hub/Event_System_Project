// Regions, provinces, statuses, and helpers shared across the app

export const REGIONS = ['north', 'central', 'east', 'west', 'northeast', 'south'];

export const REGION_PROVINCES = {
  north: ['Chiang Mai', 'Chiang Rai', 'Mae Hong Son'],
  central: ['Bangkok', 'Ayutthaya', 'Nakhon Pathom'],
  east: ['Chonburi', 'Rayong', 'Chanthaburi'],
  west: ['Kanchanaburi', 'Phetchaburi', 'Prachuap Khiri Khan'],
  northeast: ['Khon Kaen', 'Nakhon Ratchasima', 'Udon Thani'],
  south: ['Phuket', 'Krabi', 'Surat Thani'],
};

export const PROVINCE_REGION = Object.entries(REGION_PROVINCES).reduce((acc, [region, provs]) => {
  provs.forEach((p) => { acc[p] = region; });
  return acc;
}, {});

export const CATEGORIES = ['tour', 'event'];

export const REQUEST_STATUSES = [
  'pending_review',
  'under_review',
  'waiting_customer_info',
  'waiting_customer_confirmation',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'approved', 'rejected'];

export const STATUS_LABELS = {
  pending_review: { th: 'รอตรวจสอบ', en: 'Pending Review' },
  under_review: { th: 'กำลังตรวจสอบ', en: 'Under Review' },
  waiting_customer_info: { th: 'รอข้อมูลจากลูกค้า', en: 'Waiting for Customer Info' },
  waiting_customer_confirmation: { th: 'รอยืนยันจากลูกค้า', en: 'Waiting for Confirmation' },
  confirmed: { th: 'ยืนยันแล้ว', en: 'Confirmed' },
  in_progress: { th: 'กำลังดำเนินการ', en: 'In Progress' },
  completed: { th: 'เสร็จสิ้น', en: 'Completed' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled' },
  pending: { th: 'รอดำเนินการ', en: 'Pending' },
  paid: { th: 'ชำระแล้ว', en: 'Paid' },
  approved: { th: 'อนุมัติแล้ว', en: 'Approved' },
  rejected: { th: 'ถูกปฏิเสธ', en: 'Rejected' },
};

export const STATUS_COLORS = {
  pending_review: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  waiting_customer_info: 'bg-purple-100 text-purple-700',
  waiting_customer_confirmation: 'bg-indigo-100 text-indigo-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export const EVENT_TYPE_LABELS = {
  'Party / Banquet': { th: 'ปาร์ตี้/งานเลี้ยง', en: 'Party / Banquet' },
  'Group Tour': { th: 'ทัวร์กลุ่ม', en: 'Group Tour' },
  'Conference / Seminar': { th: 'ประชุม/สัมมนา', en: 'Conference / Seminar' },
  'Wedding': { th: 'งานแต่งงาน', en: 'Wedding' },
  'Team Building Trip': { th: 'ทริปทีมบิลดิ้ง', en: 'Team Building Trip' },
  'Festival / Cultural': { th: 'เทศกาล/งานวัฒนธรรม', en: 'Festival / Cultural' },
  'Other': { th: 'อื่นๆ', en: 'Other' },
};

export function eventTypeLabel(value, lang) {
  const v = EVENT_TYPE_LABELS[value];
  return v ? v[lang] : (value || '-');
}

export function statusLabel(status, lang) {
  const s = STATUS_LABELS[status];
  return s ? s[lang] : status;
}

export function statusColor(status) {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
}

export function formatPrice(amount) {
  if (amount == null || isNaN(amount)) return '-';
  return '฿' + Number(amount).toLocaleString();
}

export function formatDate(dateStr, lang) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Thailand PromptPay QR placeholder generator (visual only)
export function promptPayPayload(amount) {
  // Static placeholder string — real PromptPay would encode tag 30 + tag 29 etc.
  return `000201010211306609A0000006703040102...${amount ? Math.round(amount) : ''}5802TH5303764630`;
}