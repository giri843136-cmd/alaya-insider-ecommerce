/**
 * ALAYA INSIDER — FTP Deployment Script
 * --------------------------------------
 * Uploads the built dist/ folder to Hostinger hosting.
 * 
 * Usage:
 *   FTP_HOST=ftp.alayainsider.com FTP_USER=user FTP_PASS=pass node scripts/upload-ftp.mjs
 */

import { readdirSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const HOST = process.env.FTP_HOST;
const USER = process.env.FTP_USER;
const PASS = process.env.FTP_PASSWORD;
const REMOTE_PATH = (process.env.FTP_PATH || "/").replace(/\\/g, "/");

if (!HOST || !USER || !PASS) {
  console.error("Missing FTP credentials. Set FTP_HOST, FTP_USER, and FTP_PASSWORD.");
  console.error("Example:");
  console.error('  FTP_HOST=ftp.alayainsider.com FTP_USER=u123456789 FTP_PASSWORD=secret node scripts/upload-ftp.mjs');
  process.exit(1);
}

if (!existsSync(DIST)) {
  console.error(`Build not found at ${DIST}. Run 'npm run build' first.`);
  process.exit(1);
}

// Collect files to upload
const files = [];
function collect(dir, base = "") {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = base ? join(base, entry.name) : entry.name;
    if (entry.isDirectory()) {
      collect(full, rel);
    } else {
      files.push({ local: full, remote: (REMOTE_PATH + "/" + rel).replace(/\\/g, "/") });
    }
  }
}
collect(DIST);

console.log(`\n🔨 ALAYA INSIDER — FTP Deploy`);
console.log(`   Host: ${HOST}`);
console.log(`   User: ${USER}`);
console.log(`   Path: ${REMOTE_PATH}`);
console.log(`   Files: ${files.length}\n`);

// Collect unique remote directories
const dirs = new Set();
for (const f of files) {
  const d = dirname(f.remote);
  let parts = d.split("/").filter(Boolean);
  for (let i = 1; i <= parts.length; i++) {
    dirs.add("/" + parts.slice(0, i).join("/"));
  }
}

// Generate FTP commands
const commands = [
  `open ${HOST}`,
  USER,
  PASS,      "prompt noconfirm",
      "binary",
      "quote PASV",
    ];

    // Create remote directories (sorted by depth to create parents first)
for (const d of [...dirs].sort((a, b) => a.split("/").length - b.split("/").length)) {
  commands.push(`mkdir "${d}"`);
}

// Upload files
for (const f of files) {
  commands.push(`put "${f.local}" "${f.remote}"`);
}

commands.push("bye");

// Write temporary command file
const cmdFile = join(ROOT, "scripts", `_ftp_${Date.now()}.txt`);
writeFileSync(cmdFile, commands.join("\n"), "utf8");

console.log("📤 Uploading to Hostinger...");

try {
  const result = execSync(`ftp -s:"${cmdFile}"`, {
    timeout: 300000, // 5 minutes
    stdio: "pipe",
    encoding: "utf8",
  });
  console.log(result.stdout || "");
  console.log("✅ Upload complete!");
} catch (err) {
  console.error("❌ FTP upload failed:");
  console.error(err.stderr || err.message);
  console.error("\nYou can try manually:");
  console.error("1. Open https://hpanel.hostinger.com");
  console.error("2. Go to File Manager");
  console.error("3. Upload the contents of dist/ to public_html/");
  process.exitCode = 1;
} finally {
  // Clean up credentials file
  try { unlinkSync(cmdFile); } catch {}
}

console.log("\n📋 Uploaded files:");
for (const f of files) {
  console.log(`   ${f.remote}`);
}

console.log(`\n🌐 Visit: https://alayainsider.com`);
