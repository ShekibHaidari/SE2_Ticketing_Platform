import crypto from "crypto";
import { type PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env";
import { query, withTransaction } from "../../config/db";
import { getRedisClient } from "../../config/redis";
import { publishEvent } from "../../config/rabbitmq";
import { AppError } from "../../shared/errors";

export type LockedSeatRow = {
  seat_id: number;
  row_label: string;
  seat_number: string;
  section_name: string;
  price: string;
};

type ReservationSeatIdRow = {
  showtime_id: number;
  seat_id: number;
};

type ShowtimeSeatMapRow = {
  showtime_id: number;
  movie_id: number;
  movie_title: string;
  starts_at: string;
  ends_at: string;
  base_price: string;
  hall_id: number;
  hall_name: string;
  hall_capacity: number;
  cinema_id: number;
  cinema_name: string;
  city: string;
  section_id: number;
  section_name: string;
  seat_id: number;
  row_label: string;
  seat_number: string;
};

export function getSeatLockKey(showtimeId: number, seatId: number) {
  return `seat_lock:${showtimeId}:${seatId}`;
}

export async function fetchSeatRowsForShowtime(showtimeId: number, seatIds: number[]) {
  const result = await query<LockedSeatRow>(
    `
      SELECT
        s.id AS seat_id,
        s.row_label,
        s.seat_number,
        sec.name AS section_name,
        COALESCE(st.base_price, sec.base_price)::text AS price
      FROM showtimes st
      JOIN halls h ON h.id = st.hall_id
      JOIN sections sec ON sec.hall_id = h.id
      JOIN seats s ON s.section_id = sec.id
      WHERE st.id = $1 AND s.id = ANY($2::bigint[])
      ORDER BY s.id
    `,
    [showtimeId, seatIds],
  );

  if (result.rows.length !== seatIds.length) {
    throw new AppError(404, "بعضی از صندلی‌های انتخاب‌شده پیدا نشدند.");
  }

  return result.rows;
}

export async function lockSeatsOrFail(showtimeId: number, seatIds: number[], userId: number) {
  const redis = await getRedisClient();
  const acquiredKeys: string[] = [];

  try {
    for (const seatId of seatIds) {
      const lockResult = await redis.set(
        getSeatLockKey(showtimeId, seatId),
        JSON.stringify({
          userId,
          lockedAt: new Date().toISOString(),
        }),
        {
          NX: true,
          EX: env.reservationTtlSeconds,
        },
      );

      if (lockResult !== "OK") {
        throw new AppError(409, "این صندلی قبلاً انتخاب یا قفل شده است.");
      }

      acquiredKeys.push(getSeatLockKey(showtimeId, seatId));
    }
  } catch (error) {
    if (acquiredKeys.length > 0) {
      await redis.del(acquiredKeys);
    }
    throw error;
  }
}

export async function releaseSeatLocks(showtimeId: number, seatIds: number[]) {
  const redis = await getRedisClient();
  const keys = seatIds.map((seatId) => getSeatLockKey(showtimeId, seatId));
  if (keys.length > 0) {
    await redis.del(keys);
  }
}

export async function createReservationWithLocks(showtimeId: number, userId: number, seatIds: number[]) {
  await lockSeatsOrFail(showtimeId, seatIds, userId);

  try {
    const seatRows = await fetchSeatRowsForShowtime(showtimeId, seatIds);
    const totalAmount = seatRows.reduce((sum: number, seat: LockedSeatRow) => sum + Number(seat.price), 0);
    const reservationCode = `RSV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const lockedUntil = new Date(Date.now() + env.reservationTtlSeconds * 1000);

    const reservation = await withTransaction(async (client) => {
      const soldTickets = await client.query<{ seat_id: number }>(
        `
          SELECT seat_id
          FROM tickets
          WHERE showtime_id = $1 AND seat_id = ANY($2::bigint[])
        `,
        [showtimeId, seatIds],
      );

      if (soldTickets.rowCount > 0) {
        throw new AppError(409, "این صندلی قبلاً انتخاب یا قفل شده است.");
      }

      const reservationResult = await client.query<{ id: number }>(
        `
          INSERT INTO reservations (
            showtime_id,
            user_id,
            reservation_code,
            reservation_status,
            locked_until,
            total_amount
          )
          VALUES ($1, $2, $3, 'locked', $4, $5)
          RETURNING id
        `,
        [showtimeId, userId, reservationCode, lockedUntil.toISOString(), totalAmount],
      );

      const reservationId = reservationResult.rows[0].id;

      for (const seat of seatRows) {
        await client.query(
          `
            INSERT INTO reservation_seats (
              reservation_id,
              showtime_id,
              seat_id,
              lock_token,
              price_at_lock
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [reservationId, showtimeId, seat.seat_id, uuidv4(), Number(seat.price)],
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
      showtimeId,
      userId,
      seatIds,
    });

    return reservation;
  } catch (error) {
    await releaseSeatLocks(showtimeId, seatIds);
    throw error;
  }
}

export async function getReservationSeatIds(client: PoolClient | null, reservationId: number) {
  const sql = `
    SELECT showtime_id, seat_id
    FROM reservation_seats
    WHERE reservation_id = $1
    ORDER BY seat_id
  `;
  const result = client
    ? await client.query<ReservationSeatIdRow>(sql, [reservationId])
    : await query<ReservationSeatIdRow>(sql, [reservationId]);

  return result.rows;
}

export async function cancelReservation(reservationId: number, nextStatus: "cancelled" | "expired" | "failed") {
  const result = await withTransaction(async (client) => {
    const reservationResult = await client.query<{
      id: number;
      showtime_id: number;
      user_id: number;
      reservation_status: string;
    }>(
      `
        SELECT id, showtime_id, user_id, reservation_status
        FROM reservations
        WHERE id = $1
      `,
      [reservationId],
    );

    if (!reservationResult.rowCount) {
      throw new AppError(404, "رزرو مورد نظر پیدا نشد.");
    }

    const reservation = reservationResult.rows[0];

    if (reservation.reservation_status === "confirmed") {
      throw new AppError(409, "رزرو تایید شده قابل لغو نیست.");
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

    return { reservation, seatRows };
  });

  await releaseSeatLocks(
    result.reservation.showtime_id,
    result.seatRows.map((row: ReservationSeatIdRow) => row.seat_id),
  );

  return result;
}

export async function expireReservationIfNeeded(reservationId: number) {
  const result = await query<{
    id: number;
    showtime_id: number;
    locked_until: string | null;
    reservation_status: string;
  }>(
    `
      SELECT id, showtime_id, locked_until, reservation_status
      FROM reservations
      WHERE id = $1
    `,
    [reservationId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "رزرو مورد نظر پیدا نشد.");
  }

  const reservation = result.rows[0];

  if (reservation.reservation_status === "confirmed") {
    return { expired: false, message: "رزرو قبلاً تایید شده است." };
  }

  if (!reservation.locked_until || new Date(reservation.locked_until).getTime() > Date.now()) {
    return { expired: false, message: "رزرو هنوز فعال است." };
  }

  const cancelled = await cancelReservation(reservationId, "expired");
  await publishEvent("ReservationExpired", {
    reservationId,
    showtimeId: cancelled.reservation.showtime_id,
    userId: cancelled.reservation.user_id,
  });

  return { expired: true, message: "مهلت رزرو تمام شد و صندلی‌ها آزاد شدند." };
}

export async function buildSeatMapByShowtime(showtimeId: number) {
  const result = await query<ShowtimeSeatMapRow>(
    `
      SELECT
        st.id AS showtime_id,
        m.id AS movie_id,
        m.title AS movie_title,
        st.starts_at,
        st.ends_at,
        st.base_price::text AS base_price,
        h.id AS hall_id,
        h.name AS hall_name,
        h.capacity AS hall_capacity,
        c.id AS cinema_id,
        c.name AS cinema_name,
        c.city,
        sec.id AS section_id,
        sec.name AS section_name,
        COALESCE(st.base_price, sec.base_price)::text AS base_price,
        s.id AS seat_id,
        s.row_label,
        s.seat_number
      FROM showtimes st
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      JOIN sections sec ON sec.hall_id = h.id
      JOIN seats s ON s.section_id = sec.id
      WHERE st.id = $1
      ORDER BY sec.sort_order, s.row_label, s.seat_number
    `,
    [showtimeId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "سانس مورد نظر پیدا نشد.");
  }

  const bookedTickets = await query<{ seat_id: number }>(
    `
      SELECT seat_id
      FROM tickets
      WHERE showtime_id = $1 AND ticket_status IN ('active', 'used')
    `,
    [showtimeId],
  );

  const activeReservations = await query<{ seat_id: number }>(
    `
      SELECT rs.seat_id
      FROM reservation_seats rs
      JOIN reservations r ON r.id = rs.reservation_id
      WHERE rs.showtime_id = $1
        AND r.reservation_status IN ('locked', 'checkout_in_progress')
        AND r.locked_until > NOW()
    `,
    [showtimeId],
  );

  const stateMap = new Map<number, string>();
  bookedTickets.rows.forEach((row) => stateMap.set(row.seat_id, "booked"));
  activeReservations.rows.forEach((row) => {
    if (!stateMap.has(row.seat_id)) {
      stateMap.set(row.seat_id, "locked");
    }
  });

  const first = result.rows[0];
  const sections = new Map<number, {
    sectionId: number;
    sectionName: string;
    basePrice: number;
    seats: Array<Record<string, unknown>>;
  }>();

  for (const row of result.rows) {
    if (!sections.has(row.section_id)) {
      sections.set(row.section_id, {
        sectionId: row.section_id,
        sectionName: row.section_name,
        basePrice: Number(row.base_price),
        seats: [],
      });
    }

    sections.get(row.section_id)!.seats.push({
      seatId: row.seat_id,
      rowLabel: row.row_label,
      seatNumber: row.seat_number,
      state: stateMap.get(row.seat_id) ?? "available",
    });
  }

  return {
    showtimeId: first.showtime_id,
    movie: {
      id: first.movie_id,
      title: first.movie_title,
    },
    startsAt: first.starts_at,
    endsAt: first.ends_at,
    basePrice: Number(first.base_price),
    cinema: {
      id: first.cinema_id,
      name: first.cinema_name,
      city: first.city,
    },
    hall: {
      id: first.hall_id,
      name: first.hall_name,
      capacity: first.hall_capacity,
    },
    soldSeats: bookedTickets.rows.length,
    remainingSeats: Math.max(first.hall_capacity - bookedTickets.rows.length, 0),
    sections: Array.from(sections.values()),
  };
}
