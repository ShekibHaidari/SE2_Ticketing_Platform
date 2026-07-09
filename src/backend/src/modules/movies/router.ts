import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";

const router = Router();

type MovieRow = {
  id: number;
  title: string;
  genre: string;
  duration_minutes: number;
  description: string | null;
  poster_url: string | null;
  language: string;
  age_rating: string;
  movie_status: string;
};

type ShowtimeRow = {
  id: number;
  movie_id: number;
  title: string;
  genre: string;
  duration_minutes: number;
  description: string | null;
  poster_url: string | null;
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
  const { q, city, cinemaId, genre, date } = req.query;
  const params: unknown[] = [];
  const conditions = [`m.movie_status = 'published'`];

  if (q) {
    params.push(`%${String(q)}%`);
    conditions.push(`m.title ILIKE $${params.length}`);
  }

  if (genre) {
    params.push(String(genre));
    conditions.push(`m.genre = $${params.length}`);
  }

  if (city) {
    params.push(String(city));
    conditions.push(`EXISTS (
      SELECT 1
      FROM showtimes st
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      WHERE st.movie_id = m.id AND c.city = $${params.length}
    )`);
  }

  if (cinemaId) {
    params.push(Number(cinemaId));
    conditions.push(`EXISTS (
      SELECT 1
      FROM showtimes st
      JOIN halls h ON h.id = st.hall_id
      WHERE st.movie_id = m.id AND h.cinema_id = $${params.length}
    )`);
  }

  if (date) {
    params.push(String(date));
    conditions.push(`EXISTS (
      SELECT 1
      FROM showtimes st
      WHERE st.movie_id = m.id AND DATE(st.starts_at) = $${params.length}::date
    )`);
  }

  const result = await query<MovieRow>(
    `
      SELECT
        m.id,
        m.title,
        m.genre,
        m.duration_minutes,
        m.description,
        m.poster_url,
        m.language,
        m.age_rating,
        m.movie_status
      FROM movies m
      WHERE ${conditions.join(" AND ")}
      ORDER BY m.id ASC
    `,
    params,
  );

  jsonOk(res, result.rows.map((row: MovieRow) => ({
    id: row.id,
    title: row.title,
    genre: row.genre,
    durationMinutes: row.duration_minutes,
    description: row.description,
    posterUrl: row.poster_url,
    language: row.language,
    ageRating: row.age_rating,
    status: row.movie_status.toUpperCase(),
  })));
}));

router.get("/:movieId", asyncHandler(async (req, res) => {
  const movieId = Number(req.params.movieId);
  const result = await query<MovieRow>(
    `
      SELECT id, title, genre, duration_minutes, description, poster_url, language, age_rating, movie_status
      FROM movies
      WHERE id = $1
    `,
    [movieId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "فیلم مورد نظر پیدا نشد.");
  }

  const row = result.rows[0];
  jsonOk(res, {
    id: row.id,
    title: row.title,
    genre: row.genre,
    durationMinutes: row.duration_minutes,
    description: row.description,
    posterUrl: row.poster_url,
    language: row.language,
    ageRating: row.age_rating,
    status: row.movie_status.toUpperCase(),
  });
}));

router.get("/:movieId/showtimes", asyncHandler(async (req, res) => {
  const movieId = Number(req.params.movieId);
  const result = await query<ShowtimeRow>(
    `
      SELECT
        st.id,
        st.movie_id,
        m.title,
        m.genre,
        m.duration_minutes,
        m.description,
        m.poster_url,
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
      WHERE st.movie_id = $1 AND st.showtime_status = 'published'
      GROUP BY
        st.id,
        st.movie_id,
        m.title,
        m.genre,
        m.duration_minutes,
        m.description,
        m.poster_url,
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
    [movieId],
  );

  jsonOk(res, result.rows.map((row: ShowtimeRow) => ({
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.title,
    genre: row.genre,
    durationMinutes: row.duration_minutes,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    price: Number(row.base_price),
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

export default router;
