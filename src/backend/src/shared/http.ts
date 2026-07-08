import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./errors";
import type { AuthPayload, AuthenticatedRequest } from "./types";

export function jsonOk(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json(data);
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: "8h",
  });
}

export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing or invalid Authorization header."));
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.authUser = payload;
    return next();
  } catch (error) {
    return next(new AppError(401, "Invalid or expired token."));
  }
}
