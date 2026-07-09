import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";
import { reservationLockFailureCounter } from "../../shared/metrics";
import { cancelReservation, createReservationWithLocks, expireReservationIfNeeded } from "./service";

const router = Router();

type ReservationDetailsRow = {
  id: number;
  showtime_id: number;
  user_id: number;
  reservation_code: string;
  reservation_status: string;
  locked_until: string | null;
  total_amount: string;
  payment_id: number | null;
  payment_status: string | null;
};

type ReservationSeatRow = {
  seat_id: number;
  price_at_lock: string;
  row_label: string;
  seat_number: string;
};

router.post("/lock-seat", asyncHandler(async (req, res) => {
  const { showtimeId, eventId, userId, seatIds } = req.body as {
    showtimeId?: number;
    eventId?: number;
    userId?: number;
    seatIds?: number[];
  };

  const effectiveShowtimeId = Number(showtimeId ?? eventId);

  if (!effectiveShowtimeId || !userId || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw new AppError(400, "showtimeId, userId, and seatIds are required.");
  }

  try {
    const reservation = await createReservationWithLocks(effectiveShowtimeId, userId, seatIds.map(Number));
    jsonOk(res, {
      reservationId: reservation.reservationId,
      reservationCode: reservation.reservationCode,
      reservationStatus: "locked",
      lockedUntil: reservation.lockedUntil.toISOString(),
      totalAmount: reservation.totalAmount,
      showtimeId: effectiveShowtimeId,
      seats: reservation.seats.map((seat) => ({
        seatId: seat.seat_id,
        rowLabel: seat.row_label,
        seatNumber: seat.seat_number,
        sectionName: seat.section_name,
        price: Number(seat.price),
      })),
    }, 201);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 409) {
      reservationLockFailureCounter.inc();
    }
    throw error;
  }
}));

router.get("/:reservationId", asyncHandler(async (req, res) => {
  const reservationId = Number(req.params.reservationId);
  const result = await query<ReservationDetailsRow>(
    `
      SELECT
        r.id,
        r.showtime_id,
        r.user_id,
        r.reservation_code,
        r.reservation_status,
        r.locked_until,
        r.total_amount,
        p.id AS payment_id,
        p.payment_status
      FROM reservations r
      LEFT JOIN payments p ON p.reservation_id = r.id
      WHERE r.id = $1
    `,
    [reservationId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "رزرو مورد نظر پیدا نشد.");
  }

  const seats = await query<ReservationSeatRow>(
    `
      SELECT
        rs.seat_id,
        rs.price_at_lock,
        s.row_label,
        s.seat_number
      FROM reservation_seats rs
      JOIN seats s ON s.id = rs.seat_id
      WHERE rs.reservation_id = $1
      ORDER BY s.row_label, s.seat_number
    `,
    [reservationId],
  );

  const row = result.rows[0];
  jsonOk(res, {
    reservationId: row.id,
    showtimeId: row.showtime_id,
    userId: row.user_id,
    reservationCode: row.reservation_code,
    reservationStatus: row.reservation_status,
    lockedUntil: row.locked_until,
    totalAmount: Number(row.total_amount),
    paymentId: row.payment_id,
    paymentStatus: row.payment_status,
    seats: seats.rows.map((seat) => ({
      seatId: seat.seat_id,
      rowLabel: seat.row_label,
      seatNumber: seat.seat_number,
      price: Number(seat.price_at_lock),
    })),
  });
}));

router.post("/:reservationId/cancel", asyncHandler(async (req, res) => {
  const reservationId = Number(req.params.reservationId);
  const cancelled = await cancelReservation(reservationId, "cancelled");
  jsonOk(res, {
    message: "رزرو لغو شد و صندلی‌ها آزاد شدند.",
    reservationId,
    showtimeId: cancelled.reservation.showtime_id,
  });
}));

router.post("/:reservationId/release-expired", asyncHandler(async (req, res) => {
  const reservationId = Number(req.params.reservationId);
  jsonOk(res, await expireReservationIfNeeded(reservationId));
}));

export default router;
