import fs from "fs";
import path from "path";
import { PROJECT_ROOT } from "../config/constants.js";

export function createFile({ path: filePath }) {
  if (typeof filePath !== "string") {
    throw new Error("createFile expects { path: string }");
  }

  const resolvedPath = path.resolve(PROJECT_ROOT, filePath);

  if (!resolvedPath.startsWith(PROJECT_ROOT)) {
    throw new Error("Access denied");
  }

  if (!fs.existsSync(resolvedPath)) {
    fs.writeFileSync(resolvedPath, "", "utf-8");
  }

  return `Created ${filePath}`;
}
