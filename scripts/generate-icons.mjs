// PWA icon generator — creates SVG placeholders that work as PNG stand-ins
// In production, replace with actual design assets

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");
const screenshotsDir = join(__dirname, "..", "public", "screenshots");

mkdirSync(iconsDir, { recursive: true });
mkdirSync(screenshotsDir, { recursive: true });

const sizes = [
  { name: "icon-192", size: 192 },
  { name: "icon-512", size: 512 },
  { name: "icon-192-maskable", size: 192 },
  { name: "icon-512-maskable", size: 512 },
  { name: "shop-icon", size: 96 },
  { name: "cart-icon", size: 96 },
  { name: "wishlist-icon", size: 96 },
  { name: "account-icon", size: 96 },
];

const accentColor = "#9c7a4b";
const bgColor = "#f7f4ef";
const textColor = "#211c15";

for (const { name, size } of sizes) {
  const isMaskable = name.includes("maskable");
  const isShortcut = name.includes("icon");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor}"/>
      <stop offset="100%" style="stop-color:#ebe4d8"/>
    </linearGradient>
    <linearGradient id="a" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accentColor}"/>
      <stop offset="100%" style="stop-color:#b8945c"/>
    </linearGradient>
  </defs>
  ${isMaskable ? `<rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>` : `<rect width="${size}" height="${size}" fill="url(#bg)"/>`}
  <circle cx="${size / 2}" cy="${size * 0.4}" r="${size * 0.18}" fill="url(#a)"/>
  <text x="${size / 2}" y="${size * 0.75}" text-anchor="middle" font-family="serif" font-size="${size * 0.12}" font-weight="bold" fill="${textColor}">ALAYA</text>
</svg>`;

  writeFileSync(join(iconsDir, `${name}.svg`), svg);
  console.log(`Created ${name}.svg (${size}×${size})`);
}

// Screenshot placeholders
const screenshots = [
  { name: "home-mobile", w: 390, h: 844 },
  { name: "home-desktop", w: 1280, h: 800 },
];

for (const { name, w, h } of screenshots) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bgColor}"/>
  <rect x="${w * 0.1}" y="${h * 0.1}" width="${w * 0.8}" height="${h * 0.8}" rx="12" fill="white" stroke="#e7e0d4" stroke-width="1"/>
  <circle cx="${w * 0.5}" cy="${h * 0.25}" r="${Math.min(w, h) * 0.08}" fill="${accentColor}"/>
  <text x="${w * 0.5}" y="${h * 0.42}" text-anchor="middle" font-family="serif" font-size="${Math.min(w, h) * 0.05}" font-weight="bold" fill="${textColor}">ALAYA INSIDER</text>
  <rect x="${w * 0.2}" y="${h * 0.5}" width="${w * 0.6}" height="${h * 0.04}" rx="4" fill="#e7e0d4"/>
  <rect x="${w * 0.2}" y="${h * 0.57}" width="${w * 0.4}" height="${h * 0.03}" rx="3" fill="#e7e0d4"/>
  <rect x="${w * 0.2}" y="${h * 0.63}" width="${w * 0.5}" height="${h * 0.03}" rx="3" fill="#e7e0d4"/>
</svg>`;

  writeFileSync(join(screenshotsDir, `${name}.svg`), svg);
  console.log(`Created ${name}.svg (${w}×${h})`);
}

console.log("\n✓ All icons and screenshots generated in public/");
