import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { jsonOk } from "../../shared/http";

const router = Router();

type TicketLookupRow = {
  id: number;
  ticket_number: string;
  ticket_status: string;
  full_name: string;
  movie_title: string;
  cinema_name: string;
  hall_name: string;
  row_label: string;
  seat_number: string;
  starts_at: string;
};

router.post("/tickets/validate-code", asyncHandler(async (req, res) => {
  const { ticketCode } = req.body as { ticketCode?: string };

  if (!ticketCode) {
    jsonOk(res, { valid: false, message: "کد بلیت وارد نشده است." }, 400);
    return;
  }

  const result = await query<TicketLookupRow>(
    `
      SELECT
        t.id,
        t.ticket_number,
        t.ticket_status,
        u.full_name,
        m.title AS movie_title,
        c.name AS cinema_name,
        h.name AS hall_name,
        s.row_label,
        s.seat_number,
        st.starts_at
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      JOIN showtimes st ON st.id = t.showtime_id
      JOIN movies m ON m.id = st.movie_id
      JOIN halls h ON h.id = st.hall_id
      JOIN cinemas c ON c.id = h.cinema_id
      JOIN seats s ON s.id = t.seat_id
      WHERE t.ticket_number = $1
    `,
    [ticketCode],
  );

  if (!result.rowCount) {
    jsonOk(res, { valid: false, status: "invalid", message: "بلیت نامعتبر است." }, 404);
    return;
  }

  const row = result.rows[0];

  if (row.ticket_status === "used") {
    jsonOk(res, {
      valid: false,
      status: "used",
      message: "این بلیت قبلاً استفاده شده است.",
      ticket: row,
    });
    return;
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

  jsonOk(res, {
    valid: true,
    status: "valid",
    message: "بلیت معتبر است و ثبت شد.",
    ticket: row,
  });
}));

export default router;
