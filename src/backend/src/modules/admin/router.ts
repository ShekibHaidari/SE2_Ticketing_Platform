import fs from "fs";
import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { jsonOk } from "../../shared/http";
import { resolveProjectFile } from "../../shared/files";

const router = Router();

router.post("/seed-demo-reset", asyncHandler(async (_req, res) => {
  await query(`
    TRUNCATE TABLE
      notifications,
      tickets,
      payments,
      reservation_seats,
      reservations,
      showtimes,
      movies,
      seats,
      sections,
      halls,
      cinemas,
      admin_action_logs,
      users
    RESTART IDENTITY CASCADE
  `);

  const seedSql = fs.readFileSync(resolveProjectFile("database", "seed.sql"), "utf8");
  const statements = seedSql
    .split(/;\s*\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await query(statement);
  }

  jsonOk(res, { message: "داده‌های نمایشی سینما دوباره بارگذاری شد." });
}));

router.get("/system-summary", asyncHandler(async (_req, res) => {
  const [users, movies, cinemas, reservations, payments, tickets, showtimes] = await Promise.all([
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM users`),
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM movies`),
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM cinemas`),
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM reservations`),
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM payments`),
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM tickets`),
    query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM showtimes`),
  ]);

  jsonOk(res, {
    users: users.rows[0].total,
    movies: movies.rows[0].total,
    cinemas: cinemas.rows[0].total,
    showtimes: showtimes.rows[0].total,
    reservations: reservations.rows[0].total,
    payments: payments.rows[0].total,
    tickets: tickets.rows[0].total,
    monitoringLinks: {
      rabbitmq: "http://localhost:15672",
      prometheus: "http://localhost:9090",
      grafana: "http://localhost:3001",
    },
  });
}));

router.get("/users", asyncHandler(async (_req, res) => {
  const result = await query<{
    id: number;
    full_name: string;
    email: string;
    role: string;
    account_status: string;
  }>(
    `
      SELECT id, full_name, email, role, account_status
      FROM users
      ORDER BY id ASC
    `,
  );

  jsonOk(res, result.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    accountStatus: row.account_status,
  })));
}));

router.get("/cinemas", asyncHandler(async (_req, res) => {
  const result = await query<{
    id: number;
    name: string;
    city: string;
    cinema_status: string;
  }>(
    `
      SELECT id, name, city, cinema_status
      FROM cinemas
      ORDER BY id ASC
    `,
  );

  jsonOk(res, result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    cinemaStatus: row.cinema_status,
  })));
}));

export default router;
