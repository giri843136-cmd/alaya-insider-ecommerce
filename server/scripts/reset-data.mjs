import { createSeedData } from "../src/seed/index.ts";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const seed = createSeedData();
const path = join(dataDir, "store.json");
writeFileSync(path, JSON.stringify(seed, null, 2));
console.log(`Written ${seed.products.length} products, ${seed.categories.length} categories, ${seed.brands.length} brands`);
