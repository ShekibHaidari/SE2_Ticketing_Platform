import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { jsonOk } from "../../shared/http";

const router = Router();

type NotificationRow = {
  id: number;
  reservation_id: number | null;
  ticket_id: number | null;
  channel: string;
  template_key: string;
  delivery_status: string;
  payload: Record<string, unknown>;
  sent_at: string | null;
  created_at: string;
};

router.get("/my/:userId", asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  const result = await query<NotificationRow>(
    `
      SELECT
        id,
        reservation_id,
        ticket_id,
        channel,
        template_key,
        delivery_status,
        payload,
        sent_at,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  jsonOk(res, result.rows.map((row: NotificationRow) => ({
    id: row.id,
    reservationId: row.reservation_id,
    ticketId: row.ticket_id,
    channel: row.channel,
    templateKey: row.template_key,
    deliveryStatus: row.delivery_status,
    payload: row.payload,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  })));
}));

export default router;
