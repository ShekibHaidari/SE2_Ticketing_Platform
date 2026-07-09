// Client-side localStorage-backed data layer for the cinema ticketing platform.
// Implements a relational-ish model with seeded demo data.

export type Role = "customer" | "manager" | "staff" | "admin";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Cinema {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface Hall {
  id: string;
  cinemaId: string;
  name: string;
  rows: number;
  seatsPerRow: number;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  genre: string;
  duration: number; // minutes
  rating: string;
  description: string;
  posterUrl: string;
  published: boolean;
  createdAt: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  hallId: string;
  cinemaId: string;
  startsAt: string; // ISO
  price: number;
}

export interface SeatLock {
  id: string;
  showtimeId: string;
  seatLabel: string;
  userId: string;
  expiresAt: string;
}

export interface Reservation {
  id: string;
  showtimeId: string;
  userId: string;
  seats: string[];
  total: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  expiresAt: string;
}

export interface Ticket {
  id: string;
  code: string; // human readable
  reservationId: string;
  userId: string;
  showtimeId: string;
  seats: string[];
  amount: number;
  status: "valid" | "used" | "cancelled";
  createdAt: string;
  usedAt?: string;
  usedBy?: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  userId: string;
  amount: number;
  status: "success" | "failed";
  createdAt: string;
}

interface DB {
  users: User[];
  cinemas: Cinema[];
  halls: Hall[];
  movies: Movie[];
  showtimes: Showtime[];
  locks: SeatLock[];
  reservations: Reservation[];
  tickets: Ticket[];
  payments: Payment[];
}

const KEY = "cinema_db_v1";

const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();

function seed(): DB {
  const users: User[] = [
    { id: uid(), email: "admin@example.com", password: "password123", name: "مدیر سیستم", role: "admin", createdAt: nowISO() },
    { id: uid(), email: "manager@example.com", password: "password123", name: "مدیر سینما", role: "manager", createdAt: nowISO() },
    { id: uid(), email: "staff@example.com", password: "password123", name: "کارمند گیشه", role: "staff", createdAt: nowISO() },
    { id: uid(), email: "customer@example.com", password: "password123", name: "کاربر نمونه", role: "customer", createdAt: nowISO() },
  ];

  const cinemas: Cinema[] = [
    { id: "c1", name: "سینما آزادی", city: "تهران", address: "خیابان ولیعصر" },
    { id: "c2", name: "سینما پردیس کوروش", city: "تهران", address: "مجتمع کوروش" },
    { id: "c3", name: "سینما بهمن", city: "کابل", address: "شهر نو" },
  ];

  const halls: Hall[] = [
    { id: "h1", cinemaId: "c1", name: "سالن ۱", rows: 6, seatsPerRow: 10 },
    { id: "h2", cinemaId: "c1", name: "سالن ۲", rows: 5, seatsPerRow: 8 },
    { id: "h3", cinemaId: "c2", name: "سالن VIP", rows: 4, seatsPerRow: 8 },
    { id: "h4", cinemaId: "c3", name: "سالن مرکزی", rows: 6, seatsPerRow: 10 },
  ];

  const movies: Movie[] = [
    {
      id: "m1",
      title: "دنیای موازی",
      originalTitle: "Parallel Worlds",
      genre: "علمی-تخیلی",
      duration: 128,
      rating: "+۱۳",
      description: "داستان جوانی که در جهانی موازی به دنبال گمشده‌ی خویش می‌گردد.",
      posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600",
      published: true,
      createdAt: nowISO(),
    },
    {
      id: "m2",
      title: "شب طولانی",
      genre: "درام",
      duration: 105,
      rating: "+۱۵",
      description: "روایتی از یک شب سرنوشت‌ساز در دل شهر.",
      posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600",
      published: true,
      createdAt: nowISO(),
    },
    {
      id: "m3",
      title: "نبرد آخر",
      genre: "اکشن",
      duration: 142,
      rating: "+۱۵",
      description: "قهرمانی که برای نجات خانواده‌اش وارد نبرد نهایی می‌شود.",
      posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600",
      published: true,
      createdAt: nowISO(),
    },
    {
      id: "m4",
      title: "خاطرات پاییز",
      genre: "عاشقانه",
      duration: 98,
      rating: "همه سنین",
      description: "داستانی احساسی از دو دلداده در پاییز شهر.",
      posterUrl: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600",
      published: true,
      createdAt: nowISO(),
    },
    {
      id: "m5",
      title: "کارآگاه شب",
      genre: "معمایی",
      duration: 115,
      rating: "+۱۳",
      description: "پرونده‌ای مرموز که کارآگاه را به مرزهای واقعیت می‌کشاند.",
      posterUrl: "https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=600",
      published: true,
      createdAt: nowISO(),
    },
    {
      id: "m6",
      title: "کودکان آسمان",
      genre: "خانوادگی",
      duration: 92,
      rating: "همه سنین",
      description: "زندگی روزمره‌ی کودکانی که رویاهای بزرگ در سر دارند.",
      posterUrl: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=600",
      published: true,
      createdAt: nowISO(),
    },
  ];

  // Generate showtimes over the next 5 days
  const showtimes: Showtime[] = [];
  const times = ["14:00", "17:00", "20:30"];
  const today = new Date();
  today.setMinutes(0, 0, 0);
  for (let d = 0; d < 5; d++) {
    for (const m of movies) {
      const hall = halls[(movies.indexOf(m) + d) % halls.length];
      const t = times[d % times.length];
      const [hh, mm] = t.split(":").map(Number);
      const dt = new Date(today);
      dt.setDate(dt.getDate() + d);
      dt.setHours(hh, mm, 0, 0);
      showtimes.push({
        id: uid(),
        movieId: m.id,
        hallId: hall.id,
        cinemaId: hall.cinemaId,
        startsAt: dt.toISOString(),
        price: 120000 + (d * 10000),
      });
    }
  }

  return {
    users, cinemas, halls, movies, showtimes,
    locks: [], reservations: [], tickets: [], payments: [],
  };
}

export const EMPTY_DB: DB = {
  users: [], cinemas: [], halls: [], movies: [], showtimes: [],
  locks: [], reservations: [], tickets: [], payments: [],
};

let cached: DB | null = null;

function load(): DB {
  if (typeof window === "undefined") return EMPTY_DB;
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      cached = s;
      return s;
    }
    cached = JSON.parse(raw);
    return cached!;
  } catch {
    const s = seed();
    localStorage.setItem(KEY, JSON.stringify(s));
    cached = s;
    return s;
  }
}

function save(db: DB) {
  if (typeof window === "undefined") return;
  cached = db;
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("cinema_db_update"));
}

export function resetDB() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  cached = null;
  load();
  window.dispatchEvent(new Event("cinema_db_update"));
}

export const db = {
  get: () => load(),
  set: (updater: (d: DB) => void) => {
    const d = { ...load() };
    updater(d);
    save({ ...d });
  },
  // Purge expired locks and pending reservations
  purgeExpired: () => {
    const d = load();
    const now = Date.now();
    const before = d.locks.length + d.reservations.filter(r => r.status === "pending").length;
    const newLocks = d.locks.filter(l => new Date(l.expiresAt).getTime() > now);
    const newRes = d.reservations.map(r =>
      r.status === "pending" && new Date(r.expiresAt).getTime() < now
        ? { ...r, status: "cancelled" as const }
        : r
    );
    if (before !== newLocks.length + newRes.filter(r => r.status === "pending").length) {
      save({ ...d, locks: newLocks, reservations: newRes });
    }
  },
};


export function generateSeats(hall: Hall): string[] {
  const rows = "ABCDEFGHIJKL".slice(0, hall.rows).split("");
  const seats: string[] = [];
  for (const r of rows) {
    for (let i = 1; i <= hall.seatsPerRow; i++) seats.push(`${r}${i}`);
  }
  return seats;
}

export function getBookedSeats(showtimeId: string): string[] {
  const d = load();
  const set = new Set<string>();
  for (const t of d.tickets) {
    if (t.showtimeId === showtimeId && t.status !== "cancelled") {
      t.seats.forEach(s => set.add(s));
    }
  }
  return Array.from(set);
}

export function getLockedSeats(showtimeId: string, excludeUserId?: string): string[] {
  const d = load();
  const now = Date.now();
  return d.locks
    .filter(l => l.showtimeId === showtimeId && new Date(l.expiresAt).getTime() > now && l.userId !== excludeUserId)
    .map(l => l.seatLabel);
}

export function lockSeats(showtimeId: string, userId: string, seats: string[], ttlSec = 300): { ok: boolean; error?: string } {
  db.purgeExpired();
  const d = load();
  const now = Date.now();
  const bookedSet = new Set(getBookedSeats(showtimeId));
  const otherLocks = new Set(
    d.locks.filter(l => l.showtimeId === showtimeId && l.userId !== userId && new Date(l.expiresAt).getTime() > now).map(l => l.seatLabel)
  );
  for (const s of seats) {
    if (bookedSet.has(s)) return { ok: false, error: `صندلی ${s} قبلاً فروخته شده است` };
    if (otherLocks.has(s)) return { ok: false, error: `صندلی ${s} توسط کاربر دیگری در حال رزرو است` };
  }
  // Remove existing user locks for this showtime and re-add
  d.locks = d.locks.filter(l => !(l.showtimeId === showtimeId && l.userId === userId));
  const expiresAt = new Date(now + ttlSec * 1000).toISOString();
  for (const s of seats) {
    d.locks.push({ id: uid(), showtimeId, userId, seatLabel: s, expiresAt });
  }
  save(d);
  return { ok: true };
}

export function releaseLocks(showtimeId: string, userId: string) {
  db.set(d => {
    d.locks = d.locks.filter(l => !(l.showtimeId === showtimeId && l.userId === userId));
  });
}

export function createReservation(showtimeId: string, userId: string, seats: string[]): Reservation | { error: string } {
  const d = load();
  const st = d.showtimes.find(s => s.id === showtimeId);
  if (!st) return { error: "سانس یافت نشد" };
  const lockRes = lockSeats(showtimeId, userId, seats, 600);
  if (!lockRes.ok) return { error: lockRes.error! };
  const now = Date.now();
  const reservation: Reservation = {
    id: uid(),
    showtimeId,
    userId,
    seats,
    total: st.price * seats.length,
    status: "pending",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 600 * 1000).toISOString(),
  };
  db.set(d => { d.reservations.push(reservation); });
  return reservation;
}

function ticketCode(): string {
  const s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "TKT-";
  for (let i = 0; i < 8; i++) out += s[Math.floor(Math.random() * s.length)];
  return out;
}

export function completePayment(reservationId: string, success: boolean): { ticket?: Ticket; error?: string } {
  const d = load();
  const r = d.reservations.find(x => x.id === reservationId);
  if (!r) return { error: "رزرو یافت نشد" };
  if (r.status !== "pending") return { error: "این رزرو دیگر معتبر نیست" };
  if (new Date(r.expiresAt).getTime() < Date.now()) return { error: "زمان رزرو منقضی شده است" };

  const payment: Payment = {
    id: uid(), reservationId, userId: r.userId, amount: r.total,
    status: success ? "success" : "failed", createdAt: nowISO(),
  };
  d.payments.push(payment);

  if (!success) {
    r.status = "cancelled";
    d.locks = d.locks.filter(l => !(l.showtimeId === r.showtimeId && l.userId === r.userId));
    save(d);
    return { error: "پرداخت ناموفق بود" };
  }

  // Double-check no seat conflicts (uniqueness at commit)
  const booked = new Set<string>();
  for (const t of d.tickets) {
    if (t.showtimeId === r.showtimeId && t.status !== "cancelled") t.seats.forEach(s => booked.add(s));
  }
  for (const s of r.seats) {
    if (booked.has(s)) {
      r.status = "cancelled";
      save(d);
      return { error: `صندلی ${s} توسط شخص دیگری قبل از شما رزرو شد` };
    }
  }

  const ticket: Ticket = {
    id: uid(),
    code: ticketCode(),
    reservationId,
    userId: r.userId,
    showtimeId: r.showtimeId,
    seats: r.seats,
    amount: r.total,
    status: "valid",
    createdAt: nowISO(),
  };
  d.tickets.push(ticket);
  r.status = "paid";
  d.locks = d.locks.filter(l => !(l.showtimeId === r.showtimeId && l.userId === r.userId));
  save(d);
  return { ticket };
}

export function validateTicket(code: string, staffId: string): { ok: boolean; ticket?: Ticket; error?: string } {
  const d = load();
  const t = d.tickets.find(x => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!t) return { ok: false, error: "بلیت یافت نشد" };
  if (t.status === "used") return { ok: false, ticket: t, error: "این بلیت قبلاً استفاده شده است" };
  if (t.status === "cancelled") return { ok: false, ticket: t, error: "این بلیت لغو شده است" };
  t.status = "used";
  t.usedAt = nowISO();
  t.usedBy = staffId;
  save(d);
  return { ok: true, ticket: t };
}
