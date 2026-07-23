import crypto from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";
import type { DB, Role, User } from "../lib/store";
import { createSeedState } from "./seed";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
const filePath = resolve(process.env.DATA_FILE ?? ".data/ticketing-dev.json");

type StoredUser = User & { passwordHash: string };
type StoredSession = { tokenHash: string; userId: string; expiresAt: string; createdAt: string };
type FileDatabase = { users: StoredUser[]; sessions: StoredSession[]; state: Omit<DB, "users"> };

let fileQueue: Promise<void> = Promise.resolve();

export async function initializeDatabase() {
  if (pool) {
    const schema = await readFile(resolve(process.cwd(), "database/schema.sql"), "utf8");
    await pool.query(schema);
    const { rows } = await pool.query<{ count: string }>("SELECT count(*) FROM users");
    if (Number(rows[0].count) === 0) await resetDatabase();
    return;
  }
  await withFileDatabase(async database => database, true);
  console.log(`Using development file database: ${filePath}`);
}

export async function healthCheck() {
  if (pool) await pool.query("SELECT 1");
  else await readFile(filePath, "utf8");
}

export async function resetDatabase() {
  const passwordHash = await bcrypt.hash("password123", 12);
  const demos: Array<[string, string, Role]> = [
    ["admin@example.com", "مدیر سیستم", "admin"],
    ["manager@example.com", "مدیر سینما", "manager"],
    ["staff@example.com", "کارمند گیشه", "staff"],
    ["customer@example.com", "کاربر نمونه", "customer"],
  ];
  if (!pool) {
    const createdAt = new Date().toISOString();
    await saveFile({
      users: demos.map(([email, name, role]) => ({ id: crypto.randomUUID(), email, name, role, createdAt, passwordHash })),
      sessions: [],
      state: createSeedState(),
    });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM sessions");
    await client.query("DELETE FROM users");
    for (const [email, name, role] of demos) {
      await client.query(
        "INSERT INTO users(id,email,password_hash,name,role) VALUES($1,$2,$3,$4,$5)",
        [crypto.randomUUID(), email, passwordHash, name, role],
      );
    }
    await client.query(
      "INSERT INTO platform_state(id,data,updated_at) VALUES(1,$1,now()) ON CONFLICT(id) DO UPDATE SET data=$1,updated_at=now()",
      [createSeedState()],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function resetBusinessState() {
  if (pool) {
    await pool.query("UPDATE platform_state SET data=$1,updated_at=now() WHERE id=1", [createSeedState()]);
    return;
  }
  await withFileDatabase(database => { database.state = createSeedState(); });
}

export async function listUsers(): Promise<User[]> {
  if (pool) {
    const { rows } = await pool.query<User>(
      'SELECT id,email,name,role,created_at AS "createdAt" FROM users ORDER BY created_at',
    );
    return rows;
  }
  return withFileDatabase(database => database.users.map(withoutPassword));
}

export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  if (pool) {
    const { rows } = await pool.query<StoredUser>(
      'SELECT id,email,name,role,created_at AS "createdAt",password_hash AS "passwordHash" FROM users WHERE email=$1',
      [email],
    );
    return rows[0];
  }
  return withFileDatabase(database => database.users.find(user => user.email === email));
}

export async function createUser(user: User, passwordHash: string) {
  if (pool) {
    await pool.query(
      "INSERT INTO users(id,email,password_hash,name,role,created_at) VALUES($1,$2,$3,$4,$5,$6)",
      [user.id, user.email, passwordHash, user.name, user.role, user.createdAt],
    );
    return;
  }
  await withFileDatabase(database => {
    if (database.users.some(item => item.email === user.email)) {
      throw Object.assign(new Error("Duplicate email"), { code: "23505" });
    }
    database.users.push({ ...user, passwordHash });
  });
}

export async function findSessionUser(tokenHash: string): Promise<User | undefined> {
  if (pool) {
    const { rows } = await pool.query<User>(
      `SELECT u.id,u.email,u.name,u.role,u.created_at AS "createdAt"
       FROM sessions s JOIN users u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.expires_at>now()`,
      [tokenHash],
    );
    return rows[0];
  }
  return withFileDatabase(database => {
    const session = database.sessions.find(item => item.tokenHash === tokenHash && new Date(item.expiresAt).getTime() > Date.now());
    const user = session && database.users.find(item => item.id === session.userId);
    return user ? withoutPassword(user) : undefined;
  });
}

export async function createSessionRecord(tokenHash: string, userId: string, expiresAt: string) {
  if (pool) {
    await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)", [tokenHash, userId, expiresAt]);
    return;
  }
  await withFileDatabase(database => {
    database.sessions.push({ tokenHash, userId, expiresAt, createdAt: new Date().toISOString() });
  });
}

export async function deleteSession(tokenHash: string) {
  if (pool) await pool.query("DELETE FROM sessions WHERE token_hash=$1", [tokenHash]);
  else await withFileDatabase(database => { database.sessions = database.sessions.filter(item => item.tokenHash !== tokenHash); });
}

export async function updateUserRole(id: string, role: Role) {
  if (pool) await pool.query("UPDATE users SET role=$1 WHERE id=$2", [role, id]);
  else await withFileDatabase(database => { const user = database.users.find(item => item.id === id); if (user) user.role = role; });
}

export async function deleteUser(id: string) {
  if (pool) await pool.query("DELETE FROM users WHERE id=$1", [id]);
  else await withFileDatabase(database => {
    database.users = database.users.filter(item => item.id !== id);
    database.sessions = database.sessions.filter(item => item.userId !== id);
  });
}

export async function readState(): Promise<Omit<DB, "users">> {
  if (pool) {
    const { rows } = await pool.query<{ data: Omit<DB, "users"> }>("SELECT data FROM platform_state WHERE id=1");
    return rows[0].data;
  }
  return withFileDatabase(database => structuredClone(database.state));
}

export async function updateState<T>(updater: (state: Omit<DB, "users">) => T | Promise<T>): Promise<T> {
  if (!pool) return withFileDatabase(database => updater(database.state));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ data: Omit<DB, "users"> }>(
      "SELECT data FROM platform_state WHERE id=1 FOR UPDATE",
    );
    const state = rows[0].data;
    const result = await updater(state);
    await client.query("UPDATE platform_state SET data=$1,updated_at=now() WHERE id=1", [state]);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function withFileDatabase<T>(operation: (database: FileDatabase) => T | Promise<T>, create = false): Promise<T> {
  const previous = fileQueue;
  let release!: () => void;
  fileQueue = new Promise(resolveQueue => { release = resolveQueue; });
  await previous;
  try {
    let database: FileDatabase;
    try {
      database = JSON.parse(await readFile(filePath, "utf8")) as FileDatabase;
    } catch (error) {
      if (!create || (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await resetDatabase();
      database = JSON.parse(await readFile(filePath, "utf8")) as FileDatabase;
    }
    const result = await operation(database);
    await saveFile(database);
    return result;
  } finally {
    release();
  }
}

async function saveFile(database: FileDatabase) {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(database, null, 2), "utf8");
  await rename(temporaryPath, filePath);
}

function withoutPassword({ passwordHash: _passwordHash, ...user }: StoredUser): User {
  return user;
}
