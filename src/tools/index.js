import { createFolder } from "./createFolder.js";
import { applyPatch } from "./applyPatch.js";
import { readFile } from "./readFile.js";
import { createFile } from "./createFile.js";
import { executeCommand } from "./commandExecutor.js";

export const tools = {
  createFolder,
  createFile,
  readFile,
  applyPatch,

  runCommand: executeCommand, // 👈 expose as tool

  finish: async () => {}, // no-op
};
