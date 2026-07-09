import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";
import { buildSeatMapByShowtime } from "../reservations/service";

const router = Router();

type ShowtimeRow = {
  id: number;
  movie_id: number;
  movie_title: string;
  genre: string;
  duration_minutes: number;
  starts_at: string;
  ends_at: string;
  base_price: string;
  cinema_id: number;
  cinema_name: string;
  city: string;
  hall_id: number;
  hall_name: string;
  hall_capacity: number;
  sold_seats: number;
  remaining_seats: number;
};

router.get("/", asyncHandler(async (req, res) => {
  const { city, cinemaId, movieId, date } = req.query;
  const params: unknown[] = [];
  const conditions = [`st.showtime_status = 'published'`];

  if (city) {
    params.push(String(city));
    conditions.push(`c.city = $${params.length}`);
  }

  if (cinemaId) {
    params.push(Number(cinemaId));
    conditions.push(`c.id = $${params.length}`);
  }

  if (movieId) {
    params.push(Number(movieId));
    conditions.push(`st.movie_id = $${params.length}`);
  }

  if (date) {
    params.push(String(date));
    conditions.push(`DATE(st.starts_at) = $${params.length}::date`);
  }

  const result = await query<ShowtimeRow>(
    `
      SELECT
        st.id,
        st.movie_id,
        m.title AS movie_title,
        m.genre,
        m.duration_minutes,
        st.starts_at,
        st.ends_at,
        st.base_price,
        c.id AS cinema_id,
        c.name AS cinema_name,
        c.city,
        h.id AS hall_id,
        h.name AS hall_name,
        h.capacity AS hall_capacity,
        COUNT(t.id)::int AS sold_seats,
        GREATEST(h.capacity - COUNT(t.id), 0)::int AS remaining_seats
      FROM showtimes st
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      LEFT JOIN tickets t ON t.showtime_id = st.id AND t.ticket_status IN ('active', 'used')
      WHERE ${conditions.join(" AND ")}
      GROUP BY
        st.id,
        st.movie_id,
        m.title,
        m.genre,
        m.duration_minutes,
        st.starts_at,
        st.ends_at,
        st.base_price,
        c.id,
        c.name,
        c.city,
        h.id,
        h.name,
        h.capacity
      ORDER BY st.starts_at ASC
    `,
    params,
  );

  jsonOk(res, result.rows.map((row: ShowtimeRow) => ({
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.movie_title,
    genre: row.genre,
    durationMinutes: row.duration_minutes,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    basePrice: Number(row.base_price),
    cinema: {
      id: row.cinema_id,
      name: row.cinema_name,
      city: row.city,
    },
    hall: {
      id: row.hall_id,
      name: row.hall_name,
      capacity: row.hall_capacity,
    },
    soldSeats: row.sold_seats,
    remainingSeats: row.remaining_seats,
  })));
}));

router.get("/:showtimeId", asyncHandler(async (req, res) => {
  const showtimeId = Number(req.params.showtimeId);
  const result = await query<ShowtimeRow>(
    `
      SELECT
        st.id,
        st.movie_id,
        m.title AS movie_title,
        m.genre,
        m.duration_minutes,
        st.starts_at,
        st.ends_at,
        st.base_price,
        c.id AS cinema_id,
        c.name AS cinema_name,
        c.city,
        h.id AS hall_id,
        h.name AS hall_name,
        h.capacity AS hall_capacity,
        COUNT(t.id)::int AS sold_seats,
        GREATEST(h.capacity - COUNT(t.id), 0)::int AS remaining_seats
      FROM showtimes st
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      LEFT JOIN tickets t ON t.showtime_id = st.id AND t.ticket_status IN ('active', 'used')
      WHERE st.id = $1
      GROUP BY
        st.id,
        st.movie_id,
        m.title,
        m.genre,
        m.duration_minutes,
        st.starts_at,
        st.ends_at,
        st.base_price,
        c.id,
        c.name,
        c.city,
        h.id,
        h.name,
        h.capacity
    `,
    [showtimeId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "سانس پیدا نشد.");
  }

  const row = result.rows[0];
  jsonOk(res, {
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.movie_title,
    genre: row.genre,
    durationMinutes: row.duration_minutes,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    basePrice: Number(row.base_price),
    cinema: {
      id: row.cinema_id,
      name: row.cinema_name,
      city: row.city,
    },
    hall: {
      id: row.hall_id,
      name: row.hall_name,
      capacity: row.hall_capacity,
    },
    soldSeats: row.sold_seats,
    remainingSeats: row.remaining_seats,
  });
}));

router.get("/:showtimeId/seat-map", asyncHandler(async (req, res) => {
  const showtimeId = Number(req.params.showtimeId);
  jsonOk(res, await buildSeatMapByShowtime(showtimeId));
}));

export default router;
