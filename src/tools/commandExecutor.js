import { exec } from "child_process";
import readline from "readline";
import os from "os";
import path from "path";

/* ---------- CONFIG ---------- */

const ALLOWED_BASE_COMMANDS = ["npm", "npx", "git", "node", "java"];
const BLOCKED_PATTERNS = [
  "rm ",
  "del ",
  "sudo",
  "shutdown",
  "format",
  "mv /",
  "> /",
];

/* ---------- OS DETECTION ---------- */

function detectOS() {
  const platform = os.platform();
  if (platform === "win32") return "windows";
  if (platform === "darwin") return "mac";
  if (platform === "linux") return "linux";
  return "unknown";
}

/* ---------- VALIDATION ---------- */

function validateCommand(command) {
  const base = command.trim().split(" ")[0];

  if (!ALLOWED_BASE_COMMANDS.includes(base)) {
    throw new Error(`Command '${base}' is not allowed`);
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (command.includes(pattern)) {
      throw new Error("Dangerous command blocked");
    }
  }
}

/* ---------- CONFIRMATION ---------- */

function confirmExecution(command, reason) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      `\n⚠️ Agent wants to run:\n${command}\n📌 Reason: ${reason}\nProceed? (y/n): `,
      (ans) => {
        rl.close();
        resolve(ans.toLowerCase() === "y");
      }
    );
  });
}

/* ---------- EXECUTION ---------- */

function execCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { shell: true, cwd }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}

/* ---------- PUBLIC API ---------- */

/**
 * Executes a command safely, optionally inside a folder (cwd)
 * @param {Object} params
 * @param {string} params.command - Command to execute (e.g., npm install express)
 * @param {string} params.reason - Reason for logging / confirmation
 * @param {string} [params.cwd] - Optional folder path to execute command inside
 */
export async function executeCommand({ command, reason, cwd }) {
  // Validate command safety
  validateCommand(command);

  // Ask user for confirmation
  const approved = await confirmExecution(command, reason);
  if (!approved) throw new Error("Command execution cancelled by user");

  // Resolve cwd path
  let resolvedCwd = cwd ? path.resolve(process.cwd(), cwd) : process.cwd();

  // Detect OS (could be used for future OS-specific tweaks)
  const osType = detectOS();

  console.log(`\n▶ Running on ${osType} at ${resolvedCwd}: ${command}`);

  // Execute
  const output = await execCommand(command, resolvedCwd);

  if (output) console.log(output);
  return output;
}
