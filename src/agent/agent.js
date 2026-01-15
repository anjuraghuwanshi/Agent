import os from "os";
import { callGemini } from "../llm/gemini.js";
import { systemPrompt } from "../config/prompt.js";
import { tools } from "../tools/index.js";
import { storePlan } from "../memory/storePlan.js";

/* ---------------- OS DETECTION (NEW) ---------------- */

function getOSType() {
  const platform = os.platform();
  if (platform === "win32") return "windows";
  if (platform === "darwin") return "mac";
  if (platform === "linux") return "linux";
  return "unknown";
}

/* ---------------- SAFE JSON PARSER (UNCHANGED) ---------------- */

function safeParseJSON(raw) {
  if (raw && typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const text = match[0];

  try {
    return JSON.parse(text);
  } catch {}

  try {
    const normalized = text
      .replace(/([{,]\s*)([a-zA-Z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"');
    return JSON.parse(normalized);
  } catch {}

  try {
    return Function(`"use strict"; return (${text});`)();
  } catch {
    return null;
  }
}

/* ---------------- STRATEGY DECIDER (UNCHANGED) ---------------- */

function mentionsFile(input) {
  return /\b[\w-]+\.(js|ts|py|json|html|css)\b/i.test(input);
}

/* ---------------- EXECUTION HELPER (UPDATED SAFELY) ---------------- */

async function executePlan(plan, userInput, inspectedFiles = {}) {
  if (!plan || !Array.isArray(plan.todos)) {
    return {
      answer: "Sorry, I couldn’t understand the request. Please try again.",
    };
  }

  // Store plan (unchanged behavior)
  try {
    storePlan({
      goal: userInput,
      todos: plan.todos,
      finalMessage:
        typeof plan.finalMessage === "string" ? plan.finalMessage : "Done",
    });
  } catch {}

  for (const todo of plan.todos) {
    if (!todo || typeof todo !== "object") continue;
    if (typeof todo.type !== "string") continue;
    if (!Object.hasOwn(tools, todo.type)) continue;
    if (todo.type === "finish") continue;

    /* -------- FILE TOOL VALIDATION -------- */
    if (
      ["readFile", "createFile", "createFolder", "applyPatch"].includes(
        todo.type
      )
    ) {
      if (typeof todo.path !== "string") continue;
    }

    /* -------- COMMAND TOOL VALIDATION (NEW) -------- */
    if (todo.type === "runCommand") {
      if (typeof todo.command !== "string") continue;
      if (typeof todo.reason !== "string") continue;
    }

    /* -------- APPLY PATCH SAFETY -------- */
    if (todo.type === "applyPatch") {
      if (
        typeof todo.anchor !== "string" ||
        typeof todo.replacement !== "string"
      ) {
        continue;
      }

      const content = inspectedFiles[todo.path];
      if (content && !content.includes(todo.anchor)) {
        console.warn("Invalid anchor skipped:", todo.anchor);
        continue;
      }
    }

    try {
      await tools[todo.type](todo);
    } catch (err) {
      console.warn(
        `Tool failed (${todo.type}):`,
        err?.message || err
      );
    }
  }

  return {
    answer:
      typeof plan.finalMessage === "string"
        ? plan.finalMessage
        : "Completed.",
  };
}

/* ---------------- MAIN AGENT ---------------- */

export async function runAgent(userInput) {
  const osType = getOSType(); // ✅ OS context
  const needsInspect = mentionsFile(userInput);

  /* ----------- SINGLE SHOT (NO FILE CONTEXT) ----------- */
  if (!needsInspect) {
    const prompt = `
${systemPrompt}

ENVIRONMENT:
- Operating System: ${osType}

MODE: SINGLE_SHOT

USER TASK:
${userInput}
`;

    const raw = await callGemini(prompt);
    const plan = safeParseJSON(raw);
    return await executePlan(plan, userInput);
  }

  /* ----------- CALL 1: INSPECTION ----------- */
  const inspectPrompt = `
${systemPrompt}

ENVIRONMENT:
- Operating System: ${osType}

MODE: INSPECTION
RULES:
- ONLY use readFile or finish
- DO NOT applyPatch
- DO NOT runCommand

USER TASK:
${userInput}
`;

  const inspectRaw = await callGemini(inspectPrompt);
  const inspectPlan = safeParseJSON(inspectRaw);

  const inspectedFiles = {};

  if (inspectPlan?.todos) {
    for (const todo of inspectPlan.todos) {
      if (todo.type === "readFile" && typeof todo.path === "string") {
        try {
          inspectedFiles[todo.path] = await tools.readFile(todo);
        } catch {}
      }
    }
  }

  /* ----------- CALL 2: FIX WITH REAL CONTEXT ----------- */
  let context = "";
  for (const [path, content] of Object.entries(inspectedFiles)) {
    context += `
FILE: ${path}
<<<
${content}
>>>
`;
  }

  const fixPrompt = `
${systemPrompt}

ENVIRONMENT:
- Operating System: ${osType}

MODE: FIX
REAL FILE CONTENT:
${context}

RULES:
- anchor MUST exist in content above
- DO NOT invent code
- runCommand ONLY if necessary
- Commands MUST be valid for ${osType}

USER TASK:
${userInput}
`;

  const fixRaw = await callGemini(fixPrompt);
  const fixPlan = safeParseJSON(fixRaw);

  return await executePlan(fixPlan, userInput, inspectedFiles);
}
