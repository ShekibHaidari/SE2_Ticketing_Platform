import { Router } from "express";

const router = Router();

router.get("/action-logs", (_req, res) => {
  res.json({
    module: "admin",
    message: "Admin action log placeholder.",
  });
});

export default router;
