import { Router } from "express";
import { query } from "../../config/db";
import { asyncHandler } from "../../shared/asyncHandler";
import { hashPassword, verifyPassword } from "../../shared/auth";
import { AppError } from "../../shared/errors";
import { jsonOk, requireAuth, signToken } from "../../shared/http";
import { toAuthUser } from "../../shared/roles";
import type { AuthenticatedRequest, UserRow } from "../../shared/types";

const router = Router();

router.post("/register", asyncHandler(async (req, res) => {
  const { fullName, email, password, phoneNumber } = req.body as Record<string, unknown>;

  if (!fullName || !email || !password) {
    throw new AppError(400, "نام، ایمیل و رمز عبور الزامی است.");
  }

  const existing = await query<{ id: number }>(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rowCount) {
    throw new AppError(409, "کاربری با این ایمیل قبلاً ثبت شده است.");
  }

  const passwordHash = await hashPassword(String(password));
  const result = await query<UserRow>(
    `
      INSERT INTO users (full_name, email, phone_number, password_hash, role)
      VALUES ($1, $2, $3, $4, 'customer')
      RETURNING id, full_name, email, phone_number, password_hash, role, account_status
    `,
    [String(fullName), String(email), phoneNumber ? String(phoneNumber) : null, passwordHash],
  );

  const user = result.rows[0];
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  jsonOk(res, {
    ok: true,
    data: {
      user: toAuthUser(user),
      token,
    },
  }, 201);
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body as Record<string, unknown>;

  if (!email || !password) {
    throw new AppError(400, "ایمیل و رمز عبور الزامی است.");
  }

  const result = await query<UserRow>(
    `
      SELECT id, full_name, email, phone_number, password_hash, role, account_status
      FROM users
      WHERE email = $1
    `,
    [String(email)],
  );

  if (!result.rowCount || !(await verifyPassword(String(password), result.rows[0].password_hash))) {
    throw new AppError(401, "ایمیل یا رمز عبور نادرست است.");
  }

  const user = result.rows[0];
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  jsonOk(res, {
    ok: true,
    data: {
      user: toAuthUser(user),
      token,
    },
  });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const userId = (req as AuthenticatedRequest).authUser?.userId;
  const result = await query<UserRow>(
    `
      SELECT id, full_name, email, phone_number, password_hash, role, account_status
      FROM users
      WHERE id = $1
    `,
    [userId],
  );

  if (!result.rowCount) {
    throw new AppError(404, "کاربر پیدا نشد.");
  }

  const user = result.rows[0];
  jsonOk(res, {
    ok: true,
    data: toAuthUser(user),
  });
}));

export default router;
