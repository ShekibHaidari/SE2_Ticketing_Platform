import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";

const router = Router();

type EventListRow = {
  id: number;
  title: string;
  category: string;
  description: string | null;
  start_time: string;
  end_time: string;
  publish_status: string;
  hall_name: string;
  venue_id: number;
  venue_name: string;
  city: string;
};

type EventDetailsRow = EventListRow & {
  organizer_id: number;
  hall_id: number;
  address_line: string;
};

router.get("/", asyncHandler(async (_req, res) => {
  const result = await query<EventListRow>(
    `
      SELECT
        e.id,
        e.title,
        e.category,
        e.description,
        e.start_time,
        e.end_time,
        e.publish_status,
        h.name AS hall_name,
        v.id AS venue_id,
        v.name AS venue_name,
        v.city
      FROM events e
      JOIN halls h ON h.id = e.hall_id
      JOIN venues v ON v.id = h.venue_id
      WHERE e.publish_status = 'published'
      ORDER BY e.start_time ASC
    `,
  );

  jsonOk(res, result.rows.map((row: EventListRow) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    publishStatus: row.publish_status,
    hallName: row.hall_name,
    venue: {
      id: row.venue_id,
      name: row.venue_name,
      city: row.city,
    },
  })));
}));

router.get("/:eventId", asyncHandler(async (req, res) => {
  const eventId = Number(req.params.eventId);

  const eventResult = await query<EventDetailsRow>(
    `
      SELECT
        e.id,
        e.title,
        e.category,
        e.description,
        e.start_time,
        e.end_time,
        e.publish_status,
        e.organizer_id,
        h.id AS hall_id,
        h.name AS hall_name,
        v.id AS venue_id,
        v.name AS venue_name,
        v.city,
        v.address_line
      FROM events e
      JOIN halls h ON h.id = e.hall_id
      JOIN venues v ON v.id = h.venue_id
      WHERE e.id = $1
    `,
    [eventId],
  );

  if (!eventResult.rowCount) {
    throw new AppError(404, "Event not found.");
  }

  const seatCountResult = await query<{ total_seats: string; sold_tickets: string }>(
    `
      SELECT
        COUNT(s.id)::text AS total_seats,
        (
          SELECT COUNT(*)
          FROM tickets t
          WHERE t.event_id = $1
            AND t.ticket_status IN ('active', 'used')
        )::text AS sold_tickets
      FROM events e
      JOIN halls h ON h.id = e.hall_id
      JOIN sections sec ON sec.hall_id = h.id
      JOIN seats s ON s.section_id = sec.id
      WHERE e.id = $1
    `,
    [eventId],
  );

  const row = eventResult.rows[0];
  const seatStats = seatCountResult.rows[0];

  jsonOk(res, {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    publishStatus: row.publish_status,
    organizerId: row.organizer_id,
    hall: {
      id: row.hall_id,
      name: row.hall_name,
    },
    venue: {
      id: row.venue_id,
      name: row.venue_name,
      city: row.city,
      addressLine: row.address_line,
    },
    seatSummary: {
      totalSeats: Number(seatStats.total_seats),
      soldTickets: Number(seatStats.sold_tickets),
      availableSeats: Number(seatStats.total_seats) - Number(seatStats.sold_tickets),
    },
  });
}));

export default router;
