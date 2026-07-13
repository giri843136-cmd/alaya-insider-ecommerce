/**
 * ALAYA INSIDER — Cloudinary Integration Test
 * -------------------------------------------
 * Verifies: upload, metadata retrieval, and image transformation.
 */

import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: "v71scqon",
  api_key: "488786122859843",
  api_secret: "loQaS4li4aZ_qwJFYJPAtOPhq6U",
});

async function main() {
  console.log("☁️  Cloudinary Integration Test\n");

  // ── 1. Upload a sample image ──
  console.log("📤 Uploading image...");
  const uploadResult = await cloudinary.uploader.upload(
    "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    {
      public_id: "alaya-test-upload",
      folder: "alaya-insider/test",
      tags: ["alaya-insider", "test"],
    }
  );

  console.log(`   ✅ Uploaded!`);
  console.log(`   Public ID: ${uploadResult.public_id}`);
  console.log(`   Secure URL: ${uploadResult.secure_url}\n`);

  // ── 2. Get image details ──
  console.log("📋 Image metadata:");
  const resource = await cloudinary.api.resource(uploadResult.public_id);
  console.log(`   Width: ${resource.width}px`);
  console.log(`   Height: ${resource.height}px`);
  console.log(`   Format: ${resource.format}`);
  console.log(`   Size: ${resource.bytes} bytes (${(resource.bytes / 1024).toFixed(1)} KB)`);
  console.log(`   Type: ${resource.type}`);
  console.log(`   Created: ${resource.created_at}\n`);

  // ── 3. Generate transformed URL ──
  console.log("🎨 Generating transformed image...");

  // f_auto = automatically select best format (WebP, AVIF, etc.) based on browser
  // q_auto = automatically optimize quality for smallest file size without visible loss
  const transformedUrl = cloudinary.url(uploadResult.public_id, {
    transformation: [
      { width: 400, height: 300, crop: "fill", gravity: "auto" },
      { f_auto: true, q_auto: "best" },
    ],
    secure: true,
  });

  console.log(`   Transformed URL: ${transformedUrl}\n`);

  // ── 4. Cleanup — delete test image ──
  console.log("🧹 Cleaning up test image...");
  await cloudinary.uploader.destroy(uploadResult.public_id);
  console.log("   ✅ Test image deleted\n");

  // ── Success ──
  console.log("✅ Cloudinary integration verified successfully!");
  console.log(`   Original image: ${(resource.bytes / 1024).toFixed(1)} KB (${resource.width}x${resource.height}, ${resource.format})`);
  console.log(`   Transformed: 400x300 with auto-format & auto-quality`);
  console.log(`\n   Transformed URL (for comparison): ${transformedUrl}`);
}

main().catch((err) => {
  console.error("❌ Cloudinary test failed:", err.message);
  process.exit(1);
});
