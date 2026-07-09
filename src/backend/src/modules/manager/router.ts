import { Router } from "express";
import { query, withTransaction } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk, requireRoles } from "../../shared/http";
import type { AuthenticatedRequest } from "../../shared/types";
import { normalizeRole } from "../../shared/roles";

const router = Router();

router.use(requireRoles("CINEMA_MANAGER", "ADMIN"));

type DashboardRow = {
  total_movies: number;
  total_showtimes: number;
  total_halls: number;
  total_sold_tickets: number;
  total_revenue: string;
  today_revenue: string;
  total_capacity: number;
};

type MovieRow = {
  id: number;
  title: string;
  description: string | null;
  genre: string;
  duration_minutes: number;
  age_rating: string;
  language: string;
  poster_url: string | null;
  movie_status: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
};

type CinemaRow = {
  id: number;
  name: string;
  city: string;
  address_line: string;
  phone: string | null;
  manager_user_id: number | null;
  cinema_status: string;
  created_at: string;
};

type HallRow = {
  id: number;
  cinema_id: number;
  cinema_name: string;
  name: string;
  rows_count: number;
  seats_per_row: number;
  capacity: number;
};

type ShowtimeRow = {
  id: number;
  movie_id: number;
  movie_title: string;
  cinema_id: number;
  cinema_name: string;
  hall_id: number;
  hall_name: string;
  starts_at: string;
  ends_at: string;
  base_price: string;
  showtime_status: string;
  sold_seats: number;
  remaining_seats: number;
};

type SalesSummaryRow = {
  total_revenue: string;
  tickets_sold: number;
  active_showtimes: number;
  total_remaining_seats: number;
  today_revenue: string;
};

type SalesMovieRow = {
  movie_title: string;
  tickets_sold: number;
  revenue: string;
};

type SalesShowtimeRow = {
  showtime_id: number;
  movie_title: string;
  cinema_name: string;
  hall_name: string;
  starts_at: string;
  sold_seats: number;
  remaining_seats: number;
  revenue: string;
};

function currentActor(req: AuthenticatedRequest) {
  const authUser = req.authUser;
  if (!authUser) {
    throw new AppError(401, "برای مشاهده این بخش ابتدا وارد شوید.");
  }

  return {
    userId: authUser.userId,
    role: normalizeRole(authUser.role),
  };
}

function managerCinemaCondition(req: AuthenticatedRequest, tableAlias = "c") {
  const actor = currentActor(req);
  if (actor.role === "ADMIN") {
    return { clause: "TRUE", params: [] as unknown[] };
  }

  return {
    clause: `${tableAlias}.manager_user_id = $1`,
    params: [actor.userId] as unknown[],
  };
}

function mapMovieStatus(value: unknown) {
  const normalized = String(value || "DRAFT").trim().toUpperCase();
  if (normalized === "PUBLISHED") return "published";
  if (normalized === "ARCHIVED") return "archived";
  return "draft";
}

function mapShowtimeStatus(value: unknown) {
  const normalized = String(value || "DRAFT").trim().toUpperCase();
  if (normalized === "PUBLISHED") return "published";
  if (normalized === "CANCELLED") return "cancelled";
  if (normalized === "COMPLETED") return "completed";
  return "draft";
}

function toMoviePayload(row: MovieRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    genre: row.genre,
    durationMinutes: row.duration_minutes,
    ageRating: row.age_rating,
    language: row.language,
    posterUrl: row.poster_url,
    status: row.movie_status.toUpperCase(),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCinemaPayload(row: CinemaRow) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    address: row.address_line,
    phone: row.phone,
    managerUserId: row.manager_user_id,
    status: row.cinema_status.toUpperCase(),
    createdAt: row.created_at,
  };
}

function toShowtimePayload(row: ShowtimeRow) {
  return {
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.movie_title,
    cinemaId: row.cinema_id,
    cinemaName: row.cinema_name,
    hallId: row.hall_id,
    hallName: row.hall_name,
    startTime: row.starts_at,
    endTime: row.ends_at,
    ticketPrice: Number(row.base_price),
    status: row.showtime_status.toUpperCase(),
    soldSeats: row.sold_seats,
    remainingSeats: row.remaining_seats,
  };
}

router.get("/dashboard", asyncHandler(async (req, res) => {
  const scope = managerCinemaCondition(req);
  const result = await query<DashboardRow>(
    `
      SELECT
        COUNT(DISTINCT m.id)::int AS total_movies,
        COUNT(DISTINCT st.id)::int AS total_showtimes,
        COUNT(DISTINCT h.id)::int AS total_halls,
        COUNT(DISTINCT t.id)::int AS total_sold_tickets,
        COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0)::text AS total_revenue,
        COALESCE(SUM(CASE
          WHEN p.payment_status = 'success' AND DATE(COALESCE(p.paid_at, p.updated_at, p.created_at)) = CURRENT_DATE
          THEN p.amount
          ELSE 0
        END), 0)::text AS today_revenue,
        COALESCE(SUM(h.capacity), 0)::int AS total_capacity
      FROM cinemas c
      LEFT JOIN halls h ON h.cinema_id = c.id
      LEFT JOIN showtimes st ON st.hall_id = h.id
      LEFT JOIN movies m ON m.id = st.movie_id
      LEFT JOIN tickets t ON t.showtime_id = st.id
      LEFT JOIN payments p ON p.id = t.payment_id
      WHERE ${scope.clause}
    `,
    scope.params,
  );

  const row = result.rows[0];
  const remainingSeats = Math.max(0, row.total_capacity - row.total_sold_tickets);

  jsonOk(res, {
    totalMovies: row.total_movies,
    totalShowtimes: row.total_showtimes,
    totalHalls: row.total_halls,
    totalSoldTickets: row.total_sold_tickets,
    totalRevenue: Number(row.total_revenue),
    todayRevenue: Number(row.today_revenue),
    remainingSeatsSummary: {
      totalCapacity: row.total_capacity,
      soldSeats: row.total_sold_tickets,
      remainingSeats,
      activeShowtimes: row.total_showtimes,
    },
  });
}));

router.get("/movies", asyncHandler(async (req, res) => {
  const actor = currentActor(req);
  const result = await query<MovieRow>(
    `
      SELECT
        id,
        title,
        description,
        genre,
        duration_minutes,
        age_rating,
        language,
        poster_url,
        movie_status,
        created_by,
        created_at,
        updated_at
      FROM movies
      WHERE $1 = 'ADMIN' OR created_by IS NULL OR created_by = $2
      ORDER BY updated_at DESC, id DESC
    `,
    [actor.role, actor.userId],
  );

  jsonOk(res, result.rows.map(toMoviePayload));
}));

router.post("/movies", asyncHandler(async (req, res) => {
  const actor = currentActor(req);
  const {
    title,
    description,
    genre,
    durationMinutes,
    ageRating = "عمومی",
    language = "دری",
    posterUrl = null,
    status = "DRAFT",
  } = req.body as Record<string, unknown>;

  if (!title || !genre || !durationMinutes) {
    throw new AppError(400, "نام فیلم، ژانر و مدت زمان الزامی است.");
  }

  if (Number(durationMinutes) <= 0) {
    throw new AppError(400, "مدت زمان فیلم باید بیشتر از صفر باشد.");
  }

  const result = await query<MovieRow>(
    `
      INSERT INTO movies (
        title,
        description,
        genre,
        duration_minutes,
        age_rating,
        language,
        poster_url,
        movie_status,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        title,
        description,
        genre,
        duration_minutes,
        age_rating,
        language,
        poster_url,
        movie_status,
        created_by,
        created_at,
        updated_at
    `,
    [
      String(title).trim(),
      description ? String(description).trim() : null,
      String(genre).trim(),
      Number(durationMinutes),
      String(ageRating).trim(),
      String(language).trim(),
      posterUrl ? String(posterUrl).trim() : null,
      mapMovieStatus(status),
      actor.userId,
    ],
  );

  jsonOk(res, {
    message: "فیلم با موفقیت ثبت شد.",
    movie: toMoviePayload(result.rows[0]),
  }, 201);
}));

router.put("/movies/:movieId", asyncHandler(async (req, res) => {
  const actor = currentActor(req);
  const movieId = Number(req.params.movieId);
  const {
    title,
    description,
    genre,
    durationMinutes,
    ageRating = "عمومی",
    language = "دری",
    posterUrl = null,
    status = "DRAFT",
  } = req.body as Record<string, unknown>;

  if (!title || !genre || !durationMinutes) {
    throw new AppError(400, "نام فیلم، ژانر و مدت زمان الزامی است.");
  }

  const existing = await query<{ created_by: number | null }>(
    `SELECT created_by FROM movies WHERE id = $1`,
    [movieId],
  );
  if (!existing.rowCount) {
    throw new AppError(404, "فیلم مورد نظر پیدا نشد.");
  }

  if (actor.role !== "ADMIN" && existing.rows[0].created_by && existing.rows[0].created_by !== actor.userId) {
    throw new AppError(403, "شما اجازه ویرایش این فیلم را ندارید.");
  }

  const result = await query<MovieRow>(
    `
      UPDATE movies
      SET title = $2,
          description = $3,
          genre = $4,
          duration_minutes = $5,
          age_rating = $6,
          language = $7,
          poster_url = $8,
          movie_status = $9,
          updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        title,
        description,
        genre,
        duration_minutes,
        age_rating,
        language,
        poster_url,
        movie_status,
        created_by,
        created_at,
        updated_at
    `,
    [
      movieId,
      String(title).trim(),
      description ? String(description).trim() : null,
      String(genre).trim(),
      Number(durationMinutes),
      String(ageRating).trim(),
      String(language).trim(),
      posterUrl ? String(posterUrl).trim() : null,
      mapMovieStatus(status),
    ],
  );

  jsonOk(res, {
    message: "فیلم با موفقیت به‌روزرسانی شد.",
    movie: toMoviePayload(result.rows[0]),
  });
}));

router.get("/cinemas", asyncHandler(async (req, res) => {
  const scope = managerCinemaCondition(req);
  const result = await query<CinemaRow>(
    `
      SELECT id, name, city, address_line, phone, manager_user_id, cinema_status, created_at
      FROM cinemas c
      WHERE ${scope.clause}
      ORDER BY created_at DESC, id DESC
    `,
    scope.params,
  );

  jsonOk(res, result.rows.map(toCinemaPayload));
}));

router.post("/cinemas", asyncHandler(async (req, res) => {
  const actor = currentActor(req);
  const { name, city, address, phone } = req.body as Record<string, unknown>;

  if (!name || !city || !address) {
    throw new AppError(400, "نام سینما، شهر و آدرس الزامی است.");
  }

  const managerUserId = actor.role === "ADMIN"
    ? (req.body.managerUserId ? Number(req.body.managerUserId) : actor.userId)
    : actor.userId;

  const result = await query<CinemaRow>(
    `
      INSERT INTO cinemas (name, city, address_line, phone, manager_user_id, cinema_status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id, name, city, address_line, phone, manager_user_id, cinema_status, created_at
    `,
    [
      String(name).trim(),
      String(city).trim(),
      String(address).trim(),
      phone ? String(phone).trim() : null,
      managerUserId,
    ],
  );

  jsonOk(res, {
    message: "سینما با موفقیت ثبت شد.",
    cinema: toCinemaPayload(result.rows[0]),
  }, 201);
}));

router.get("/cinemas/:cinemaId/halls", asyncHandler(async (req, res) => {
  const scope = managerCinemaCondition(req);
  const cinemaId = Number(req.params.cinemaId);
  const result = await query<HallRow>(
    `
      SELECT
        h.id,
        h.cinema_id,
        c.name AS cinema_name,
        h.name,
        h.rows_count,
        h.seats_per_row,
        h.capacity
      FROM halls h
      JOIN cinemas c ON c.id = h.cinema_id
      WHERE h.cinema_id = $${scope.params.length + 1} AND ${scope.clause}
      ORDER BY h.id DESC
    `,
    [...scope.params, cinemaId],
  );

  jsonOk(res, result.rows.map((row) => ({
    id: row.id,
    cinemaId: row.cinema_id,
    cinemaName: row.cinema_name,
    name: row.name,
    rows: row.rows_count,
    seatsPerRow: row.seats_per_row,
    capacity: row.capacity,
  })));
}));

router.post("/halls", asyncHandler(async (req, res) => {
  const scope = managerCinemaCondition(req);
  const { cinemaId, name, capacity, rows, seatsPerRow } = req.body as Record<string, unknown>;

  if (!cinemaId || !name || !rows || !seatsPerRow) {
    throw new AppError(400, "سینما، نام سالن، تعداد ردیف و صندلی در هر ردیف الزامی است.");
  }

  const rowCount = Number(rows);
  const seatCountPerRow = Number(seatsPerRow);
  const computedCapacity = Number(capacity) || rowCount * seatCountPerRow;

  if (rowCount <= 0 || seatCountPerRow <= 0 || computedCapacity <= 0) {
    throw new AppError(400, "ظرفیت سالن باید بیشتر از صفر باشد.");
  }

  const cinemaCheck = await query<{ id: number }>(
    `SELECT id FROM cinemas c WHERE c.id = $${scope.params.length + 1} AND ${scope.clause}`,
    [...scope.params, Number(cinemaId)],
  );
  if (!cinemaCheck.rowCount) {
    throw new AppError(404, "سینمای مورد نظر پیدا نشد.");
  }

  const result = await withTransaction(async (client) => {
    const hallResult = await client.query<HallRow>(
      `
        INSERT INTO halls (cinema_id, name, rows_count, seats_per_row, capacity)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, cinema_id, name, rows_count, seats_per_row, capacity
      `,
      [Number(cinemaId), String(name).trim(), rowCount, seatCountPerRow, computedCapacity],
    );

    const hall = hallResult.rows[0];
    const sectionResult = await client.query<{ id: number }>(
      `
        INSERT INTO sections (hall_id, name, base_price, sort_order)
        VALUES ($1, 'عمومی', 0, 1)
        RETURNING id
      `,
      [hall.id],
    );

    const sectionId = sectionResult.rows[0].id;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const rowLabel = String.fromCharCode(65 + rowIndex);
      for (let seatIndex = 1; seatIndex <= seatCountPerRow; seatIndex += 1) {
        await client.query(
          `
            INSERT INTO seats (
              section_id,
              row_label,
              seat_number,
              x_coordinate,
              y_coordinate,
              seat_type,
              seat_status
            )
            VALUES ($1, $2, $3, $4, $5, 'regular', 'available')
          `,
          [sectionId, rowLabel, String(seatIndex), seatIndex, rowIndex + 1],
        );
      }
    }

    return hall;
  });

  jsonOk(res, {
    message: "سالن و صندلی‌ها با موفقیت ساخته شدند.",
    hall: {
      id: result.id,
      cinemaId: result.cinema_id,
      name: result.name,
      rows: result.rows_count,
      seatsPerRow: result.seats_per_row,
      capacity: result.capacity,
    },
  }, 201);
}));

router.get("/showtimes", asyncHandler(async (req, res) => {
  const scope = managerCinemaCondition(req);
  const result = await query<ShowtimeRow>(
    `
      SELECT
        st.id,
        st.movie_id,
        m.title AS movie_title,
        c.id AS cinema_id,
        c.name AS cinema_name,
        h.id AS hall_id,
        h.name AS hall_name,
        st.starts_at,
        st.ends_at,
        st.base_price,
        st.showtime_status,
        COUNT(t.id)::int AS sold_seats,
        GREATEST(h.capacity - COUNT(t.id), 0)::int AS remaining_seats
      FROM showtimes st
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      LEFT JOIN tickets t ON t.showtime_id = st.id
      WHERE ${scope.clause}
      GROUP BY st.id, m.title, c.id, c.name, h.id, h.name, h.capacity
      ORDER BY st.starts_at DESC
    `,
    scope.params,
  );

  jsonOk(res, result.rows.map(toShowtimePayload));
}));

router.post("/showtimes", asyncHandler(async (req, res) => {
  const scope = managerCinemaCondition(req);
  const {
    movieId,
    cinemaId,
    hallId,
    startTime,
    endTime,
    ticketPrice,
    status = "DRAFT",
  } = req.body as Record<string, unknown>;

  if (!movieId || !cinemaId || !hallId || !startTime || !endTime || !ticketPrice) {
    throw new AppError(400, "فیلم، سینما، سالن، زمان شروع، زمان پایان و قیمت بلیت الزامی است.");
  }

  if (new Date(String(startTime)).getTime() >= new Date(String(endTime)).getTime()) {
    throw new AppError(400, "زمان شروع باید قبل از زمان پایان باشد.");
  }

  if (Number(ticketPrice) <= 0) {
    throw new AppError(400, "قیمت بلیت باید بیشتر از صفر باشد.");
  }

  const [movieResult, hallResult] = await Promise.all([
    query<{ id: number }>(`SELECT id FROM movies WHERE id = $1`, [Number(movieId)]),
    query<{ id: number; cinema_id: number }>(
      `
        SELECT h.id, h.cinema_id
        FROM halls h
        JOIN cinemas c ON c.id = h.cinema_id
        WHERE h.id = $${scope.params.length + 1} AND h.cinema_id = $${scope.params.length + 2} AND ${scope.clause}
      `,
      [...scope.params, Number(hallId), Number(cinemaId)],
    ),
  ]);

  if (!movieResult.rowCount) {
    throw new AppError(404, "فیلم مورد نظر پیدا نشد.");
  }

  if (!hallResult.rowCount) {
    throw new AppError(404, "سالن یا سینمای مورد نظر پیدا نشد.");
  }

  const result = await query<ShowtimeRow>(
    `
      INSERT INTO showtimes (
        movie_id,
        cinema_id,
        hall_id,
        starts_at,
        ends_at,
        base_price,
        showtime_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        movie_id,
        $8::text AS movie_title,
        cinema_id,
        $9::text AS cinema_name,
        hall_id,
        $10::text AS hall_name,
        starts_at,
        ends_at,
        base_price,
        showtime_status,
        0::int AS sold_seats,
        0::int AS remaining_seats
    `,
    [
      Number(movieId),
      Number(cinemaId),
      Number(hallId),
      String(startTime),
      String(endTime),
      Number(ticketPrice),
      mapShowtimeStatus(status),
      "",
      "",
      "",
    ],
  );

  const enriched = await query<ShowtimeRow>(
    `
      SELECT
        st.id,
        st.movie_id,
        m.title AS movie_title,
        c.id AS cinema_id,
        c.name AS cinema_name,
        h.id AS hall_id,
        h.name AS hall_name,
        st.starts_at,
        st.ends_at,
        st.base_price,
        st.showtime_status,
        0::int AS sold_seats,
        h.capacity::int AS remaining_seats
      FROM showtimes st
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = st.cinema_id
      WHERE st.id = $1
    `,
    [result.rows[0].id],
  );

  jsonOk(res, {
    message: "سانس با موفقیت ساخته شد.",
    showtime: toShowtimePayload(enriched.rows[0]),
  }, 201);
}));

router.get("/sales-report", asyncHandler(async (req, res) => {
  const scope = managerCinemaCondition(req);
  const [summaryResult, byMovieResult, byShowtimeResult] = await Promise.all([
    query<SalesSummaryRow>(
      `
        SELECT
          COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0)::text AS total_revenue,
          COUNT(t.id)::int AS tickets_sold,
          COUNT(DISTINCT CASE WHEN st.showtime_status = 'published' THEN st.id END)::int AS active_showtimes,
          COALESCE(SUM(h.capacity), 0)::int - COUNT(t.id)::int AS total_remaining_seats,
          COALESCE(SUM(CASE
            WHEN p.payment_status = 'success' AND DATE(COALESCE(p.paid_at, p.updated_at, p.created_at)) = CURRENT_DATE
            THEN p.amount
            ELSE 0
          END), 0)::text AS today_revenue
        FROM cinemas c
        LEFT JOIN halls h ON h.cinema_id = c.id
        LEFT JOIN showtimes st ON st.hall_id = h.id
        LEFT JOIN tickets t ON t.showtime_id = st.id
        LEFT JOIN payments p ON p.id = t.payment_id
        WHERE ${scope.clause}
      `,
      scope.params,
    ),
    query<SalesMovieRow>(
      `
        SELECT
          m.title AS movie_title,
          COUNT(t.id)::int AS tickets_sold,
          COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0)::text AS revenue
        FROM showtimes st
        JOIN movies m ON m.id = st.movie_id
        JOIN halls h ON h.id = st.hall_id
        JOIN cinemas c ON c.id = h.cinema_id
        LEFT JOIN tickets t ON t.showtime_id = st.id
        LEFT JOIN payments p ON p.id = t.payment_id
        WHERE ${scope.clause}
        GROUP BY m.title
        ORDER BY revenue DESC, tickets_sold DESC, m.title ASC
      `,
      scope.params,
    ),
    query<SalesShowtimeRow>(
      `
        SELECT
          st.id AS showtime_id,
          m.title AS movie_title,
          c.name AS cinema_name,
          h.name AS hall_name,
          st.starts_at,
          COUNT(t.id)::int AS sold_seats,
          GREATEST(h.capacity - COUNT(t.id), 0)::int AS remaining_seats,
          COALESCE(SUM(CASE WHEN p.payment_status = 'success' THEN p.amount ELSE 0 END), 0)::text AS revenue
        FROM showtimes st
        JOIN movies m ON m.id = st.movie_id
        JOIN halls h ON h.id = st.hall_id
        JOIN cinemas c ON c.id = h.cinema_id
        LEFT JOIN tickets t ON t.showtime_id = st.id
        LEFT JOIN payments p ON p.id = t.payment_id
        WHERE ${scope.clause}
        GROUP BY st.id, m.title, c.name, h.name, h.capacity
        ORDER BY st.starts_at DESC
      `,
      scope.params,
    ),
  ]);

  const summary = summaryResult.rows[0];
  jsonOk(res, {
    totalRevenue: Number(summary.total_revenue),
    todayRevenue: Number(summary.today_revenue),
    ticketsSold: summary.tickets_sold,
    activeShowtimes: summary.active_showtimes,
    remainingSeats: Math.max(0, summary.total_remaining_seats),
    revenueByMovie: byMovieResult.rows.map((row) => ({
      movieTitle: row.movie_title,
      ticketsSold: row.tickets_sold,
      revenue: Number(row.revenue),
    })),
    revenueByShowtime: byShowtimeResult.rows.map((row) => ({
      showtimeId: row.showtime_id,
      movieTitle: row.movie_title,
      cinemaName: row.cinema_name,
      hallName: row.hall_name,
      startTime: row.starts_at,
      soldSeats: row.sold_seats,
      remainingSeats: row.remaining_seats,
      revenue: Number(row.revenue),
    })),
  });
}));

export default router;
