import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    module: "events",
    message: "List events placeholder with future support for search and filters.",
  });
});

router.get("/:eventId", (req, res) => {
  res.json({
    module: "events",
    message: `Event details placeholder for event ${req.params.eventId}.`,
  });
});

router.post("/", (_req, res) => {
  res.status(201).json({
    module: "events",
    message: "Create event placeholder.",
  });
});

router.put("/:eventId", (req, res) => {
  res.json({
    module: "events",
    message: `Update event placeholder for event ${req.params.eventId}.`,
  });
});

router.post("/:eventId/publish", (req, res) => {
  res.json({
    module: "events",
    message: `Publish event placeholder for event ${req.params.eventId}.`,
  });
});

export default router;
