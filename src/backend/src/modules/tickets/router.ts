import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";

const router = Router();

type TicketListRow = {
  id: number;
  ticket_number: string;
  qr_hash: string;
  qr_code_data_url: string;
  ticket_status: string;
  issued_at: string;
  event_id: number;
  event_title: string;
  row_label: string;
  seat_number: string;
};

type TicketDetailsRow = TicketListRow & {
  reservation_id: number;
  payment_id: number;
  validated_at: string | null;
};

type TicketValidationRow = {
  id: number;
  ticket_status: string;
  validated_at: string | null;
};

router.get("/my/:userId", asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  const result = await query<TicketListRow>(
    `
      SELECT
        t.id,
        t.ticket_number,
        t.qr_hash,
        t.qr_code_data_url,
        t.ticket_status,
        t.issued_at,
        e.id AS event_id,
        e.title AS event_title,
        s.row_label,
        s.seat_number
      FROM tickets t
      JOIN reservations r ON r.id = t.reservation_id
      JOIN events e ON e.id = t.event_id
      JOIN seats s ON s.id = t.seat_id
      WHERE r.user_id = $1
      ORDER BY t.issued_at DESC
    `,
    [userId],
  );

  jsonOk(res, result.rows.map((row: TicketListRow) => ({
    id: row.id,
    ticketNumber: row.ticket_number,
    qrHash: row.qr_hash,
    qrCodeDataUrl: row.qr_code_data_url,
    ticketStatus: row.ticket_status,
    issuedAt: row.issued_at,
    event: {
      id: row.event_id,
      title: row.event_title,
    },
    seat: {
      rowLabel: row.row_label,
      seatNumber: row.seat_number,
    },
  })));
}));

router.get("/:ticketId", asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const result = await query<TicketDetailsRow>(
    `
      SELECT
        t.id,
        t.event_id,
        t.reservation_id,
        t.payment_id,
        t.ticket_number,
        t.qr_hash,
        t.qr_code_data_url,
        t.ticket_status,
        t.issued_at,
        t.validated_at,
        e.title AS event_title,
        s.row_label,
        s.seat_number
      FROM tickets t
      JOIN events e ON e.id = t.event_id
      JOIN seats s ON s.id = t.seat_id
      WHERE t.id = $1
    `,
    [ticketId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "Ticket not found.");
  }

  const row = result.rows[0];
  jsonOk(res, {
    id: row.id,
    eventId: row.event_id,
    reservationId: row.reservation_id,
    paymentId: row.payment_id,
    ticketNumber: row.ticket_number,
    qrHash: row.qr_hash,
    qrCodeDataUrl: row.qr_code_data_url,
    ticketStatus: row.ticket_status,
    issuedAt: row.issued_at,
    validatedAt: row.validated_at,
    eventTitle: row.event_title,
    seat: {
      rowLabel: row.row_label,
      seatNumber: row.seat_number,
    },
  });
}));

router.post("/:ticketId/validate", asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.ticketId);

  const result = await query<TicketValidationRow>(
    `
      UPDATE tickets
      SET ticket_status = CASE
            WHEN ticket_status = 'active' THEN 'used'
            ELSE ticket_status
          END,
          validated_at = CASE
            WHEN ticket_status = 'active' THEN NOW()
            ELSE validated_at
          END
      WHERE id = $1
      RETURNING id, ticket_status, validated_at
    `,
    [ticketId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "Ticket not found.");
  }

  const row = result.rows[0];
  jsonOk(res, {
    ticketId: row.id,
    valid: row.ticket_status === "used" || row.ticket_status === "active",
    ticketStatus: row.ticket_status,
    validatedAt: row.validated_at,
  });
}));

export default router;
