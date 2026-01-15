import fs from "fs";

export async function applyPatch({ path, anchor, replacement }) {
  let content = "";
  try {
    content = fs.readFileSync(path, "utf-8");
  } catch {
    throw new Error(`File not found: ${path}`);
  }

  if (typeof replacement !== "string") {
    throw new Error("applyPatch requires replacement string");
  }

  // ✅ SAFE overwrite only if file is empty
  if (!anchor) {
    if (content.trim().length !== 0) {
      throw new Error(
        "Refusing to overwrite non-empty file without anchor"
      );
    }

    fs.writeFileSync(path, replacement, "utf-8");
    return;
  }

  const escapedAnchor = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedAnchor, "g");

  if (!regex.test(content)) {
    throw new Error("Anchor not found in file");
  }

  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, "utf-8");
}
