/**
 * ALAYA INSIDER — FTP Deployment Script (Robust)
 * ----------------------------------------------
 * Uploads the built dist/ folder to Hostinger hosting.
 * Uses child_process spawn with stdin piping for reliable password handling.
 * 
 * Usage:
 *   FTP_HOST=145.79.58.169 FTP_USER=u131951911.alayainsider.com FTP_PASSWORD='((Giri)1923@+-)' FTP_PATH=/public_html node scripts/deploy-ftp.mjs
 */

import { readdirSync, statSync, existsSync } from "fs";
import { join, dirname, relative } from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const HOST = process.env.FTP_HOST || "145.79.58.169";
const USER = process.env.FTP_USER || "u131951911.alayainsider.com";
const PASS = process.env.FTP_PASSWORD;
const REMOTE_PATH = (process.env.FTP_PATH || "/public_html").replace(/\\/g, "/");

if (!PASS) {
  console.error("❌ Missing FTP_PASSWORD environment variable");
  process.exit(1);
}

if (!existsSync(DIST)) {
  console.error(`❌ Build not found at ${DIST}. Run 'npm run build' first.`);
  process.exit(1);
}

// Collect files to upload
const files = [];
function collect(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collect(full);
    } else {
      const rel = relative(DIST, full).replace(/\\/g, "/");
      files.push({ local: full, remote: rel });
    }
  }
}
collect(DIST);

const totalSize = files.reduce((s, f) => s + statSync(f.local).size, 0);

console.log(`\n🔨 ALAYA INSIDER — FTP Deploy`);
console.log(`   Host: ${HOST}`);
console.log(`   User: ${USER}`);
console.log(`   Path: ${REMOTE_PATH}`);
console.log(`   Files: ${files.length} (${(totalSize / 1024 / 1024).toFixed(1)} MB)\n`);

// Collect unique remote directories sorted by depth
const dirs = new Set();
for (const f of files) {
  const d = dirname(f.remote);
  if (d === ".") continue;
  let parts = d.split("/").filter(Boolean);
  for (let i = 1; i <= parts.length; i++) {
    dirs.add(parts.slice(0, i).join("/"));
  }
}
const sortedDirs = [...dirs].sort((a, b) => a.split("/").length - b.split("/").length);

// Build FTP command sequence
const cmds = [
  `open ${HOST}`,
  USER,
  PASS,
  "binary",
  `cd ${REMOTE_PATH}`,
];

// Create directories
for (const d of sortedDirs) {
  cmds.push(`mkdir "${d}"`);
  cmds.push(`cd "${d}"`);
  cmds.push(`cd ${REMOTE_PATH}`); // back to root
}

// Upload files
for (const f of files) {
  const localPath = f.local.replace(/\\/g, "/");
  cmds.push(`put "${localPath}" "${REMOTE_PATH}/${f.remote}"`);
}

cmds.push("quit");

console.log("📤 Uploading to Hostinger...\n");

// Run ftp with commands piped to stdin
const ftp = spawn("ftp", [], {
  stdio: ["pipe", "inherit", "inherit"],
  shell: true,
});

ftp.on("error", (err) => {
  console.error("❌ FTP process error:", err.message);
  process.exit(1);
});

ftp.on("exit", (code) => {
  console.log(`\n${code === 0 ? "✅ Upload complete!" : "⚠️  FTP process exited with code " + code}`);
  
  if (code === 0) {
    console.log("\n📋 Files uploaded:");
    for (const f of files) {
      console.log(`   ${REMOTE_PATH}/${f.remote}`);
    }
    console.log(`\n🌐 Visit: https://alayainsider.com`);
  } else {
    console.log("\nIf upload failed, try manually:");
    console.log("1. Open https://hpanel.hostinger.com");
    console.log("2. Go to File Manager");
    console.log("3. Upload dist/ contents to public_html/");
    console.log("4. Or use FileZilla with the same credentials");
  }
});

// Write all commands to stdin
for (const cmd of cmds) {
  ftp.stdin.write(cmd + "\n");
}
ftp.stdin.end();
