import crypto from "crypto";
import { Router } from "express";
import QRCode from "qrcode";
import { query, withTransaction } from "../../config/db";
import { publishEvent } from "../../config/rabbitmq";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";
import { paymentFailureCounter } from "../../shared/metrics";
import { cancelReservation, getReservationSeatIds, releaseSeatLocks } from "../reservations/service";

const router = Router();

type ExistingPaymentRow = {
  id: number;
  payment_status: string;
  provider_reference: string;
};

type PaymentTicketRow = {
  id: number;
  ticket_number: string;
  qr_hash: string;
  qr_code_data_url: string;
};

type CreatedTicketRow = {
  id: number;
  ticket_number: string;
  qr_hash: string;
  qr_code_data_url: string;
};

router.post("/checkout", asyncHandler(async (req, res) => {
  const { reservationId, paymentProvider = "mock-gateway" } = req.body as {
    reservationId?: number;
    paymentProvider?: string;
  };

  if (!reservationId) {
    throw new AppError(400, "reservationId is required.");
  }

  const result = await withTransaction(async (client) => {
    const reservationResult = await client.query<{
      id: number;
      reservation_status: string;
      total_amount: string;
    }>(
      `
        SELECT id, reservation_status, total_amount
        FROM reservations
        WHERE id = $1
      `,
      [reservationId],
    );

    if (!reservationResult.rowCount) {
      throw new AppError(404, "Reservation not found.");
    }

    const reservation = reservationResult.rows[0];

    if (!["locked", "checkout_in_progress"].includes(reservation.reservation_status)) {
      throw new AppError(409, "Reservation is not ready for checkout.");
    }

    await client.query(
      `
        UPDATE reservations
        SET reservation_status = 'checkout_in_progress',
            updated_at = NOW()
        WHERE id = $1
      `,
      [reservationId],
    );

    const existingPayment = await client.query<ExistingPaymentRow>(
      `
        SELECT id, payment_status, provider_reference
        FROM payments
        WHERE reservation_id = $1
      `,
      [reservationId],
    );

    if (existingPayment.rowCount) {
      return {
        paymentId: existingPayment.rows[0].id,
        paymentStatus: existingPayment.rows[0].payment_status,
        providerReference: existingPayment.rows[0].provider_reference,
        amount: Number(reservation.total_amount),
      };
    }

    const providerReference = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const paymentResult = await client.query<{ id: number }>(
      `
        INSERT INTO payments (
          reservation_id,
          payment_provider,
          provider_reference,
          payment_status,
          amount,
          currency
        )
        VALUES ($1, $2, $3, 'pending', $4, 'USD')
        RETURNING id
      `,
      [reservationId, paymentProvider, providerReference, Number(reservation.total_amount)],
    );

    return {
      paymentId: paymentResult.rows[0].id,
      paymentStatus: "pending",
      providerReference,
      amount: Number(reservation.total_amount),
    };
  });

  jsonOk(res, {
    message: "Mock checkout created. Use the mock success or mock fail endpoints to finish the flow.",
    ...result,
    nextActions: {
      successUrl: `/api/payments/mock-success/${result.paymentId}`,
      failUrl: `/api/payments/mock-fail/${result.paymentId}`,
    },
  }, 201);
}));

router.post("/payments/mock-success/:paymentId", asyncHandler(async (req, res) => {
  const paymentId = Number(req.params.paymentId);

  const result = await withTransaction(async (client) => {
    const paymentResult = await client.query<{
      id: number;
      reservation_id: number;
      payment_status: string;
      amount: string;
    }>(
      `
        SELECT id, reservation_id, payment_status, amount
        FROM payments
        WHERE id = $1
      `,
      [paymentId],
    );

    if (!paymentResult.rowCount) {
      throw new AppError(404, "Payment not found.");
    }

    const payment = paymentResult.rows[0];

    if (payment.payment_status === "success") {
      const tickets = await client.query<PaymentTicketRow>(
        `
          SELECT id, ticket_number, qr_hash, qr_code_data_url
          FROM tickets
          WHERE payment_id = $1
          ORDER BY id ASC
        `,
        [paymentId],
      );

      const reservationDetails = await client.query<{
        event_id: number;
        user_id: number;
      }>(
        `
          SELECT event_id, user_id
          FROM reservations
          WHERE id = $1
        `,
        [payment.reservation_id],
      );

      const seatRows = await getReservationSeatIds(client, payment.reservation_id);

      return {
        paymentId,
        reservationId: payment.reservation_id,
        eventId: reservationDetails.rows[0].event_id,
        userId: reservationDetails.rows[0].user_id,
        seatIds: seatRows.map((seat) => seat.seat_id),
        tickets: tickets.rows,
      };
    }

    const reservationResult = await client.query<{
      id: number;
      event_id: number;
      user_id: number;
      reservation_status: string;
    }>(
      `
        SELECT id, event_id, user_id, reservation_status
        FROM reservations
        WHERE id = $1
      `,
      [payment.reservation_id],
    );

    if (!reservationResult.rowCount) {
      throw new AppError(404, "Reservation not found for payment.");
    }

    const reservation = reservationResult.rows[0];

    const seatRows = await getReservationSeatIds(client, reservation.id);

    await client.query(
      `
        UPDATE payments
        SET payment_status = 'success',
            callback_received_at = NOW(),
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `,
      [paymentId],
    );

    await client.query(
      `
        UPDATE reservations
        SET reservation_status = 'confirmed',
            updated_at = NOW()
        WHERE id = $1
      `,
      [reservation.id],
    );

    const createdTickets: CreatedTicketRow[] = [];

    for (const seat of seatRows) {
      const ticketCode = `TKT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const qrHash = crypto.createHash("sha256").update(`${reservation.id}:${seat.seat_id}:${ticketCode}`).digest("hex");
      const qrCodeDataUrl = await QRCode.toDataURL(qrHash);

      const ticketResult = await client.query<CreatedTicketRow>(
        `
          INSERT INTO tickets (
            event_id,
            reservation_id,
            seat_id,
            payment_id,
            ticket_number,
            qr_hash,
            qr_code_data_url,
            ticket_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
          ON CONFLICT (event_id, seat_id) DO NOTHING
          RETURNING id, ticket_number, qr_hash, qr_code_data_url
        `,
        [reservation.event_id, reservation.id, seat.seat_id, paymentId, ticketCode, qrHash, qrCodeDataUrl],
      );

      if (!ticketResult.rowCount) {
        throw new AppError(409, "A ticket already exists for one of the selected seats.");
      }

      createdTickets.push(ticketResult.rows[0]);
    }

    const firstTicketId = Number(createdTickets[0].id);

    await client.query(
      `
        INSERT INTO notifications (
          user_id,
          reservation_id,
          ticket_id,
          channel,
          template_key,
          delivery_status,
          payload,
          sent_at
        )
        VALUES ($1, $2, $3, 'email', 'ticket_issued', 'sent', $4::jsonb, NOW())
      `,
      [
        reservation.user_id,
        reservation.id,
        firstTicketId,
        JSON.stringify({
          message: "Your booking has been confirmed and tickets were generated.",
          paymentId,
          ticketCount: createdTickets.length,
        }),
      ],
    );

    return {
      paymentId,
      reservationId: reservation.id,
      eventId: reservation.event_id,
      userId: reservation.user_id,
      tickets: createdTickets,
      seatIds: seatRows.map((seat: { event_id: number; seat_id: number }) => seat.seat_id),
    };
  });

  await releaseSeatLocks(result.eventId, result.seatIds);
  await publishEvent("PaymentSucceeded", {
    paymentId: result.paymentId,
    reservationId: result.reservationId,
  });
  await publishEvent("TicketIssued", {
    paymentId: result.paymentId,
    reservationId: result.reservationId,
    ticketCount: result.tickets.length,
  });
  await publishEvent("NotificationCreated", {
    reservationId: result.reservationId,
    userId: result.userId,
  });

  jsonOk(res, {
    message: "Mock payment marked as successful. Reservation confirmed and tickets generated.",
    paymentId: result.paymentId,
    reservationId: result.reservationId,
    tickets: result.tickets,
  });
}));

router.post("/payments/mock-fail/:paymentId", asyncHandler(async (req, res) => {
  const paymentId = Number(req.params.paymentId);

  const paymentResult = await query<{
    id: number;
    reservation_id: number;
    payment_status: string;
  }>(
    `
      SELECT id, reservation_id, payment_status
      FROM payments
      WHERE id = $1
    `,
    [paymentId],
  );

  if (!paymentResult.rowCount) {
    throw new AppError(404, "Payment not found.");
  }

  const payment = paymentResult.rows[0];

  if (payment.payment_status === "success") {
    throw new AppError(409, "Successful payments cannot be changed to failed.");
  }

  await query(
    `
      UPDATE payments
      SET payment_status = 'failed',
          callback_received_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `,
    [paymentId],
  );

  const cancelled = await cancelReservation(payment.reservation_id, "failed");
  paymentFailureCounter.inc();
  await publishEvent("PaymentFailed", {
    paymentId,
    reservationId: payment.reservation_id,
  });

  jsonOk(res, {
    message: "Mock payment marked as failed. Reservation cancelled and seat locks released.",
    paymentId,
    reservationId: payment.reservation_id,
    eventId: cancelled.reservation.event_id,
  });
}));

router.get("/payments/:paymentId", asyncHandler(async (req, res) => {
  const paymentId = Number(req.params.paymentId);
  const result = await query(
    `
      SELECT
        id,
        reservation_id,
        payment_provider,
        provider_reference,
        payment_status,
        amount,
        currency,
        callback_received_at,
        paid_at
      FROM payments
      WHERE id = $1
    `,
    [paymentId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "Payment not found.");
  }

  const row = result.rows[0];
  jsonOk(res, {
    id: row.id,
    reservationId: row.reservation_id,
    paymentProvider: row.payment_provider,
    providerReference: row.provider_reference,
    paymentStatus: row.payment_status,
    amount: Number(row.amount),
    currency: row.currency,
    callbackReceivedAt: row.callback_received_at,
    paidAt: row.paid_at,
  });
}));

export default router;
