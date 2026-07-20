export type Role = "customer" | "manager" | "staff" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Cinema { id: string; name: string; city: string; address: string }
export interface Hall { id: string; cinemaId: string; name: string; rows: number; seatsPerRow: number }
export interface Movie {
  id: string; title: string; originalTitle?: string; genre: string; duration: number;
  rating: string; description: string; posterUrl: string; published: boolean; createdAt: string;
}
export interface Showtime { id: string; movieId: string; hallId: string; cinemaId: string; startsAt: string; price: number }
export interface SeatLock { id: string; showtimeId: string; seatLabel: string; userId: string; expiresAt: string }
export interface Reservation {
  id: string; showtimeId: string; userId: string; seats: string[]; total: number;
  status: "pending" | "paid" | "cancelled"; createdAt: string; expiresAt: string;
}
export interface Ticket {
  id: string; code: string; reservationId: string; userId: string; showtimeId: string;
  seats: string[]; amount: number; status: "valid" | "used" | "cancelled";
  createdAt: string; usedAt?: string; usedBy?: string;
}
export interface Payment {
  id: string; reservationId: string; userId: string; amount: number;
  status: "success" | "failed"; createdAt: string;
}
export interface DB {
  users: User[]; cinemas: Cinema[]; halls: Hall[]; movies: Movie[]; showtimes: Showtime[];
  locks: SeatLock[]; reservations: Reservation[]; tickets: Ticket[]; payments: Payment[];
}

export const EMPTY_DB: DB = {
  users: [], cinemas: [], halls: [], movies: [], showtimes: [], locks: [],
  reservations: [], tickets: [], payments: [],
};

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: { "content-type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new ApiError(payload.error ?? "خطای ارتباط با سرور", response.status);
  return payload as T;
}

let snapshot: DB = EMPTY_DB;
const listeners = new Set<() => void>();
export const subscribeDB = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
export const getDBSnapshot = () => snapshot;
export async function refreshDB() {
  snapshot = await api<DB>("/state");
  listeners.forEach(listener => listener());
  return snapshot;
}

async function mutate<T>(path: string, body?: unknown, method = "POST") {
  const result = await api<T>(path, { method, body });
  await refreshDB();
  return result;
}

export const resetDB = () => mutate<void>("/admin/reset");
export const updateUserRole = (id: string, role: Role) => mutate<void>(`/admin/users/${id}/role`, { role }, "PATCH");
export const deleteUser = (id: string) => mutate<void>(`/admin/users/${id}`, undefined, "DELETE");
export const addMovie = (movie: Omit<Movie, "id" | "createdAt">) => mutate<Movie>("/manager/movies", movie);
export const deleteMovie = (id: string) => mutate<void>(`/manager/movies/${id}`, undefined, "DELETE");
export const addCinema = (cinema: Omit<Cinema, "id">) => mutate<Cinema>("/manager/cinemas", cinema);
export const addHall = (hall: Omit<Hall, "id">) => mutate<Hall>("/manager/halls", hall);
export const addShowtime = (showtime: Omit<Showtime, "id" | "cinemaId">) => mutate<Showtime>("/manager/showtimes", showtime);
export const deleteShowtime = (id: string) => mutate<void>(`/manager/showtimes/${id}`, undefined, "DELETE");
export const createReservation = (showtimeId: string, seats: string[]) => mutate<Reservation>("/reservations", { showtimeId, seats });
export const completePayment = (reservationId: string, success: boolean) => mutate<{ ticket?: Ticket; error?: string }>(`/reservations/${reservationId}/payment`, { success });
export const validateTicket = (code: string) => mutate<{ ok: boolean; ticket?: Ticket; error?: string }>("/tickets/validate", { code });

export function generateSeats(hall: Hall): string[] {
  const rows = "ABCDEFGHIJKL".slice(0, hall.rows).split("");
  return rows.flatMap(row => Array.from({ length: hall.seatsPerRow }, (_, i) => `${row}${i + 1}`));
}

export function getBookedSeats(showtimeId: string): string[] {
  const seats = new Set<string>();
  snapshot.tickets.filter(t => t.showtimeId === showtimeId && t.status !== "cancelled")
    .forEach(t => t.seats.forEach(seat => seats.add(seat)));
  return [...seats];
}

export function getLockedSeats(showtimeId: string, excludeUserId?: string): string[] {
  const now = Date.now();
  return snapshot.locks.filter(lock => lock.showtimeId === showtimeId && lock.userId !== excludeUserId &&
    new Date(lock.expiresAt).getTime() > now).map(lock => lock.seatLabel);
}
