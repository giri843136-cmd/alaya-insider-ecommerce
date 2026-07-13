import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";

const HOST = "ftp.alayainsider.com";
const USER = "u131951911.AlayaInsider";
const PASS = "((Giri)1923@+-)";
const REMOTE_DIR = "public_html";  // Relative to FTP root!
const DIST_DIR = "./dist";

function getAllFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getAllFiles(DIST_DIR);
console.log(`Uploading ${files.length} files to public_html/...\n`);

for (const localPath of files) {
  const relPath = relative(DIST_DIR, localPath).replace(/\\/g, "/");
  const remotePath = REMOTE_DIR + "/" + relPath;
  
  const cmd = `curl -s --connect-timeout 15 -u "${USER}:${PASS}" -T "${localPath}" "ftp://${HOST}/${remotePath}" --ftp-create-dirs 2>&1`;
  
  try {
    execSync(cmd, { stdio: "pipe", timeout: 30000 });
    console.log(`✓ ${relPath}`);
  } catch (e) {
    console.error(`✗ ${relPath}: ${e.stderr?.toString().trim() || e.message}`);
  }
}

console.log("\nAll files uploaded!");
