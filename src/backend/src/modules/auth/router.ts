import { Router } from "express";

const router = Router();

router.post("/register", (_req, res) => {
  res.status(201).json({
    module: "auth",
    message: "Register endpoint placeholder.",
    nextStep: "Add validation, password hashing, and token issuance.",
  });
});

router.post("/login", (_req, res) => {
  res.json({
    module: "auth",
    message: "Login endpoint placeholder.",
    nextStep: "Add credential verification and JWT/session support.",
  });
});

router.get("/me", (_req, res) => {
  res.json({
    module: "auth",
    message: "Current user profile placeholder.",
    nextStep: "Read the authenticated user from middleware.",
  });
});

export default router;
