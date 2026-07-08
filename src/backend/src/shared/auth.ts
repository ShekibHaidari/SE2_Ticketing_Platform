import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, storedHash: string) {
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(password, storedHash);
  }

  if (storedHash.startsWith("sha256:")) {
    const digest = `sha256:${crypto.createHash("sha256").update(password).digest("hex")}`;
    return digest === storedHash;
  }

  return storedHash === password;
}
