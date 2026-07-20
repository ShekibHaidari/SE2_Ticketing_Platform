import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import express, { type NextFunction, type Request, type Response } from "express";
import type { DB, Role, User } from "../lib/store";
import { initializeDatabase, listUsers, pool, resetBusinessState, updateState } from "./database";
import {
  completePayment as completePaymentInState,
  createReservation as createReservationInState,
  purgeExpired,
  validateTicket as validateTicketInState,
} from "./domain";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const sessionCookie = "cinema_session";
const sessionDays = 7;

app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));
app.use((req, res, next) => {
  res.setHeader("cache-control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.origin;
    const host = req.headers.host;
    if (origin && host && new URL(origin).host !== host) return res.status(403).json({ error: "درخواست نامعتبر است" });
  }
  next();
});

type AuthRequest = Request & { user?: User };
const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
const cookies = (req: Request) => Object.fromEntries((req.headers.cookie ?? "").split(";").filter(Boolean).map(part => {
  const [key, ...rest] = part.trim().split("="); return [key, decodeURIComponent(rest.join("="))];
}));

app.use(async (req: AuthRequest, _res, next) => {
  const token = cookies(req)[sessionCookie];
  if (!token) return next();
  const { rows } = await pool.query<User>(
    `SELECT u.id,u.email,u.name,u.role,u.created_at AS "createdAt"
     FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at>now()`, [sha256(token)],
  );
  req.user = rows[0];
  next();
});

const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => req.user ? next() : res.status(401).json({ error: "ابتدا وارد شوید" });
const requireRole = (...roles: Role[]) => (req: AuthRequest, res: Response, next: NextFunction) =>
  req.user && roles.includes(req.user.role) ? next() : res.status(req.user ? 403 : 401).json({ error: "دسترسی مجاز نیست" });
const setSessionCookie = (res: Response, token: string) => res.cookie(sessionCookie, token, {
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: sessionDays * 86400000,
});
const createSession = async (userId: string, res: Response) => {
  const token = crypto.randomBytes(32).toString("base64url");
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+$3::interval)", [sha256(token), userId, `${sessionDays} days`]);
  setSessionCookie(res, token);
};

app.get("/api/health", async (_req, res) => { await pool.query("SELECT 1"); res.json({ ok: true }); });
app.get("/api/auth/me", (req: AuthRequest, res) => res.json({ user: req.user ?? null }));
app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const { rows } = await pool.query<(User & { passwordHash: string })>(
    `SELECT id,email,name,role,created_at AS "createdAt",password_hash AS "passwordHash" FROM users WHERE email=$1`, [email],
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "ایمیل یا رمز عبور نادرست است" });
  await createSession(user.id, res);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});
app.post("/api/auth/register", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const name = String(req.body.name ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || name.length < 2) return res.status(400).json({ error: "نام، ایمیل یا رمز عبور معتبر نیست" });
  const user: User = { id: crypto.randomUUID(), email, name, role: "customer", createdAt: new Date().toISOString() };
  try {
    await pool.query("INSERT INTO users(id,email,password_hash,name,role,created_at) VALUES($1,$2,$3,$4,$5,$6)", [user.id, email, await bcrypt.hash(password, 12), name, user.role, user.createdAt]);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return res.status(409).json({ error: "این ایمیل قبلاً ثبت شده است" });
    throw error;
  }
  await createSession(user.id, res);
  res.status(201).json({ user });
});
app.post("/api/auth/logout", async (req, res) => {
  const token = cookies(req)[sessionCookie];
  if (token) await pool.query("DELETE FROM sessions WHERE token_hash=$1", [sha256(token)]);
  res.clearCookie(sessionCookie, { path: "/" });
  res.status(204).end();
});

app.get("/api/state", async (req: AuthRequest, res) => {
  const state = await updateState(current => { purgeExpired(current); return current; });
  const user = req.user;
  const isManager = user?.role === "manager" || user?.role === "admin";
  const response: DB = {
    ...state,
    users: user?.role === "admin" ? await listUsers() : [],
    reservations: isManager ? state.reservations : state.reservations.filter(r => r.userId === user?.id),
    tickets: isManager ? state.tickets : state.tickets.filter(t => t.userId === user?.id || t.usedBy === user?.id),
    payments: user?.role === "admin" ? state.payments : state.payments.filter(p => p.userId === user?.id),
    locks: state.locks.map(lock => user?.role === "admin" ? lock : { ...lock, userId: lock.userId === user?.id ? lock.userId : "other" }),
  };
  res.json(response);
});

app.post("/api/reservations", requireAuth, async (req: AuthRequest, res) => {
  const showtimeId = String(req.body.showtimeId ?? "");
  const reservation = await updateState(state =>
    createReservationInState(state, req.user!.id, showtimeId, req.body.seats),
  );
  res.status(201).json(reservation);
});

app.post("/api/reservations/:id/payment", requireAuth, async (req: AuthRequest, res) => {
  const result = await updateState(state =>
    completePaymentInState(state, req.user!.id, String(req.params.id), req.body.success === true),
  );
  res.json(result);
});

app.post("/api/tickets/validate", requireRole("staff", "admin"), async (req: AuthRequest, res) => {
  const result = await updateState(state => validateTicketInState(state, req.user!.id, req.body.code));
  res.json(result);
});

app.post("/api/admin/reset", requireRole("admin"), async (_req, res) => { await resetBusinessState(); res.status(204).end(); });
app.patch("/api/admin/users/:id/role", requireRole("admin"), async (req: AuthRequest, res) => {
  const role = req.body.role as Role;
  if (!["customer", "manager", "staff", "admin"].includes(role)) return res.status(400).json({ error: "نقش معتبر نیست" });
  if (req.params.id === req.user!.id && role !== "admin") return res.status(400).json({ error: "نمی‌توانید نقش ادمین خود را حذف کنید" });
  await pool.query("UPDATE users SET role=$1 WHERE id=$2", [role, req.params.id]); res.status(204).end();
});
app.delete("/api/admin/users/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  if (req.params.id === req.user!.id) return res.status(400).json({ error: "نمی‌توانید حساب فعال خود را حذف کنید" });
  await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]); res.status(204).end();
});

const manager = express.Router();
manager.use(requireRole("manager", "admin"));
manager.post("/movies", async (req, res) => { const item = await updateState(state => { const movie = { ...req.body, id: crypto.randomUUID(), createdAt: new Date().toISOString(), published: true }; state.movies.push(movie); return movie; }); res.status(201).json(item); });
manager.delete("/movies/:id", async (req, res) => { await updateState(state => { state.movies = state.movies.filter(x => x.id !== req.params.id); state.showtimes = state.showtimes.filter(x => x.movieId !== req.params.id); }); res.status(204).end(); });
manager.post("/cinemas", async (req, res) => { const item = await updateState(state => { const cinema = { id: crypto.randomUUID(), name: String(req.body.name), city: String(req.body.city), address: String(req.body.address) }; state.cinemas.push(cinema); return cinema; }); res.status(201).json(item); });
manager.post("/halls", async (req, res) => { const item = await updateState(state => { const hall = { id: crypto.randomUUID(), cinemaId: String(req.body.cinemaId), name: String(req.body.name), rows: Number(req.body.rows), seatsPerRow: Number(req.body.seatsPerRow) }; state.halls.push(hall); return hall; }); res.status(201).json(item); });
manager.post("/showtimes", async (req, res) => { const item = await updateState(state => { const hall = state.halls.find(h => h.id === req.body.hallId); if (!hall) throw Object.assign(new Error("سالن یافت نشد"), { status: 404 }); const showtime = { id: crypto.randomUUID(), movieId: String(req.body.movieId), hallId: hall.id, cinemaId: hall.cinemaId, startsAt: String(req.body.startsAt), price: Number(req.body.price) }; state.showtimes.push(showtime); return showtime; }); res.status(201).json(item); });
manager.delete("/showtimes/:id", async (req, res) => { await updateState(state => { state.showtimes = state.showtimes.filter(x => x.id !== req.params.id); }); res.status(204).end(); });
app.use("/api/manager", manager);

app.use((error: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error); res.status(error.status ?? 500).json({ error: error.status ? error.message : "خطای داخلی سرور" });
});

await initializeDatabase();
app.listen(port, () => console.log(`Ticketing API listening on http://localhost:${port}`));
