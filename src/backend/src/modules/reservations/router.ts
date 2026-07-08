import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";
import { query } from "../../config/db";
import {
  cancelReservation,
  createReservationWithLocks,
  expireReservationIfNeeded,
} from "./service";
import { reservationLockFailureCounter } from "../../shared/metrics";

const router = Router();

type ReservationSeatResponseRow = {
  seat_id: number;
  price_at_lock: string;
  row_label: string;
  seat_number: string;
};

type ReservationDetailsRow = {
  id: number;
  event_id: number;
  user_id: number;
  reservation_code: string;
  reservation_status: string;
  locked_until: string | null;
  total_amount: string;
  payment_id: number | null;
  payment_status: string | null;
};

router.post("/lock-seat", asyncHandler(async (req, res) => {
  const { eventId, userId, seatIds } = req.body as {
    eventId?: number;
    userId?: number;
    seatIds?: number[];
  };

  if (!eventId || !userId || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw new AppError(400, "eventId, userId, and seatIds are required.");
  }

  try {
    const reservation = await createReservationWithLocks(eventId, userId, seatIds.map(Number));
    jsonOk(res, {
      reservationId: reservation.reservationId,
      reservationCode: reservation.reservationCode,
      reservationStatus: "locked",
      lockedUntil: reservation.lockedUntil.toISOString(),
      totalAmount: reservation.totalAmount,
      seats: reservation.seats.map((seat) => ({
        seatId: seat.seat_id,
        rowLabel: seat.row_label,
        seatNumber: seat.seat_number,
        price: Number(seat.base_price),
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
        r.event_id,
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
    throw new AppError(404, "Reservation not found.");
  }

  const seats = await query<ReservationSeatResponseRow>(
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
    eventId: row.event_id,
    userId: row.user_id,
    reservationCode: row.reservation_code,
    reservationStatus: row.reservation_status,
    lockedUntil: row.locked_until,
    totalAmount: Number(row.total_amount),
    paymentId: row.payment_id,
    paymentStatus: row.payment_status,
    seats: seats.rows.map((seat: ReservationSeatResponseRow) => ({
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
    message: "Reservation cancelled and seat locks released.",
    reservationId,
    eventId: cancelled.reservation.event_id,
  });
}));

router.post("/:reservationId/release-expired", asyncHandler(async (req, res) => {
  const reservationId = Number(req.params.reservationId);
  const result = await expireReservationIfNeeded(reservationId);
  jsonOk(res, result);
}));

export default router;
