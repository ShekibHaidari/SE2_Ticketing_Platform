import type { Request } from "express";

export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
};

export type AuthPayload = {
  userId: number;
  email: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  authUser?: AuthPayload;
};

export type UserRow = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  password_hash: string;
  role: string;
  account_status: string;
};
