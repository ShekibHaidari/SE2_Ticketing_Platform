import { Router } from "express";

const router = Router();

router.get("/my", (_req, res) => {
  res.json({
    module: "tickets",
    message: "My tickets placeholder.",
  });
});

router.get("/:ticketId", (req, res) => {
  res.json({
    module: "tickets",
    message: `Ticket details placeholder for ticket ${req.params.ticketId}.`,
  });
});

router.post("/:ticketId/validate", (req, res) => {
  res.json({
    module: "tickets",
    message: `Validate ticket placeholder for ticket ${req.params.ticketId}.`,
  });
});

export default router;
