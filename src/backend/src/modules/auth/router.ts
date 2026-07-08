import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import { query } from "../../config/db";
import { AppError } from "../../shared/errors";
import { hashPassword, verifyPassword } from "../../shared/auth";
import { jsonOk, requireAuth, signToken } from "../../shared/http";
import type { AuthenticatedRequest, UserRow } from "../../shared/types";

const router = Router();

router.post("/register", asyncHandler(async (req, res) => {
  const { fullName, email, password, phoneNumber } = req.body;

  if (!fullName || !email || !password) {
    throw new AppError(400, "fullName, email, and password are required.");
  }

  const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);

  if (existing.rowCount) {
    throw new AppError(409, "A user with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const result = await query<UserRow>(
    `
      INSERT INTO users (full_name, email, phone_number, password_hash, role)
      VALUES ($1, $2, $3, $4, 'customer')
      RETURNING id, full_name, email, phone_number, password_hash, role, account_status
    `,
    [fullName, email, phoneNumber ?? null, passwordHash],
  );

  const user = result.rows[0];
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  jsonOk(res, {
    accessToken: token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
  }, 201);
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, "email and password are required.");
  }

  const result = await query<UserRow>(
    `
      SELECT id, full_name, email, phone_number, password_hash, role, account_status
      FROM users
      WHERE email = $1
    `,
    [email],
  );

  if (!result.rowCount) {
    throw new AppError(401, "Invalid email or password.");
  }

  const user = result.rows[0];
  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    throw new AppError(401, "Invalid email or password.");
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  jsonOk(res, {
    accessToken: token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
  });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.authUser?.userId;

  const result = await query<UserRow>(
    `
      SELECT id, full_name, email, phone_number, password_hash, role, account_status
      FROM users
      WHERE id = $1
    `,
    [userId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "User not found.");
  }

  const user = result.rows[0];
  jsonOk(res, {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phoneNumber: user.phone_number,
    role: user.role,
    accountStatus: user.account_status,
  });
}));

export default router;
