import readline from "readline";
import { runAgent } from "../agent/agent.js";

export function startCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("AI CLI started (Agent mode)");
  console.log("Structured reasoning enabled\n");

  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", async (input) => {
    try {
      const result = await runAgent(input);

      console.log("\n"+result.answer + "\n");
    } catch (err) {
      console.error("Agent Error:", err.message);
    }

    rl.prompt();
  });
}
