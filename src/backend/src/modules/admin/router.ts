import fs from "fs";
import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { jsonOk } from "../../shared/http";
import { resolveProjectFile } from "../../shared/files";

const router = Router();

router.post("/seed-demo-reset", asyncHandler(async (_req, res) => {
  const cleanupSql = `
    TRUNCATE TABLE
      notifications,
      tickets,
      payments,
      reservation_seats,
      reservations,
      events,
      seats,
      sections,
      halls,
      venues,
      organizer_profiles,
      admin_action_logs,
      users
    RESTART IDENTITY CASCADE
  `;

  await query(cleanupSql);

  const seedPath = resolveProjectFile("database", "seed.sql");
  const seedSql = fs.readFileSync(seedPath, "utf8");
  const statements = seedSql
    .split(/;\s*\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await query(statement);
  }

  jsonOk(res, {
    message: "Demo data reset completed from database/seed.sql.",
  });
}));

router.get("/system-summary", asyncHandler(async (_req, res) => {
  const [users, events, reservations, payments, tickets, notifications] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total FROM users`),
    query(`SELECT COUNT(*)::int AS total FROM events`),
    query(`SELECT COUNT(*)::int AS total FROM reservations`),
    query(`SELECT COUNT(*)::int AS total FROM payments`),
    query(`SELECT COUNT(*)::int AS total FROM tickets`),
    query(`SELECT COUNT(*)::int AS total FROM notifications`),
  ]);

  jsonOk(res, {
    users: users.rows[0].total,
    events: events.rows[0].total,
    reservations: reservations.rows[0].total,
    payments: payments.rows[0].total,
    tickets: tickets.rows[0].total,
    notifications: notifications.rows[0].total,
  });
}));

export default router;
