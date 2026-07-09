import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";

const router = Router();

router.get("/dashboard", asyncHandler(async (req, res) => {
  const managerId = Number(req.query.managerId ?? 2);

  const [cinemas, showtimes, revenue, soldSeats] = await Promise.all([
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM cinemas WHERE manager_user_id = $1`, [managerId]),
    query<{ total: number }>(`
      SELECT COUNT(*)::int AS total
      FROM showtimes st
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      WHERE c.manager_user_id = $1
    `, [managerId]),
    query<{ total: string }>(`
      SELECT COALESCE(SUM(p.amount), 0)::text AS total
      FROM payments p
      JOIN reservations r ON r.id = p.reservation_id
      JOIN showtimes st ON st.id = r.showtime_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      WHERE c.manager_user_id = $1 AND p.payment_status = 'success'
    `, [managerId]),
    query<{ total: number }>(`
      SELECT COUNT(*)::int AS total
      FROM tickets t
      JOIN showtimes st ON st.id = t.showtime_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      WHERE c.manager_user_id = $1
    `, [managerId]),
  ]);

  jsonOk(res, {
    cinemaCount: cinemas.rows[0].total,
    showtimeCount: showtimes.rows[0].total,
    soldSeats: soldSeats.rows[0].total,
    revenue: Number(revenue.rows[0].total),
  });
}));

router.post("/movies", asyncHandler(async (req, res) => {
  const {
    title,
    genre,
    durationMinutes,
    description,
    posterUrl,
    language = "فارسی",
    ageRating = "12+",
  } = req.body as Record<string, unknown>;

  if (!title || !genre || !durationMinutes) {
    throw new AppError(400, "title, genre, and durationMinutes are required.");
  }

  const result = await query<{ id: number }>(
    `
      INSERT INTO movies (title, genre, duration_minutes, description, poster_url, language, age_rating, movie_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')
      RETURNING id
    `,
    [title, genre, Number(durationMinutes), description ?? null, posterUrl ?? null, language, ageRating],
  );

  jsonOk(res, { message: "فیلم جدید ثبت شد.", movieId: result.rows[0].id }, 201);
}));

router.post("/showtimes", asyncHandler(async (req, res) => {
  const { movieId, hallId, startsAt, endsAt, basePrice } = req.body as Record<string, unknown>;

  if (!movieId || !hallId || !startsAt || !endsAt || !basePrice) {
    throw new AppError(400, "movieId, hallId, startsAt, endsAt, and basePrice are required.");
  }

  const result = await query<{ id: number }>(
    `
      INSERT INTO showtimes (movie_id, hall_id, starts_at, ends_at, base_price, showtime_status)
      VALUES ($1, $2, $3, $4, $5, 'scheduled')
      RETURNING id
    `,
    [Number(movieId), Number(hallId), String(startsAt), String(endsAt), Number(basePrice)],
  );

  jsonOk(res, { message: "سانس جدید ایجاد شد.", showtimeId: result.rows[0].id }, 201);
}));

router.get("/sales-report", asyncHandler(async (req, res) => {
  const managerId = Number(req.query.managerId ?? 2);
  const result = await query<{
    movie_title: string;
    cinema_name: string;
    showtime_id: number;
    sold_tickets: number;
    revenue: string;
  }>(
    `
      SELECT
        m.title AS movie_title,
        c.name AS cinema_name,
        st.id AS showtime_id,
        COUNT(t.id)::int AS sold_tickets,
        COALESCE(SUM(p.amount), 0)::text AS revenue
      FROM showtimes st
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      LEFT JOIN tickets t ON t.showtime_id = st.id
      LEFT JOIN payments p ON p.id = t.payment_id AND p.payment_status = 'success'
      WHERE c.manager_user_id = $1
      GROUP BY m.title, c.name, st.id
      ORDER BY st.id ASC
    `,
    [managerId],
  );

  jsonOk(res, result.rows.map((row) => ({
    movieTitle: row.movie_title,
    cinemaName: row.cinema_name,
    showtimeId: row.showtime_id,
    soldTickets: row.sold_tickets,
    revenue: Number(row.revenue),
  })));
}));

export default router;
