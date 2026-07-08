import fs from "fs";
import path from "path";
import { AppError } from "./errors";

export function resolveProjectFile(...segments: string[]) {
  const relativePath = path.join(...segments);
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(process.cwd(), "..", relativePath),
    path.resolve(process.cwd(), "..", "..", relativePath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new AppError(500, `Could not find required file: ${relativePath}`);
}
