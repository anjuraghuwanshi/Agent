import fs from "fs";
import path from "path";
import { PROJECT_ROOT } from "../config/constants.js";

export function createFolder({ path: folderPath }) {
  if (typeof folderPath !== "string") {
    throw new Error("createFolder expects { path: string }");
  }

  const resolvedPath = path.resolve(PROJECT_ROOT, folderPath);

  if (!resolvedPath.startsWith(PROJECT_ROOT)) {
    throw new Error("Access denied");
  }

  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
  }

  return `Created ${folderPath}`;
}
