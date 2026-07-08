import { Router } from "express";

const router = Router();

router.post("/join", (_req, res) => {
  res.status(202).json({
    module: "waiting-room",
    message: "Join waiting-room placeholder.",
    nextStep: "Integrate Redis queue position and admission token logic.",
  });
});

router.get("/status", (_req, res) => {
  res.json({
    module: "waiting-room",
    message: "Waiting-room status placeholder.",
  });
});

export default router;
