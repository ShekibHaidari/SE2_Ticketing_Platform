import crypto from "crypto";
import { type PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env";
import { getRedisClient } from "../../config/redis";
import { publishEvent } from "../../config/rabbitmq";
import { query, withTransaction } from "../../config/db";
import { AppError } from "../../shared/errors";

export function getSeatLockKey(eventId: number, seatId: number) {
  return `seat_lock:${eventId}:${seatId}`;
}

type SeatRow = {
  seat_id: number;
  section_id: number;
  row_label: string;
  seat_number: string;
  base_price: string;
};

export async function fetchSeatRowsForEvent(eventId: number, seatIds: number[]) {
  const result = await query<SeatRow>(
    `
      SELECT
        s.id AS seat_id,
        s.section_id,
        s.row_label,
        s.seat_number,
        sec.base_price
      FROM events e
      JOIN halls h ON h.id = e.hall_id
      JOIN sections sec ON sec.hall_id = h.id
      JOIN seats s ON s.section_id = sec.id
      WHERE e.id = $1 AND s.id = ANY($2::bigint[])
      ORDER BY s.id
    `,
    [eventId, seatIds],
  );

  if (result.rows.length !== seatIds.length) {
    throw new AppError(404, "One or more requested seats were not found for this event.");
  }

  return result.rows;
}

export async function lockSeatsOrFail(eventId: number, seatIds: number[], userId: number) {
  const redis = await getRedisClient();
  const acquiredKeys: string[] = [];

  try {
    for (const seatId of seatIds) {
      const key = getSeatLockKey(eventId, seatId);
      const lockValue = JSON.stringify({
        userId,
        lockedAt: new Date().toISOString(),
      });

      const result = await redis.set(key, lockValue, {
        NX: true,
        EX: env.reservationTtlSeconds,
      });

      if (result !== "OK") {
        throw new AppError(409, "Seat is already locked or unavailable.");
      }

      acquiredKeys.push(key);
    }
  } catch (error) {
    if (acquiredKeys.length > 0) {
      await redis.del(acquiredKeys);
    }

    throw error;
  }
}

export async function releaseSeatLocks(eventId: number, seatIds: number[]) {
  const redis = await getRedisClient();
  const keys = seatIds.map((seatId) => getSeatLockKey(eventId, seatId));

  if (keys.length > 0) {
    await redis.del(keys);
  }
}

export async function createReservationWithLocks(
  eventId: number,
  userId: number,
  seatIds: number[],
) {
  await lockSeatsOrFail(eventId, seatIds, userId);

  try {
    const seatRows = await fetchSeatRowsForEvent(eventId, seatIds);
    const totalAmount = seatRows.reduce(
      (sum: number, seat: SeatRow) => sum + Number(seat.base_price),
      0,
    );
    const reservationCode = `RSV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const lockedUntil = new Date(Date.now() + env.reservationTtlSeconds * 1000);

    const reservation = await withTransaction(async (client) => {
      const ticketConflict = await client.query<{ seat_id: number }>(
        `
          SELECT seat_id
          FROM tickets
          WHERE event_id = $1 AND seat_id = ANY($2::bigint[])
        `,
        [eventId, seatIds],
      );

      if (ticketConflict.rowCount > 0) {
        throw new AppError(409, "Seat is already locked or unavailable.");
      }

      const reservationResult = await client.query<{ id: number }>(
        `
          INSERT INTO reservations (
            event_id,
            user_id,
            reservation_code,
            reservation_status,
            locked_until,
            total_amount
          )
          VALUES ($1, $2, $3, 'locked', $4, $5)
          RETURNING id
        `,
        [eventId, userId, reservationCode, lockedUntil.toISOString(), totalAmount],
      );

      const reservationId = reservationResult.rows[0].id;

      for (const seat of seatRows) {
        await client.query(
          `
            INSERT INTO reservation_seats (
              reservation_id,
              event_id,
              seat_id,
              lock_token,
              price_at_lock
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [reservationId, eventId, seat.seat_id, uuidv4(), Number(seat.base_price)],
        );
      }

      return {
        reservationId,
        reservationCode,
        lockedUntil,
        totalAmount,
        seats: seatRows,
      };
    });

    await publishEvent("ReservationCreated", {
      reservationId: reservation.reservationId,
      eventId,
      userId,
      seatIds,
    });

    return reservation;
  } catch (error) {
    await releaseSeatLocks(eventId, seatIds);
    throw error;
  }
}

export async function getReservationSeatIds(
  client: PoolClient | null,
  reservationId: number,
) {
  const result = client
    ? await client.query<{ event_id: number; seat_id: number }>(
      `
        SELECT event_id, seat_id
        FROM reservation_seats
        WHERE reservation_id = $1
        ORDER BY seat_id
      `,
      [reservationId],
    )
    : await query<{ event_id: number; seat_id: number }>(
    `
      SELECT event_id, seat_id
      FROM reservation_seats
      WHERE reservation_id = $1
      ORDER BY seat_id
    `,
    [reservationId],
  );

  return result.rows;
}

export async function cancelReservation(reservationId: number, nextStatus: "cancelled" | "expired" | "failed") {
  const result = await withTransaction(async (client) => {
    const reservationResult = await client.query<{
      id: number;
      event_id: number;
      user_id: number;
      reservation_status: string;
    }>(
      `
        SELECT id, event_id, user_id, reservation_status
        FROM reservations
        WHERE id = $1
      `,
      [reservationId],
    );

    if (reservationResult.rowCount === 0) {
      throw new AppError(404, "Reservation not found.");
    }

    const reservation = reservationResult.rows[0];

    if (reservation.reservation_status === "confirmed") {
      throw new AppError(409, "Confirmed reservations cannot be cancelled.");
    }

    const seatRows = await getReservationSeatIds(client, reservationId);

    await client.query(
      `
        UPDATE reservations
        SET reservation_status = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [reservationId, nextStatus],
    );

    await client.query(
      `
        UPDATE payments
        SET payment_status = CASE
          WHEN payment_status = 'success' THEN payment_status
          ELSE 'failed'
        END,
            updated_at = NOW()
        WHERE reservation_id = $1 AND payment_status <> 'success'
      `,
      [reservationId],
    );

    return {
      reservation,
      seatRows,
    };
  });

  await releaseSeatLocks(
    result.reservation.event_id,
    result.seatRows.map((row: { event_id: number; seat_id: number }) => row.seat_id),
  );

  return result;
}

export async function expireReservationIfNeeded(reservationId: number) {
  const result = await query<{
    id: number;
    event_id: number;
    locked_until: string | null;
    reservation_status: string;
  }>(
    `
      SELECT id, event_id, locked_until, reservation_status
      FROM reservations
      WHERE id = $1
    `,
    [reservationId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, "Reservation not found.");
  }

  const reservation = result.rows[0];

  if (reservation.reservation_status === "confirmed") {
    return { expired: false, message: "Reservation is already confirmed." };
  }

  if (!reservation.locked_until || new Date(reservation.locked_until).getTime() > Date.now()) {
    return { expired: false, message: "Reservation is still active." };
  }

  const cancelled = await cancelReservation(reservationId, "expired");

  await publishEvent("ReservationExpired", {
    reservationId,
    eventId: cancelled.reservation.event_id,
    userId: cancelled.reservation.user_id,
  });

  return { expired: true, message: "Reservation expired and locks released." };
}

export async function buildSeatMap(venueId: number, eventId?: number) {
  const venueResult = await query<{
    venue_id: number;
    venue_name: string;
    hall_id: number;
    hall_name: string;
    section_id: number;
    section_name: string;
    base_price: string;
    seat_id: number;
    row_label: string;
    seat_number: string;
  }>(
    `
      SELECT
        v.id AS venue_id,
        v.name AS venue_name,
        h.id AS hall_id,
        h.name AS hall_name,
        sec.id AS section_id,
        sec.name AS section_name,
        sec.base_price,
        s.id AS seat_id,
        s.row_label,
        s.seat_number
      FROM venues v
      JOIN halls h ON h.venue_id = v.id
      JOIN sections sec ON sec.hall_id = h.id
      JOIN seats s ON s.section_id = sec.id
      WHERE v.id = $1
      ORDER BY h.id, sec.sort_order, s.row_label, s.seat_number
    `,
    [venueId],
  );

  if (venueResult.rowCount === 0) {
    throw new AppError(404, "Venue not found.");
  }

  const seatStateMap = new Map<number, string>();

  if (eventId) {
    const tickets = await query<{ seat_id: number }>(
      `SELECT seat_id FROM tickets WHERE event_id = $1 AND ticket_status IN ('active', 'used')`,
      [eventId],
    );

    tickets.rows.forEach((row: { seat_id: number }) => seatStateMap.set(row.seat_id, "booked"));

    const reservations = await query<{ seat_id: number }>(
      `
        SELECT rs.seat_id
        FROM reservation_seats rs
        JOIN reservations r ON r.id = rs.reservation_id
        WHERE rs.event_id = $1
          AND r.reservation_status IN ('locked', 'checkout_in_progress')
          AND r.locked_until > NOW()
      `,
      [eventId],
    );

    reservations.rows.forEach((row: { seat_id: number }) => {
      if (!seatStateMap.has(row.seat_id)) {
        seatStateMap.set(row.seat_id, "locked");
      }
    });
  }

  const first = venueResult.rows[0];
  const halls = new Map<number, {
    hallId: number;
    hallName: string;
    sections: Map<number, {
      sectionId: number;
      sectionName: string;
      basePrice: number;
      seats: Array<Record<string, unknown>>;
    }>;
  }>();

  for (const row of venueResult.rows) {
    if (!halls.has(row.hall_id)) {
      halls.set(row.hall_id, {
        hallId: row.hall_id,
        hallName: row.hall_name,
        sections: new Map(),
      });
    }

    const hall = halls.get(row.hall_id)!;

    if (!hall.sections.has(row.section_id)) {
      hall.sections.set(row.section_id, {
        sectionId: row.section_id,
        sectionName: row.section_name,
        basePrice: Number(row.base_price),
        seats: [],
      });
    }

    hall.sections.get(row.section_id)!.seats.push({
      seatId: row.seat_id,
      rowLabel: row.row_label,
      seatNumber: row.seat_number,
      state: seatStateMap.get(row.seat_id) ?? "available",
    });
  }

  return {
    venueId: first.venue_id,
    venueName: first.venue_name,
    eventId: eventId ?? null,
    halls: Array.from(halls.values()).map((hall: {
      hallId: number;
      hallName: string;
      sections: Map<number, {
        sectionId: number;
        sectionName: string;
        basePrice: number;
        seats: Array<Record<string, unknown>>;
      }>;
    }) => ({
      hallId: hall.hallId,
      hallName: hall.hallName,
      sections: Array.from(hall.sections.values()),
    })),
  };
}
