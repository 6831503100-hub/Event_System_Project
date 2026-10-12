import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client"; // ← แก้ path ให้ตรงกับที่โปรเจกต์ทีมใช้ import base44

// ===== ค่าคงที่ตาม Booking.jsonc / Event.jsonc =====
const PAY = { pending: "ยังไม่ชำระ", paid: "รอตรวจสลิป", approved: "อนุมัติแล้ว", rejected: "ปฏิเสธสลิป" };
const BK = { pending: "รอดำเนินการ", confirmed: "ยืนยันแล้ว", cancelled: "ยกเลิกแล้ว" };
const CAT = { event: "Event", tour: "ทัวร์" };
const REGIONS = { north: "เหนือ", central: "กลาง", east: "ตะวันออก", west: "ตะวันตก", northeast: "อีสาน", south: "ใต้" };
const EMPTY = {
  name_th: "", name_en: "", category: "event", region: "north", province: "", location_th: "",
  date: "", start_time: "", end_time: "", price: "", total_seats: "", available_seats: "",
  image_url: "", desc_th: "", is_featured: false, is_promotion: false,
};
const baht = (n) => Number(n || 0).toLocaleString("th-TH");

export default function AdminDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [e, b] = await Promise.all([
        base44.entities.Event.list("-created_date", 500),
        base44.entities.Booking.list("-created_date", 500),
      ]);
      setEvents(e);
      setBookings(b);
      setError("");
    } catch (err) {
      setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="adm">
      <style>{css}</style>
      <h1>Admin Dashboard</h1>
      <nav>
        {[["dashboard", "ภาพรวม"], ["events", "จัดการ Event/ทัวร์"], ["bookings", "รายการจอง"]].map(([k, v]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{v}</button>
        ))}
        <button onClick={load}>รีเฟรช</button>
      </nav>
      {error && <p className="err">{error}</p>}
      {loading ? <p>กำลังโหลด...</p> : (
        <>
          {tab === "dashboard" && <Overview events={events} bookings={bookings} />}
          {tab === "events" && <Events events={events} setEvents={setEvents} />}
          {tab === "bookings" && <Bookings bookings={bookings} setBookings={setBookings} />}
        </>
      )}
    </div>
  );
}

// ===== 1) Dashboard ภาพรวม =====
function Overview({ events, bookings }) {
  const today = new Date().toISOString().slice(0, 10);
  const s = useMemo(() => {
    const ok = bookings.filter((b) => b.payment_status === "approved");
    return {
      events: events.filter((e) => e.category === "event").length,
      tours: events.filter((e) => e.category === "tour").length,
      bookings: bookings.length,
      waiting: bookings.filter((b) => b.payment_status === "paid" && b.status !== "cancelled").length,
      revenue: ok.reduce((t, b) => t + (b.total_price || 0), 0),
      tickets: ok.reduce((t, b) => t + (b.ticket_count || 0), 0),
    };
  }, [events, bookings]);
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  return (
    <>
      <div className="stats">
        <Stat n={s.events} t="Event" /><Stat n={s.tours} t="ทัวร์" /><Stat n={s.bookings} t="การจองทั้งหมด" />
        <Stat n={s.waiting} t="รอตรวจสลิป" warn /><Stat n={baht(s.revenue)} t="รายได้ที่อนุมัติ (บาท)" /><Stat n={s.tickets} t="ตั๋วที่ขายได้" />
      </div>
      <h2>Event ที่กำลังจะถึง</h2>
      <table>
        <thead><tr><th>ชื่อ</th><th>วันที่</th><th>ที่นั่งว่าง</th></tr></thead>
        <tbody>
          {upcoming.map((e) => <tr key={e.id}><td>{e.name_th}</td><td>{e.date}</td><td>{e.available_seats ?? "-"}/{e.total_seats ?? "-"}</td></tr>)}
          {!upcoming.length && <tr><td colSpan="3">ไม่มี Event ที่กำลังจะถึง</td></tr>}
        </tbody>
      </table>
    </>
  );
}
const Stat = ({ n, t, warn }) => <div className={"stat" + (warn ? " warn" : "")}><b>{n}</b><span>{t}</span></div>;

// ===== 2) จัดการ Event / ทัวร์ =====
function Events({ events, setEvents }) {
  const [cat, setCat] = useState("event"); // เน้น Event เป็นหลัก
  const [form, setForm] = useState(null);  // null = ปิดฟอร์ม
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const list = events.filter((e) => !cat || e.category === cat);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditId(null); setForm({ ...EMPTY, category: cat || "event" }); };
  const openEdit = (e) => { setEditId(e.id); setForm({ ...EMPTY, ...e }); };

  const save = async () => {
    if (!form.name_th.trim() || !form.name_en.trim() || !form.date || form.price === "") {
      return alert("กรอกชื่อไทย ชื่ออังกฤษ วันที่ และราคาให้ครบ");
    }
    const num = (v) => (v === "" || v == null ? undefined : Number(v));
    const total = num(form.total_seats);
    const payload = {
      ...form, price: Number(form.price), total_seats: total,
      available_seats: num(form.available_seats) ?? (editId ? undefined : total),
    };
    Object.keys(payload).forEach((k) => (payload[k] === undefined || payload[k] === "") && delete payload[k]);
    delete payload.id; delete payload.created_date; delete payload.updated_date; delete payload.created_by;
    try {
      setSaving(true);
      if (editId) {
        const u = await base44.entities.Event.update(editId, payload);
        setEvents((l) => l.map((x) => (x.id === editId ? { ...x, ...u } : x)));
      } else {
        const c = await base44.entities.Event.create(payload);
        setEvents((l) => [c, ...l]);
      }
      setForm(null);
    } catch (err) { alert("บันทึกไม่สำเร็จ: " + (err.message || err)); }
    finally { setSaving(false); }
  };

  const del = async (e) => {
    if (!confirm(`ลบ "${e.name_th}" ?`)) return;
    try { await base44.entities.Event.delete(e.id); setEvents((l) => l.filter((x) => x.id !== e.id)); }
    catch (err) { alert("ลบไม่สำเร็จ: " + (err.message || err)); }
  };

  return (
    <>
      <div className="bar">
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="event">Event</option><option value="tour">ทัวร์</option><option value="">ทั้งหมด</option>
        </select>
        <button className="ok" onClick={openNew}>+ เพิ่มใหม่</button>
      </div>

      {form && (
        <div className="card form">
          <h3>{editId ? "แก้ไข" : "เพิ่ม"} {CAT[form.category]}</h3>
          <div className="grid">
            <label>ชื่อ (ไทย)*<input value={form.name_th} onChange={(e) => set("name_th", e.target.value)} /></label>
            <label>ชื่อ (อังกฤษ)*<input value={form.name_en} onChange={(e) => set("name_en", e.target.value)} /></label>
            <label>ประเภท*<select value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="event">Event</option><option value="tour">ทัวร์</option></select></label>
            <label>ภูมิภาค<select value={form.region} onChange={(e) => set("region", e.target.value)}>
              {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>จังหวัด<input value={form.province} onChange={(e) => set("province", e.target.value)} /></label>
            <label>สถานที่<input value={form.location_th} onChange={(e) => set("location_th", e.target.value)} /></label>
            <label>วันที่*<input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></label>
            <label>เวลาเริ่ม<input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} /></label>
            <label>เวลาจบ<input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} /></label>
            <label>ราคา (บาท)*<input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></label>
            <label>ที่นั่งทั้งหมด<input type="number" value={form.total_seats} onChange={(e) => set("total_seats", e.target.value)} /></label>
            <label>ที่นั่งว่าง<input type="number" value={form.available_seats} onChange={(e) => set("available_seats", e.target.value)} /></label>
            <label>ลิงก์รูปภาพ<input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} /></label>
          </div>
          <label>รายละเอียด (ไทย)<textarea rows="3" value={form.desc_th} onChange={(e) => set("desc_th", e.target.value)} /></label>
          <label className="chk"><input type="checkbox" checked={!!form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> แนะนำ</label>
          <label className="chk"><input type="checkbox" checked={!!form.is_promotion} onChange={(e) => set("is_promotion", e.target.checked)} /> โปรโมชัน</label>
          <div className="bar">
            <button className="ok" disabled={saving} onClick={save}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
            <button onClick={() => setForm(null)}>ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="scroll"><table>
        <thead><tr><th>ชื่อ</th><th>ประเภท</th><th>วันที่</th><th>ราคา</th><th>ที่นั่งว่าง</th><th></th></tr></thead>
        <tbody>
          {list.map((e) => (
            <tr key={e.id}>
              <td>{e.name_th}{e.is_featured && " ⭐"}{e.is_promotion && " 🏷️"}</td>
              <td>{CAT[e.category]}</td><td>{e.date}</td><td>{baht(e.price)}</td>
              <td>{e.available_seats ?? "-"}/{e.total_seats ?? "-"}</td>
              <td><button onClick={() => openEdit(e)}>แก้ไข</button> <button className="no" onClick={() => del(e)}>ลบ</button></td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan="6">ไม่มีรายการ</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}

// ===== 3) รายการจอง + ตรวจสลิป =====
function Bookings({ bookings, setBookings }) {
  const [pay, setPay] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState("");

  const list = bookings.filter((b) =>
    (!pay || b.payment_status === pay) &&
    `${b.customer_name} ${b.event_name} ${b.phone}`.toLowerCase().includes(q.toLowerCase()));
  const cur = bookings.find((b) => b.id === sel);

  const open = (b) => { setSel(b.id); setNote(b.admin_note || ""); };
  const act = async (b, patch) => {
    try {
      const u = await base44.entities.Booking.update(b.id, patch);
      setBookings((l) => l.map((x) => (x.id === b.id ? { ...x, ...patch, ...u } : x)));
    } catch (err) { alert("อัปเดตไม่สำเร็จ: " + (err.message || err)); }
  };

  return (
    <>
      <div className="bar">
        <input placeholder="ค้นหาชื่อ / Event / เบอร์" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={pay} onChange={(e) => setPay(e.target.value)}>
          <option value="">ทุกสถานะชำระเงิน</option>
          {Object.entries(PAY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="scroll"><table>
        <thead><tr><th>ลูกค้า</th><th>Event</th><th>ตั๋ว</th><th>ยอด</th><th>การจอง</th><th>ชำระเงิน</th><th></th></tr></thead>
        <tbody>
          {list.map((b) => (
            <tr key={b.id}>
              <td>{b.customer_name}</td><td>{b.event_name || "-"}</td><td>{b.ticket_count}</td><td>{baht(b.total_price)}</td>
              <td><span className={"tag " + b.status}>{BK[b.status]}</span></td>
              <td><span className={"tag " + b.payment_status}>{PAY[b.payment_status]}</span></td>
              <td><button onClick={() => open(b)}>ดู/จัดการ</button></td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan="7">ไม่พบรายการ</td></tr>}
        </tbody>
      </table></div>

      {cur && (
        <div className="card form">
          <h3>การจองของ {cur.customer_name}</h3>
          <p>Event: {cur.event_name || cur.event_id} · วันที่ {cur.event_date || "-"} · {cur.ticket_count} ที่นั่ง · {baht(cur.total_price)} บาท</p>
          <p>โทร: {cur.phone || "-"} · อีเมล: {cur.email || "-"} · ช่องทางชำระ: {cur.payment_method || "-"}</p>
          {cur.payment_slip_url
            ? <a href={cur.payment_slip_url} target="_blank" rel="noreferrer"><img className="slip" src={cur.payment_slip_url} alt="สลิป" /></a>
            : <p className="muted">ยังไม่มีสลิป</p>}
          <label>หมายเหตุแอดมิน<textarea rows="2" value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <div className="bar">
            <button className="ok" disabled={!cur.payment_slip_url}
              onClick={() => act(cur, { payment_status: "approved", status: "confirmed", admin_note: note })}>อนุมัติสลิป</button>
            <button className="no" onClick={() => act(cur, { payment_status: "rejected", admin_note: note })}>ปฏิเสธสลิป</button>
            <button className="no" onClick={() => confirm("ยกเลิกการจองนี้?") && act(cur, { status: "cancelled", admin_note: note })}>ยกเลิกการจอง</button>
            <button onClick={() => act(cur, { admin_note: note })}>บันทึกหมายเหตุ</button>
            <button onClick={() => setSel(null)}>ปิด</button>
          </div>
        </div>
      )}
    </>
  );
}

const css = `
.adm{max-width:1000px;margin:0 auto;padding:16px;font-family:system-ui,"Noto Sans Thai",sans-serif}
.adm h1{font-size:1.4rem;margin:0 0 12px}.adm h2{font-size:1.1rem;margin:20px 0 8px}
.adm nav{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.adm nav .on{background:#1f6f54;color:#fff;border-color:#1f6f54}
.adm button,.adm input,.adm select,.adm textarea{font:inherit;padding:6px 10px;border:1px solid #ccd;border-radius:6px;background:#fff;color:#111}
.adm button{cursor:pointer}.adm button:disabled{opacity:.5;cursor:default}
.adm .ok{background:#1f6f54;color:#fff;border-color:#1f6f54}.adm .no{color:#b83a3a;border-color:#b83a3a}
.adm .bar{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.adm .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
.adm .stat{border:1px solid #ddd;border-radius:8px;padding:12px}.adm .stat b{display:block;font-size:1.5rem}
.adm .stat span{color:#667;font-size:.85rem}.adm .stat.warn b{color:#b7791f}
.adm .scroll{overflow-x:auto}.adm table{width:100%;border-collapse:collapse}
.adm th,.adm td{padding:8px;border-bottom:1px solid #ddd;text-align:left;white-space:nowrap}
.adm .card{border:1px solid #ddd;border-radius:8px;padding:12px;margin:10px 0}
.adm .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}
.adm label{display:flex;flex-direction:column;gap:2px;font-size:.85rem;color:#445;margin:4px 0}
.adm label.chk{flex-direction:row;align-items:center;gap:6px;display:inline-flex;margin-right:12px}
.adm textarea{width:100%;box-sizing:border-box}
.adm .tag{padding:2px 8px;border-radius:10px;font-size:.8rem;border:1px solid currentColor}
.adm .pending,.adm .paid{color:#b7791f}.adm .confirmed,.adm .approved{color:#1f6f54}.adm .cancelled,.adm .rejected{color:#b83a3a}
.adm .slip{max-width:260px;border-radius:8px;border:1px solid #ddd;margin:6px 0}
.adm .err{color:#b83a3a}.adm .muted{color:#667}
`;
