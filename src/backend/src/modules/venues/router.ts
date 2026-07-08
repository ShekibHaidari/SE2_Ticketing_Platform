import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    module: "venues",
    message: "List venues placeholder.",
  });
});

router.post("/", (_req, res) => {
  res.status(201).json({
    module: "venues",
    message: "Create venue placeholder.",
  });
});

router.get("/:venueId/seat-map", (req, res) => {
  res.json({
    module: "venues",
    message: `Seat-map placeholder for venue ${req.params.venueId}.`,
  });
});

export default router;
