import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";

const router = Router();

type CinemaRow = {
  id: number;
  name: string;
  city: string;
  address_line: string;
  manager_user_id: number | null;
  cinema_status: string;
};

type HallRow = {
  id: number;
  cinema_id: number;
  name: string;
  capacity: number;
};

router.get("/", asyncHandler(async (_req, res) => {
  const result = await query<CinemaRow>(
    `
      SELECT id, name, city, address_line, manager_user_id, cinema_status
      FROM cinemas
      WHERE cinema_status = 'active'
      ORDER BY city, name
    `,
  );

  jsonOk(res, result.rows.map((row: CinemaRow) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    addressLine: row.address_line,
    managerUserId: row.manager_user_id,
    cinemaStatus: row.cinema_status,
  })));
}));

router.get("/:cinemaId", asyncHandler(async (req, res) => {
  const cinemaId = Number(req.params.cinemaId);
  const result = await query<CinemaRow>(
    `
      SELECT id, name, city, address_line, manager_user_id, cinema_status
      FROM cinemas
      WHERE id = $1
    `,
    [cinemaId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "سینما پیدا نشد.");
  }

  const row = result.rows[0];
  jsonOk(res, {
    id: row.id,
    name: row.name,
    city: row.city,
    addressLine: row.address_line,
    managerUserId: row.manager_user_id,
    cinemaStatus: row.cinema_status,
  });
}));

router.get("/:cinemaId/halls", asyncHandler(async (req, res) => {
  const cinemaId = Number(req.params.cinemaId);
  const result = await query<HallRow>(
    `
      SELECT id, cinema_id, name, capacity
      FROM halls
      WHERE cinema_id = $1
      ORDER BY id ASC
    `,
    [cinemaId],
  );

  jsonOk(res, result.rows.map((row: HallRow) => ({
    id: row.id,
    cinemaId: row.cinema_id,
    name: row.name,
    capacity: row.capacity,
  })));
}));

export default router;
