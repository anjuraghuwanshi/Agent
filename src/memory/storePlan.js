import fs from "fs";
import path from "path";

const MEMORY_PATH = path.resolve("src/memory/todo.json");

export function storePlan(plan) {
  let data = [];

  try {
    if (fs.existsSync(MEMORY_PATH)) {
      const content = fs.readFileSync(MEMORY_PATH, "utf-8").trim();

      // If file has valid content, parse it
      if (content.length > 0) {
        data = JSON.parse(content);
      }
    }
  } catch (err) {
    console.warn(
      "Warning: todo.json is empty or malformed. Resetting file."
    );
    data = [];
  }

  // Push the new plan
  data.push({
    ...plan,
    storedAt: new Date().toISOString(),
  });

  // Write back to file
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(data, null, 2));
}
