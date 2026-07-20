import crypto from "node:crypto";
import type { DB, Reservation, Ticket } from "../lib/store";

export type PlatformState = Omit<DB, "users">;

export class DomainError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export function purgeExpired(state: PlatformState, now = Date.now()) {
  state.locks = state.locks.filter(lock => new Date(lock.expiresAt).getTime() > now);
  state.reservations.forEach(reservation => {
    if (reservation.status === "pending" && new Date(reservation.expiresAt).getTime() <= now) {
      reservation.status = "cancelled";
    }
  });
}

export function createReservation(
  state: PlatformState,
  userId: string,
  showtimeId: string,
  requestedSeats: unknown,
  now = Date.now(),
): Reservation {
  purgeExpired(state, now);
  const showtime = state.showtimes.find(item => item.id === showtimeId);
  const hall = showtime && state.halls.find(item => item.id === showtime.hallId);
  if (!showtime || !hall) throw new DomainError("سانس یافت نشد", 404);

  if (!Array.isArray(requestedSeats)) throw new DomainError("صندلی‌های انتخاب‌شده معتبر نیستند", 400);
  const seats = requestedSeats.map(seat => String(seat));
  if (new Set(seats).size !== seats.length) throw new DomainError("صندلی تکراری انتخاب شده است", 400);

  const validSeats = new Set(
    Array.from({ length: hall.rows }, (_, row) =>
      Array.from({ length: hall.seatsPerRow }, (_, column) => `${"ABCDEFGHIJKL"[row]}${column + 1}`),
    ).flat(),
  );
  if (!seats.length || seats.length > 8 || seats.some(seat => !validSeats.has(seat))) {
    throw new DomainError("صندلی‌های انتخاب‌شده معتبر نیستند", 400);
  }

  const unavailable = new Set([
    ...state.tickets
      .filter(ticket => ticket.showtimeId === showtimeId && ticket.status !== "cancelled")
      .flatMap(ticket => ticket.seats),
    ...state.locks
      .filter(lock => lock.showtimeId === showtimeId && lock.userId !== userId)
      .map(lock => lock.seatLabel),
  ]);
  if (seats.some(seat => unavailable.has(seat))) {
    throw new DomainError("یکی از صندلی‌ها دیگر در دسترس نیست", 409);
  }

  state.locks = state.locks.filter(lock => lock.showtimeId !== showtimeId || lock.userId !== userId);
  const expiresAt = new Date(now + 600_000).toISOString();
  seats.forEach(seatLabel => state.locks.push({
    id: crypto.randomUUID(), showtimeId, seatLabel, userId, expiresAt,
  }));

  const reservation: Reservation = {
    id: crypto.randomUUID(), showtimeId, userId, seats, total: showtime.price * seats.length,
    status: "pending", createdAt: new Date(now).toISOString(), expiresAt,
  };
  state.reservations.push(reservation);
  return reservation;
}

export function completePayment(
  state: PlatformState,
  userId: string,
  reservationId: string,
  success: boolean,
  now = Date.now(),
): { ticket?: Ticket; error?: string } {
  purgeExpired(state, now);
  const reservation = state.reservations.find(item => item.id === reservationId && item.userId === userId);
  if (!reservation) throw new DomainError("رزرو یافت نشد", 404);
  if (reservation.status !== "pending") throw new DomainError("این رزرو دیگر معتبر نیست", 409);

  state.payments.push({
    id: crypto.randomUUID(), reservationId, userId, amount: reservation.total,
    status: success ? "success" : "failed", createdAt: new Date(now).toISOString(),
  });
  if (!success) {
    reservation.status = "cancelled";
    releaseReservationLocks(state, reservation);
    return { error: "پرداخت ناموفق بود" };
  }

  const soldSeats = new Set(
    state.tickets
      .filter(ticket => ticket.showtimeId === reservation.showtimeId && ticket.status !== "cancelled")
      .flatMap(ticket => ticket.seats),
  );
  if (reservation.seats.some(seat => soldSeats.has(seat))) {
    reservation.status = "cancelled";
    releaseReservationLocks(state, reservation);
    throw new DomainError("یکی از صندلی‌ها قبلاً فروخته شده است", 409);
  }

  const ticket: Ticket = {
    id: crypto.randomUUID(),
    code: `TKT-${crypto.randomBytes(6).toString("base64url").toUpperCase().slice(0, 8)}`,
    reservationId, userId, showtimeId: reservation.showtimeId, seats: [...reservation.seats],
    amount: reservation.total, status: "valid", createdAt: new Date(now).toISOString(),
  };
  state.tickets.push(ticket);
  reservation.status = "paid";
  releaseReservationLocks(state, reservation);
  return { ticket };
}

export function validateTicket(state: PlatformState, staffId: string, rawCode: unknown, now = Date.now()) {
  const code = String(rawCode ?? "").trim().toUpperCase();
  const ticket = state.tickets.find(item => item.code.toUpperCase() === code);
  if (!ticket) return { ok: false as const, error: "بلیت یافت نشد" };
  if (ticket.status !== "valid") {
    return {
      ok: false as const,
      ticket,
      error: ticket.status === "used" ? "این بلیت قبلاً استفاده شده است" : "این بلیت لغو شده است",
    };
  }
  ticket.status = "used";
  ticket.usedAt = new Date(now).toISOString();
  ticket.usedBy = staffId;
  return { ok: true as const, ticket };
}

function releaseReservationLocks(state: PlatformState, reservation: Reservation) {
  state.locks = state.locks.filter(lock =>
    lock.userId !== reservation.userId || lock.showtimeId !== reservation.showtimeId,
  );
}
