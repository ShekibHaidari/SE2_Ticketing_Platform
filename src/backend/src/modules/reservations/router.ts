import { Router } from "express";

const router = Router();

router.post("/lock-seat", (_req, res) => {
  res.status(201).json({
    module: "reservations",
    message: "Seat locking placeholder.",
    nextStep: "Coordinate Redis lock TTL with reservation persistence.",
  });
});

router.get("/:reservationId", (req, res) => {
  res.json({
    module: "reservations",
    message: `Reservation details placeholder for reservation ${req.params.reservationId}.`,
  });
});

router.post("/:reservationId/cancel", (req, res) => {
  res.json({
    module: "reservations",
    message: `Cancel reservation placeholder for reservation ${req.params.reservationId}.`,
  });
});

export default router;
