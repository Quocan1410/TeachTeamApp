/**
 * Restarts the API only when a source file's size or mtime changes.
 * node --watch restarts on OneDrive read events, so this polls instead.
 * A crash does not restart the process; save a file to start it again.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcDir = path.join(root, "src");
const intervalMs = 1000;

let child = null;
let fingerprint = "";
let stopping = false;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".json")) continue;
    const stat = fs.statSync(full);
    out.push(`${full}:${stat.size}:${Math.floor(stat.mtimeMs)}`);
  }
}

function currentFingerprint() {
  const files = [];
  walk(srcDir, files);
  files.sort();
  return files.join("\n");
}

function start() {
  child = spawn(process.execPath, ["-r", "ts-node/register", "src/index.ts"], {
    cwd: root,
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    child = null;
    if (stopping) return;
    console.log(
      `[dev-watch] API exited (${signal || code}). Save a file in src to start it again.`
    );
  });
}

function stopChild() {
  if (!child) return;
  child.kill("SIGTERM");
  child = null;
}

function restart(reason) {
  console.log(`[dev-watch] ${reason}`);
  stopChild();
  start();
}

function poll() {
  let next = "";
  try {
    next = currentFingerprint();
  } catch (error) {
    console.error("[dev-watch] Could not read src:", error.message);
    return;
  }
  if (next === fingerprint) return;
  const first = fingerprint === "";
  fingerprint = next;
  if (first) {
    start();
    return;
  }
  restart("Source changed, restarting API.");
}

process.on("SIGINT", () => {
  stopping = true;
  stopChild();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopping = true;
  stopChild();
  process.exit(0);
});

poll();
setInterval(poll, intervalMs);
