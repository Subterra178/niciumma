/*
 * Temporary SB3 converter.
 *
 * Usage:
 *   node tools/sb3-convert.mjs project.sb3 output.json
 *
 * This extracts the real Scratch project.json.
 * The next version will additionally build the Niciumma4 tree/function index.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const input = process.argv[2];
const output = process.argv[3] || path.join(path.dirname(input), "project.json");

if (!input) {
  console.error("Usage: node tools/sb3-convert.mjs <project.sb3> [output.json]");
  process.exit(1);
}

const temp = fs.mkdtempSync(path.join(process.cwd(), ".sb3-"));
try {
  execFileSync("unzip", ["-p", input, "project.json"], {
    stdio: ["ignore", "pipe", "inherit"],
  });

  const text = execFileSync("unzip", ["-p", input, "project.json"], {
    encoding: "utf8",
  });

  JSON.parse(text);
  fs.writeFileSync(output, text.endsWith("\n") ? text : text + "\n");
  console.log(`Extracted project.json -> ${output}`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
