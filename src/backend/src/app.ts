import express from "express";
import authRouter from "./modules/auth/router";
import eventsRouter from "./modules/events/router";
import venuesRouter from "./modules/venues/router";
import waitingRoomRouter from "./modules/waiting-room/router";
import reservationsRouter from "./modules/reservations/router";
import paymentsRouter from "./modules/payments/router";
import ticketsRouter from "./modules/tickets/router";
import notificationsRouter from "./modules/notifications/router";
import adminRouter from "./modules/admin/router";
import type { HealthResponse } from "./shared/types";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    const payload: HealthResponse = {
      status: "ok",
      service: "se2-ticketing-platform-backend",
      timestamp: new Date().toISOString(),
    };

    res.json(payload);
  });

  app.use("/api/auth", authRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/venues", venuesRouter);
  app.use("/api/waiting-room", waitingRoomRouter);
  app.use("/api/reservations", reservationsRouter);
  app.use("/api", paymentsRouter);
  app.use("/api/tickets", ticketsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/admin", adminRouter);

  return app;
}
