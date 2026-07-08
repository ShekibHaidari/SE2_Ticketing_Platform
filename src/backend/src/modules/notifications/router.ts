import { Router } from "express";

const router = Router();

router.get("/my", (_req, res) => {
  res.json({
    module: "notifications",
    message: "Notification history placeholder.",
  });
});

export default router;
