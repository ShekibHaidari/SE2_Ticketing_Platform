import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";

const router = Router();

type TicketRow = {
  id: number;
  ticket_number: string;
  qr_hash: string;
  qr_code_data_url: string;
  ticket_status: string;
  issued_at: string;
  validated_at: string | null;
  movie_title: string;
  cinema_name: string;
  hall_name: string;
  row_label: string;
  seat_number: string;
  starts_at: string;
  user_name?: string;
};

function toPersianTicketStatus(status: string) {
  if (status === "used") return "استفاده‌شده";
  if (status === "cancelled") return "لغوشده";
  return "معتبر";
}

function toPublicTicketStatus(status: string) {
  if (status === "used") return "USED";
  if (status === "cancelled") return "CANCELLED";
  return "VALID";
}

router.get("/my/:userId", asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  const result = await query<TicketRow>(
    `
      SELECT
        t.id,
        t.ticket_number,
        t.qr_hash,
        t.qr_code_data_url,
        t.ticket_status,
        t.issued_at,
        t.validated_at,
        m.title AS movie_title,
        c.name AS cinema_name,
        h.name AS hall_name,
        s.row_label,
        s.seat_number,
        st.starts_at
      FROM tickets t
      JOIN showtimes st ON st.id = t.showtime_id
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      JOIN seats s ON s.id = t.seat_id
      WHERE t.user_id = $1
      ORDER BY t.issued_at DESC
    `,
    [userId],
  );

  jsonOk(res, result.rows.map((row) => ({
    id: row.id,
    ticketNumber: row.ticket_number,
    qrHash: row.qr_hash,
    qrCodeDataUrl: row.qr_code_data_url,
    ticketStatus: toPublicTicketStatus(row.ticket_status),
    ticketStatusLabel: toPersianTicketStatus(row.ticket_status),
    issuedAt: row.issued_at,
    validatedAt: row.validated_at,
    movieTitle: row.movie_title,
    cinemaName: row.cinema_name,
    hallName: row.hall_name,
    showtime: row.starts_at,
    seat: {
      rowLabel: row.row_label,
      seatNumber: row.seat_number,
    },
  })));
}));

router.get("/:ticketId", asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const result = await query<TicketRow>(
    `
      SELECT
        t.id,
        t.ticket_number,
        t.qr_hash,
        t.qr_code_data_url,
        t.ticket_status,
        t.issued_at,
        t.validated_at,
        m.title AS movie_title,
        c.name AS cinema_name,
        h.name AS hall_name,
        s.row_label,
        s.seat_number,
        st.starts_at,
        u.full_name AS user_name
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      JOIN showtimes st ON st.id = t.showtime_id
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      JOIN seats s ON s.id = t.seat_id
      WHERE t.id = $1
    `,
    [ticketId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "بلیت پیدا نشد.");
  }

  const row = result.rows[0];
  jsonOk(res, {
    id: row.id,
    ticketNumber: row.ticket_number,
    qrHash: row.qr_hash,
    qrCodeDataUrl: row.qr_code_data_url,
    ticketStatus: toPublicTicketStatus(row.ticket_status),
    ticketStatusLabel: toPersianTicketStatus(row.ticket_status),
    issuedAt: row.issued_at,
    validatedAt: row.validated_at,
    ownerName: row.user_name,
    movieTitle: row.movie_title,
    cinemaName: row.cinema_name,
    hallName: row.hall_name,
    showtime: row.starts_at,
    seat: {
      rowLabel: row.row_label,
      seatNumber: row.seat_number,
    },
  });
}));

router.post("/:ticketId/validate", asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const current = await query<{ id: number; ticket_status: string; validated_at: string | null }>(
    `
      SELECT id, ticket_status, validated_at
      FROM tickets
      WHERE id = $1
    `,
    [ticketId],
  );

  if (!current.rowCount) {
    throw new AppError(404, "بلیت پیدا نشد.");
  }

  if (current.rows[0].ticket_status === "used") {
    throw new AppError(409, "این بلیت قبلاً استفاده شده است.");
  }

  if (current.rows[0].ticket_status === "cancelled") {
    throw new AppError(409, "این بلیت لغو شده است.");
  }

  const result = await query<{ id: number; ticket_status: string; validated_at: string | null }>(
    `
      UPDATE tickets
      SET ticket_status = 'used',
          validated_at = NOW()
      WHERE id = $1
      RETURNING id, ticket_status, validated_at
    `,
    [ticketId],
  );

  const row = result.rows[0];
  jsonOk(res, {
    ticketId: row.id,
    valid: true,
    ticketStatus: toPublicTicketStatus(row.ticket_status),
    ticketStatusLabel: toPersianTicketStatus(row.ticket_status),
    validatedAt: row.validated_at,
  });
}));

export default router;
