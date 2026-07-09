import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";

const router = Router();

type StaffTicketRow = {
  id: number;
  ticket_number: string;
  ticket_status: string;
  issued_at: string;
  validated_at: string | null;
  full_name: string;
  email: string;
  movie_title: string;
  cinema_name: string;
  hall_name: string;
  row_label: string;
  seat_number: string;
  starts_at: string;
  payment_status: string;
};

function toStaffTicketStatus(status: string) {
  if (status === "used") return "USED";
  if (status === "cancelled") return "CANCELLED";
  return "VALID";
}

function toStaffTicketStatusLabel(status: string) {
  if (status === "used") return "استفاده‌شده";
  if (status === "cancelled") return "لغوشده";
  return "معتبر";
}

async function findTicketByCode(ticketCode: string) {
  return query<StaffTicketRow>(
    `
      SELECT
        t.id,
        t.ticket_number,
        t.ticket_status,
        t.issued_at,
        t.validated_at,
        u.full_name,
        u.email,
        m.title AS movie_title,
        c.name AS cinema_name,
        h.name AS hall_name,
        s.row_label,
        s.seat_number,
        st.starts_at,
        p.payment_status
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      JOIN showtimes st ON st.id = t.showtime_id
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      JOIN seats s ON s.id = t.seat_id
      JOIN payments p ON p.id = t.payment_id
      WHERE t.ticket_number = $1
    `,
    [ticketCode],
  );
}

function toStaffTicketPayload(row: StaffTicketRow) {
  return {
    ticketId: row.id,
    ticketCode: row.ticket_number,
    status: toStaffTicketStatus(row.ticket_status),
    statusLabel: toStaffTicketStatusLabel(row.ticket_status),
    customerName: row.full_name,
    customerEmail: row.email,
    movieTitle: row.movie_title,
    cinemaName: row.cinema_name,
    hallName: row.hall_name,
    seatLabel: `${row.row_label}${row.seat_number}`,
    showtime: row.starts_at,
    paymentStatus: row.payment_status,
    createdAt: row.issued_at,
    validatedAt: row.validated_at,
  };
}

router.get("/tickets/search", asyncHandler(async (req, res) => {
  const code = String(req.query.code || "").trim();
  if (!code) {
    throw new AppError(400, "کد بلیت الزامی است.");
  }

  const result = await findTicketByCode(code);
  if (!result.rowCount) {
    throw new AppError(404, "بلیتی با این کد پیدا نشد.");
  }

  jsonOk(res, {
    message: "بلیت پیدا شد.",
    ticket: toStaffTicketPayload(result.rows[0]),
  });
}));

router.post("/tickets/validate-code", asyncHandler(async (req, res) => {
  const code = String((req.body as { code?: string; ticketCode?: string }).code
    || (req.body as { code?: string; ticketCode?: string }).ticketCode
    || "").trim();

  if (!code) {
    throw new AppError(400, "کد بلیت الزامی است.");
  }

  const result = await findTicketByCode(code);
  if (!result.rowCount) {
    throw new AppError(404, "بلیت نامعتبر است.");
  }

  const row = result.rows[0];
  if (row.ticket_status === "used") {
    throw new AppError(409, "این بلیت قبلاً استفاده شده است.");
  }

  if (row.ticket_status === "cancelled") {
    throw new AppError(409, "این بلیت لغو شده است.");
  }

  await query(
    `
      UPDATE tickets
      SET ticket_status = 'used',
          validated_at = NOW()
      WHERE id = $1
    `,
    [row.id],
  );

  const updated = await findTicketByCode(code);
  jsonOk(res, {
    message: "بلیت معتبر است و ورود تماشاگر ثبت شد.",
    ticket: toStaffTicketPayload(updated.rows[0]),
  });
}));

export default router;
