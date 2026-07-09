import cors from "cors";
import express from "express";
import authRouter from "./modules/auth/router";
import moviesRouter from "./modules/movies/router";
import cinemasRouter from "./modules/cinemas/router";
import showtimesRouter from "./modules/showtimes/router";
import eventsRouter from "./modules/events/router";
import venuesRouter from "./modules/venues/router";
import waitingRoomRouter from "./modules/waiting-room/router";
import reservationsRouter from "./modules/reservations/router";
import paymentsRouter from "./modules/payments/router";
import ticketsRouter from "./modules/tickets/router";
import notificationsRouter from "./modules/notifications/router";
import adminRouter from "./modules/admin/router";
import managerRouter from "./modules/manager/router";
import staffRouter from "./modules/staff/router";
import { AppError } from "./shared/errors";
import type { HealthResponse } from "./shared/types";
import { httpRequestCounter, registry } from "./shared/metrics";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    res.on("finish", () => {
      httpRequestCounter.inc({
        method: req.method,
        route: req.path,
        status_code: res.statusCode,
      });
    });
    next();
  });

  app.get("/health", (_req, res) => {
    const payload: HealthResponse = {
      status: "ok",
      service: "cinema-ticketing-platform-backend",
      timestamp: new Date().toISOString(),
    };
    res.json(payload);
  });

  app.get("/metrics", async (_req, res) => {
    res.setHeader("Content-Type", registry.contentType);
    res.end(await registry.metrics());
  });

  app.use("/api/auth", authRouter);
  app.use("/api/movies", moviesRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/cinemas", cinemasRouter);
  app.use("/api/venues", venuesRouter);
  app.use("/api/showtimes", showtimesRouter);
  app.use("/api/waiting-room", waitingRoomRouter);
  app.use("/api/reservations", reservationsRouter);
  app.use("/api", paymentsRouter);
  app.use("/api/tickets", ticketsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/manager", managerRouter);
  app.use("/api/staff", staffRouter);
  app.use("/api/admin", adminRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "خطای داخلی سرور رخ داده است." });
  });

  return app;
}
