import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";
import type { DB, Role, User } from "../lib/store";
import { createSeedState } from "./seed";

const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "postgresql://ticketing_user:ticketing_password@localhost:5432/ticketing_db" });

export async function initializeDatabase() {
  const schema = await readFile(resolve(process.cwd(), "database/schema.sql"), "utf8");
  await pool.query(schema);
  const { rows } = await pool.query<{ count: string }>("SELECT count(*) FROM users");
  if (Number(rows[0].count) === 0) await resetDatabase();
}

export async function resetDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM sessions");
    await client.query("DELETE FROM users");
    const passwordHash = await bcrypt.hash("password123", 12);
    const demos: Array<[string, string, Role]> = [
      ["admin@example.com", "مدیر سیستم", "admin"], ["manager@example.com", "مدیر سینما", "manager"],
      ["staff@example.com", "کارمند گیشه", "staff"], ["customer@example.com", "کاربر نمونه", "customer"],
    ];
    for (const [email, name, role] of demos) {
      await client.query("INSERT INTO users(id,email,password_hash,name,role) VALUES($1,$2,$3,$4,$5)", [crypto.randomUUID(), email, passwordHash, name, role]);
    }
    await client.query("INSERT INTO platform_state(id,data,updated_at) VALUES(1,$1,now()) ON CONFLICT(id) DO UPDATE SET data=$1,updated_at=now()", [createSeedState()]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function resetBusinessState() {
  await pool.query("UPDATE platform_state SET data=$1,updated_at=now() WHERE id=1", [createSeedState()]);
}

export async function listUsers(): Promise<User[]> {
  const { rows } = await pool.query("SELECT id,email,name,role,created_at AS \"createdAt\" FROM users ORDER BY created_at");
  return rows;
}

export async function readState(): Promise<Omit<DB, "users">> {
  const { rows } = await pool.query<{ data: Omit<DB, "users"> }>("SELECT data FROM platform_state WHERE id=1");
  return rows[0].data;
}

export async function updateState<T>(updater: (state: Omit<DB, "users">) => T | Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ data: Omit<DB, "users"> }>("SELECT data FROM platform_state WHERE id=1 FOR UPDATE");
    const state = rows[0].data;
    const result = await updater(state);
    await client.query("UPDATE platform_state SET data=$1,updated_at=now() WHERE id=1", [state]);
    await client.query("COMMIT");
    return result;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
