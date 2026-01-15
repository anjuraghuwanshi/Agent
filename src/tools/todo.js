import fs from "fs";
import path from "path";

const TODO_PATH = path.resolve("src/memory/todo.json");

function readFile() {
  if (!fs.existsSync(TODO_PATH)) {
    return { tasks: [] };
  }
  return JSON.parse(fs.readFileSync(TODO_PATH, "utf-8"));
}

function writeFile(data) {
  fs.writeFileSync(TODO_PATH, JSON.stringify(data, null, 2));
}

export function createTodo(tasks) {
  
  if (!Array.isArray(tasks)) {
    throw new Error("createTodo expects an array");
  }

  const formatted = tasks.map((task, index) => ({
    id: index + 1,
    task: String(task),
    done: false,
  }));

  writeFile({ tasks: formatted });
  return "Todo list created";
}

export function readTodo() {
  return readFile().tasks.filter(t => !t.done);
}

export function markDone(id) {
  const data = readFile();
  const task = data.tasks.find(t => t.id === id);
  if (task) task.done = true;
  writeFile(data);
  return `Task ${id} done`;
}
