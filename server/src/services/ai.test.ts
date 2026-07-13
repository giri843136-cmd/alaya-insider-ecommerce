/**
 * ALAYA INSIDER — Enterprise AI Commerce Platform Validation Tests (PR-9)
 * --------------------------------------------------------------------------
 * Tests the complete AI platform: Provider Manager, Model Registry, Prompt Manager,
 * Quality Engine, Product AI, Content AI, Image AI, SEO AI, Affiliate AI, Price AI,
 * Customer AI, Commerce AI, Search AI, AI Memory, and AI Workflows.
 *
 * Run: npx tsx src/services/ai.test.ts
 * Requires: Running backend with PostgreSQL at localhost:3001
 */

/* ================================================================== */
/*  TEST CONFIG                                                         */
/* ================================================================== */

const API = "http://localhost:3001/api/v1/ai";
const AI_PASS = "✅";
const AI_FAIL = "❌";
const AI_SKIP = "⏭️";

let aiPassed = 0;
let aiFailed = 0;
let aiSkipped = 0;

async function aiTest(name: string, fn: () => Promise<boolean>, skip = false) {
  if (skip) { aiSkipped++; console.log(`${AI_SKIP} ${name}`); return; }
  try {
    const ok = await fn();
    if (ok) { aiPassed++; console.log(`${AI_PASS} ${name}`); }
    else { aiFailed++; console.log(`${AI_FAIL} ${name}`); }
  } catch (err) {
    aiFailed++;
    console.log(`${AI_FAIL} ${name}: ${err}`);
  }
}

async function aiApiPost(path: string, body: any): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function aiApiGet(path: string): Promise<any> {
  const res = await fetch(`${API}${path}`);
  return res.json();
}

/* ================================================================== */
/*  TESTS                                                               */
/* ================================================================== */

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  PR-9: ENTERPRISE AI COMMERCE PLATFORM VALIDATION");
  console.log("═══════════════════════════════════════════════════════════\n");

  // 1. Provider Manager
  console.log("\n── Provider Manager ──");
  await aiTest("GET /providers returns providers list", async () => {
    const res = await aiApiGet("/providers");
    return res.success && Array.isArray(res.data);
  });
  await aiTest("GET /providers/stats returns stats", async () => {
    const res = await aiApiGet("/providers/stats");
    return res.success && res.data.total >= 0;
  });
  await aiTest("GET /providers/best selects best provider", async () => {
    const res = await aiApiGet("/providers/best");
    return res.success;
  });

  // 2. Model Registry
  console.log("\n── Model Registry ──");
  await aiTest("GET /models returns models list", async () => {
    const res = await aiApiGet("/models");
    return res.success && Array.isArray(res.data);
  });
  await aiTest("GET /models/stats returns stats", async () => {
    const res = await aiApiGet("/models/stats");
    return res.success && res.data.total >= 0;
  });
  await aiTest("GET /models/default returns default model", async () => {
    const res = await aiApiGet("/models/default");
    return res.success;
  });

  // 3. Prompt Manager
  console.log("\n── Prompt Manager ──");
  await aiTest("GET /prompts returns prompts list", async () => {
    const res = await aiApiGet("/prompts");
    return res.success && Array.isArray(res.data);
  });
  await aiTest("GET /prompts/stats returns stats", async () => {
    const res = await aiApiGet("/prompts/stats");
    return res.success && res.data.total >= 0;
  });
  await aiTest("POST /prompts creates a new prompt", async () => {
    const res = await aiApiPost("/prompts", {
      slug: `test-prompt-${Date.now()}`,
      name: "Test Prompt",
      category: "test",
      user_template: "Generate content for {topic}",
      variables: ["topic"],
    });
    return res.success && res.data.id;
  });

  // 4. Quality Engine
  console.log("\n── Quality Engine ──");
  await aiTest("POST /quality/score computes quality scores", async () => {
    const res = await aiApiPost("/quality/score", {
      text: "This is a test article about luxury products. Shop our collection today.",
      keywords: ["luxury", "products"],
    });
    return res.success && res.data.overall >= 0 && res.data.grammar >= 0 && res.data.seo >= 0;
  });
  await aiTest("POST /quality/improve auto-improves text", async () => {
    const res = await aiApiPost("/quality/improve", {
      text: "i bought this product and it is great. it is really good.",
      scores: { grammar: 40, readability: 50, seo: 30, conversion: 20, originality: 80, brand_voice: 50, accessibility: 60, compliance: 90, overall: 50 },
    });
    return res.success && res.data.improved && res.data.improved !== res.data.original;
  });

  // 5. Product AI
  console.log("\n── Product AI ──");
  await aiTest("POST /product/title generates title", async () => {
    const res = await aiApiPost("/product/title", { productName: "Silk Scarf", brand: "Hermès", category: "Accessories" });
    return res.success && res.data.title.includes("Silk Scarf");
  });
  await aiTest("POST /product/description generates description", async () => {
    const res = await aiApiPost("/product/description", { productName: "Leather Bag", brand: "Gucci", features: ["Handcrafted", "Italian leather"] });
    return res.success && res.data.description.length > 50;
  });
  await aiTest("POST /product/features generates features", async () => {
    const res = await aiApiPost("/product/features", { productName: "Cashmere Sweater", count: 5 });
    return res.success && res.data.features.length === 5;
  });
  await aiTest("POST /product/seo generates SEO metadata", async () => {
    const res = await aiApiPost("/product/seo", { productName: "Gold Watch", brand: "Rolex", category: "Watches" });
    return res.success && res.data.meta_title && res.data.meta_description && res.data.slug;
  });
  await aiTest("POST /product/faqs generates FAQs", async () => {
    const res = await aiApiPost("/product/faqs", { productName: "Diamond Ring", brand: "Tiffany" });
    return res.success && res.data.faqs.length >= 3;
  });
  await aiTest("POST /product/pros-cons generates pros & cons", async () => {
    const res = await aiApiPost("/product/pros-cons", { productName: "Silk Scarf", brand: "Hermès" });
    return res.success && res.data.pros.length >= 3 && res.data.cons.length >= 1;
  });
  await aiTest("POST /product/comparison generates comparison", async () => {
    const res = await aiApiPost("/product/comparison", { productName: "Leather Bag", alternatives: ["Alternative A", "Alternative B"] });
    return res.success && res.data.alternatives.length >= 2;
  });
  await aiTest("POST /product/use-cases generates use cases", async () => {
    const res = await aiApiPost("/product/use-cases", { productName: "Wool Coat", category: "Outerwear" });
    return res.success && res.data.length >= 3;
  });
  await aiTest("POST /product/target-audience generates audiences", async () => {
    const res = await aiApiPost("/product/target-audience", { productName: "Leather Wallet" });
    return res.success && res.data.length >= 3;
  });
  await aiTest("POST /product/gift-suggestions generates gift ideas", async () => {
    const res = await aiApiPost("/product/gift-suggestions", { productName: "Perfume", brand: "Chanel" });
    return res.success && res.data.length >= 3;
  });
  await aiTest("POST /product/internal-links generates links", async () => {
    const res = await aiApiPost("/product/internal-links", { productName: "Sunglasses", category: "Accessories" });
    return res.success && res.data.length >= 3;
  });

  // 6. Content AI
  console.log("\n── Content AI ──");
  await aiTest("POST /content/article generates article", async () => {
    const res = await aiApiPost("/content/article", { title: "Guide to Watches", topic: "luxury watches", wordCount: 300 });
    return res.success && res.data.title && res.data.body.length > 0;
  });
  await aiTest("POST /content/buying-guide generates guide", async () => {
    const res = await aiApiPost("/content/buying-guide", { topic: "leather bags", audience: "luxury shoppers" });
    return res.success && res.data.sections.length >= 3;
  });
  await aiTest("POST /content/category-page generates category page", async () => {
    const res = await aiApiPost("/content/category-page", { categoryName: "Accessories" });
    return res.success && res.data.title.includes("Accessories");
  });
  await aiTest("POST /content/brand-page generates brand page", async () => {
    const res = await aiApiPost("/content/brand-page", { brandName: "Gucci" });
    return res.success && res.data.title.includes("Gucci");
  });
  await aiTest("POST /content/email-campaign generates email", async () => {
    const res = await aiApiPost("/content/email-campaign", { campaignName: "Summer Collection", audience: "VIP customers" });
    return res.success && res.data.subject && res.data.body;
  });
  await aiTest("POST /content/newsletter generates newsletter", async () => {
    const res = await aiApiPost("/content/newsletter", { topic: "new arrivals" });
    return res.success && res.data.subject && res.data.body;
  });
  await aiTest("POST /content/social-post generates social post", async () => {
    const res = await aiApiPost("/content/social-post", { campaign: "Summer Edit", platform: "instagram" });
    return res.success && res.data.text.length > 10;
  });
  await aiTest("POST /content/platform-post generates platform-specific post", async () => {
    const res = await aiApiPost("/content/platform-post", { campaign: "Fall Collection", platform: "twitter" });
    return res.success && res.data.text.length <= 280;
  });

  // 7. Image AI
  console.log("\n── Image AI ──");
  await aiTest("POST /image/alt-text generates alt text", async () => {
    const res = await aiApiPost("/image/alt-text", { productName: "Silk Scarf", brand: "Hermès" });
    return res.success && res.data.alt_text.includes("Silk Scarf");
  });
  await aiTest("POST /image/tags generates tags", async () => {
    const res = await aiApiPost("/image/tags", { productName: "Leather Bag", category: "Accessories" });
    return res.success && res.data.tags.length >= 3;
  });
  await aiTest("POST /image/colors analyzes colors", async () => {
    const res = await aiApiPost("/image/colors", { url: "/images/product.jpg" });
    return res.success && res.data.dominant_colors.length >= 2 && res.data.palette.length >= 3;
  });
  await aiTest("POST /image/detect-duplicates detects duplicates", async () => {
    const res = await aiApiPost("/image/detect-duplicates", {
      url: "/images/product.jpg",
      existing_urls: ["/images/product.jpg", "/images/other.jpg"],
    });
    return res.success && typeof res.data.is_duplicate === "boolean";
  });

  // 8. SEO AI
  console.log("\n── SEO AI ──");
  await aiTest("POST /seo/keywords researches keywords", async () => {
    const res = await aiApiPost("/seo/keywords", { topic: "luxury handbags" });
    return res.success && res.data.primary.length >= 3 && res.data.long_tail.length >= 3;
  });
  await aiTest("POST /seo/topic-clusters generates clusters", async () => {
    const res = await aiApiPost("/seo/topic-clusters", { topic: "watches" });
    return res.success && res.data.length >= 2;
  });
  await aiTest("POST /seo/schema generates schema", async () => {
    const res = await aiApiPost("/seo/schema", { type: "product", name: "Gold Watch", description: "A luxury watch" });
    return res.success && res.data["@type"] === "Product";
  });

  // 9. Affiliate AI
  console.log("\n── Affiliate AI ──");
  await aiTest("GET /affiliate/compare-programs compares programs", async () => {
    const res = await aiApiGet("/affiliate/compare-programs");
    return res.success && res.data.programs.length >= 3 && res.data.bestPick;
  });
  await aiTest("POST /affiliate/forecast forecasts revenue", async () => {
    const res = await aiApiPost("/affiliate/forecast", { monthly_clicks: 5000, conversion_rate: 2.5, avg_commission: 8, avg_order_value: 150 });
    return res.success && res.data.monthly_forecast > 0;
  });

  // 10. Price AI
  console.log("\n── Price AI ──");
  await aiTest("POST /price/analyze-competitors analyzes prices", async () => {
    const res = await aiApiPost("/price/analyze-competitors", { product_price: 100, competitor_prices: [90, 110, 95] });
    return res.success && res.data.position && res.data.recommendation;
  });
  await aiTest("POST /price/analyze-suppliers analyzes supplier prices", async () => {
    const res = await aiApiPost("/price/analyze-suppliers", { product_name: "Leather Bag" });
    return res.success && res.data.suppliers.length >= 2 && res.data.best_supplier;
  });
  await aiTest("POST /price/recommend recommends best price", async () => {
    const res = await aiApiPost("/price/recommend", { cost_price: 50, desired_margin: 40, demand_level: "high" });
    return res.success && res.data.recommended_price > 50;
  });

  // 11. Customer AI
  console.log("\n── Customer AI ──");
  await aiTest("GET /customer/segments returns segments", async () => {
    const res = await aiApiGet("/customer/segments");
    return res.success && res.data.segments.length >= 3;
  });
  await aiTest("POST /customer/predict-churn predicts churn", async () => {
    const res = await aiApiPost("/customer/predict-churn", { days_since_last_purchase: 120, total_orders: 1, avg_order_value: 80, return_rate: 0.1 });
    return res.success && res.data.risk && res.data.recommendations.length > 0;
  });
  await aiTest("POST /customer/predict-ltv predicts LTV", async () => {
    const res = await aiApiPost("/customer/predict-ltv", { total_spent: 500, months_active: 12, avg_monthly_spend: 42 });
    return res.success && res.data.current_ltv > 0;
  });

  // 12. Commerce AI
  console.log("\n── Commerce AI ──");
  await aiTest("GET /commerce/forecast-revenue forecasts revenue", async () => {
    const res = await aiApiGet("/commerce/forecast-revenue?months=6");
    return res.success && res.data.forecasts.length === 6 && res.data.total > 0;
  });
  await aiTest("GET /commerce/forecast-orders forecasts orders", async () => {
    const res = await aiApiGet("/commerce/forecast-orders?months=3");
    return res.success && res.data.forecasts.length === 3;
  });
  await aiTest("GET /commerce/forecast-demand forecasts demand", async () => {
    const res = await aiApiGet("/commerce/forecast-demand");
    return res.success && res.data.current_demand;
  });
  await aiTest("GET /commerce/forecast-returns forecasts returns", async () => {
    const res = await aiApiGet("/commerce/forecast-returns?months=3");
    return res.success && res.data.forecasts.length === 3 && res.data.avg_return_rate > 0;
  });
  await aiTest("GET /commerce/forecast-suppliers forecasts supplier perf", async () => {
    const res = await aiApiGet("/commerce/forecast-suppliers?months=3");
    return res.success && res.data.forecasts.length === 3 && res.data.overall_score > 0;
  });
  await aiTest("GET /commerce/forecast-carriers forecasts carrier perf", async () => {
    const res = await aiApiGet("/commerce/forecast-carriers?months=3");
    return res.success && res.data.forecasts.length === 3 && res.data.best_carrier;
  });

  // 13. Search AI
  console.log("\n── Search AI ──");
  await aiTest("POST /search/intent detects intent", async () => {
    const res = await aiApiPost("/search/intent", { query: "buy luxury handbag under $500" });
    return res.success && res.data.intent && (res.data.attributes || res.data.category);
  });
  await aiTest("POST /search/natural-language searches naturally", async () => {
    const res = await aiApiPost("/search/natural-language", { query: "luxury watches" });
    return res.success && res.data.intent;
  });

  // 14. AI Memory
  console.log("\n── AI Memory ──");
  await aiTest("POST /generate records a generation", async () => {
    const res = await aiApiPost("/generate", {
      task: "test",
      prompt_text: "Generate test content",
      generated_text: "Test content generated",
      provider_slug: "openai",
      tokens_input: 10,
      tokens_output: 20,
      latency_ms: 100,
    });
    return res.success && res.data.id;
  });
  await aiTest("GET /generations returns history", async () => {
    const res = await aiApiGet("/generations?limit=5");
    return res.success && Array.isArray(res.data);
  });
  await aiTest("GET /usage returns usage stats", async () => {
    const res = await aiApiGet("/usage?days=30");
    return res.success && res.data.total_requests >= 0;
  });

  // 15. AI Workflows
  console.log("\n── AI Workflows ──");
  await aiTest("GET /workflows returns workflows", async () => {
    const res = await aiApiGet("/workflows");
    return res.success && Array.isArray(res.data);
  });
  await aiTest("GET /workflows/stats returns stats", async () => {
    const res = await aiApiGet("/workflows/stats");
    return res.success && res.data.total >= 0;
  });

  // 16. Dashboard
  console.log("\n── Dashboard ──");
  await aiTest("GET /dashboard returns platform stats", async () => {
    const res = await aiApiGet("/dashboard");
    return res.success && res.data.providers && res.data.models && res.data.prompts && res.data.usage;
  });

  // 17. Encryption
  console.log("\n── Encryption ──");
  await aiTest("POST /encrypt encrypts a value", async () => {
    const res = await aiApiPost("/encrypt", { value: "sk-test-api-key-12345" });
    return res.success && res.data.encrypted && res.data.iv && res.data.tag;
  });
  await aiTest("POST /decrypt decrypts a value", async () => {
    const encRes = await aiApiPost("/encrypt", { value: "sk-test-api-key-12345" });
    if (!encRes.success) return false;
    const decRes = await aiApiPost("/decrypt", { encrypted: encRes.data.encrypted, iv: encRes.data.iv, tag: encRes.data.tag });
    return decRes.success && decRes.data.value === "sk-test-api-key-12345";
  });

  /* ================================================================== */
  /*  RESULTS                                                            */
  /* ================================================================== */    const aiTotal = aiPassed + aiFailed + aiSkipped;
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  RESULTS: ${AI_PASS} ${aiPassed} passed | ${AI_FAIL} ${aiFailed} failed | ${AI_SKIP} ${aiSkipped} skipped`);
  console.log(`  TOTAL: ${aiTotal} tests`);
  console.log(`  STATUS: ${aiFailed === 0 ? "✅ ALL PASSED" : "❌ SOME FAILED"}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(aiFailed > 0 ? 1 : 0);
}

main().catch(console.error);
