import { Router } from "express";

const router = Router();

router.post("/checkout", (_req, res) => {
  res.status(201).json({
    module: "payments",
    message: "Checkout placeholder.",
    nextStep: "Create payment intent and persist a pending payment row.",
  });
});

router.post("/payments/callback", (_req, res) => {
  res.status(202).json({
    module: "payments",
    message: "Payment callback placeholder.",
    nextStep: "Make callback handling idempotent and emit an issuance event.",
  });
});

router.get("/payments/:paymentId", (req, res) => {
  res.json({
    module: "payments",
    message: `Payment details placeholder for payment ${req.params.paymentId}.`,
  });
});

export default router;
