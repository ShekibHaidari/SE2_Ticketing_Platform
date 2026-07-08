import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { jsonOk } from "../../shared/http";
import { buildSeatMap } from "../reservations/service";

const router = Router();

type VenueRow = {
  id: number;
  name: string;
  city: string;
  address_line: string;
  venue_status: string;
};

router.get("/", asyncHandler(async (_req, res) => {
  const result = await query<VenueRow>(
    `
      SELECT id, name, city, address_line, venue_status
      FROM venues
      WHERE venue_status = 'active'
      ORDER BY id ASC
    `,
  );

  jsonOk(res, result.rows.map((row: VenueRow) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    addressLine: row.address_line,
    venueStatus: row.venue_status,
  })));
}));

router.get("/:venueId/seat-map", asyncHandler(async (req, res) => {
  const venueId = Number(req.params.venueId);
  const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
  const seatMap = await buildSeatMap(venueId, eventId);
  jsonOk(res, seatMap);
}));

export default router;
