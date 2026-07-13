/**
 * ALAYA INSIDER — Enterprise AI Commerce Platform Routes (PR-9)
 * --------------------------------------------------------------------------
 * REST API endpoints for the centralized AI platform.
 * Mounted at /api/v1/ai in routes/index.ts
 */

import { Hono } from "hono";
import {
  getProviders, getActiveProviders, getProvider, getProviderBySlug,
  createProvider, updateProvider, recordProviderHealth, selectBestProvider, getProviderStats,
  getModels, getModel, getDefaultModel, createModel, getModelStats,
  getPrompts, getPrompt, getPromptBySlug, createPrompt, updatePrompt,
  getPromptVersions, rollbackPrompt, getPromptStats,
  computeQualityScores, autoImprove,
  generateProductTitle, generateProductDescription, generateProductFeatures,
  generateProductSpecs, generateProductFaqs, generateProductBuyingGuide,
  generateProductProsCons, generateProductComparison, generateUseCases,
  generateTargetAudience, generateGiftSuggestions, generateInternalLinksForProduct,
  generateProductSeo, getProductAISummary,
  generateCategoryPage, generateBrandPage, generateCollectionPage,
  generateEmailCampaign, generatePlatformSocialPost,
  generateArticle, generateBuyingGuide, generateLandingPage,
  generateNewsletter, generateSocialPost,
  analyzeImageColors, detectDuplicateImages,
  generateImageAltText, generateImageCaption, analyzeImageQuality,
  detectImageObjects, generateImageTags, getImageSeoScore, getAccessibilityScore,
  keywordResearch, generateTopicClusters, generateInternalLinks, generateSchema,
  generateExternalLinks, extractEntities, analyzeContentGap,
  generateCompetitorSuggestions, generateReviewSchema,
  compareAffiliatePrograms, forecastAffiliateRevenue,
  chooseBestAffiliateLink, repairBrokenAffiliateLinks, suggestBetterAffiliateProducts,
  analyzeCompetitorPrices, analyzeSupplierPrices, recommendBestPrice,
  recommendProducts, recommendEmails, recommendOffers,
  segmentCustomers, predictChurn, predictLifetimeValue,
  forecastRevenue, forecastOrders, forecastDemand, forecastStock,
  forecastReturns, forecastRefunds, forecastSupplierPerformance, forecastCarrierPerformance,
  semanticSearch, detectIntent, getRelatedProducts, naturalLanguageSearch,
  recordGeneration, getGenerationHistory, getUsageStats,
  registerWorkflow, triggerWorkflow, getWorkflows, getWorkflowRuns, getWorkflowStats,
  enableABTest, setABTestWinner, approvePromptVersion, getPendingApprovals,
  getAIDashboardStats, seedAIPlatform,
  encryptValue, decryptValue,
} from "../services/aiEngine.js";

const ai = new Hono();

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */

ai.get("/dashboard", async (c) => {
  const stats = await getAIDashboardStats();
  return c.json({ success: true, data: stats });
});

ai.post("/seed", async (c) => {
  await seedAIPlatform();
  return c.json({ success: true, message: "AI platform seeded" });
});

/* ================================================================== */
/*  PROVIDERS                                                          */
/* ================================================================== */

ai.get("/providers", async (c) => {
  const providers = c.req.query("active") ? await getActiveProviders() : await getProviders();
  return c.json({ success: true, data: providers });
});

ai.get("/providers/stats", async (c) => {
  const stats = await getProviderStats();
  return c.json({ success: true, data: stats });
});

ai.get("/providers/best", async (c) => {
  const provider = await selectBestProvider(c.req.query("task"));
  return c.json({ success: true, data: provider });
});

ai.get("/providers/:id", async (c) => {
  const provider = await getProvider(c.req.param("id"));
  if (!provider) return c.json({ success: false, error: "Provider not found" }, 404);
  return c.json({ success: true, data: provider });
});

ai.post("/providers", async (c) => {
  try {
    const body = await c.req.json();
    const provider = await createProvider(body);
    return c.json({ success: true, data: provider }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

ai.patch("/providers/:id", async (c) => {
  try {
    const body = await c.req.json();
    const provider = await updateProvider(c.req.param("id"), body);
    if (!provider) return c.json({ success: false, error: "Provider not found" }, 404);
    return c.json({ success: true, data: provider });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

ai.post("/providers/:slug/health", async (c) => {
  try {
    const { status, latency_ms, error } = await c.req.json();
    await recordProviderHealth(c.req.param("slug"), status, latency_ms, error);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/* ================================================================== */
/*  MODELS                                                             */
/* ================================================================== */

ai.get("/models", async (c) => {
  const models = await getModels(c.req.query("provider_id"));
  return c.json({ success: true, data: models });
});

ai.get("/models/stats", async (c) => {
  const stats = await getModelStats();
  return c.json({ success: true, data: stats });
});

ai.get("/models/default", async (c) => {
  const model = await getDefaultModel(c.req.query("provider_id"));
  return c.json({ success: true, data: model });
});

ai.get("/models/:id", async (c) => {
  const model = await getModel(c.req.param("id"));
  if (!model) return c.json({ success: false, error: "Model not found" }, 404);
  return c.json({ success: true, data: model });
});

ai.post("/models", async (c) => {
  try {
    const body = await c.req.json();
    const model = await createModel(body);
    return c.json({ success: true, data: model }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/* ================================================================== */
/*  PROMPTS                                                            */
/* ================================================================== */

ai.get("/prompts", async (c) => {
  const prompts = await getPrompts(c.req.query("category"));
  return c.json({ success: true, data: prompts });
});

ai.get("/prompts/stats", async (c) => {
  const stats = await getPromptStats();
  return c.json({ success: true, data: stats });
});

ai.get("/prompts/:id", async (c) => {
  const prompt = await getPrompt(c.req.param("id"));
  if (!prompt) return c.json({ success: false, error: "Prompt not found" }, 404);
  return c.json({ success: true, data: prompt });
});

ai.post("/prompts", async (c) => {
  try {
    const body = await c.req.json();
    const prompt = await createPrompt(body);
    return c.json({ success: true, data: prompt }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

ai.patch("/prompts/:id", async (c) => {
  try {
    const body = await c.req.json();
    const { change_notes, ...patch } = body;
    const prompt = await updatePrompt(c.req.param("id"), patch, change_notes);
    if (!prompt) return c.json({ success: false, error: "Prompt not found" }, 404);
    return c.json({ success: true, data: prompt });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

ai.get("/prompts/:id/versions", async (c) => {
  const versions = await getPromptVersions(c.req.param("id"));
  return c.json({ success: true, data: versions });
});

ai.post("/prompts/:id/rollback", async (c) => {
  try {
    const { version } = await c.req.json();
    const prompt = await rollbackPrompt(c.req.param("id"), version);
    if (!prompt) return c.json({ success: false, error: "Version not found" }, 404);
    return c.json({ success: true, data: prompt });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/* ================================================================== */
/*  QUALITY ENGINE                                                     */
/* ================================================================== */

ai.post("/quality/score", async (c) => {
  try {
    const { text, keywords, existing_texts, brand_terms } = await c.req.json();
    const scores = await computeQualityScores(text, { keywords, existingTexts: existing_texts, brandTerms: brand_terms });
    return c.json({ success: true, data: scores });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

ai.post("/quality/improve", async (c) => {
  try {
    const { text, scores } = await c.req.json();
    const improved = await autoImprove(text, scores);
    return c.json({ success: true, data: { original: text, improved, scores } });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/* ================================================================== */
/*  PRODUCT AI                                                         */
/* ================================================================== */

ai.post("/product/title", async (c) => {
  try {
    const body = await c.req.json();
    const title = await generateProductTitle(body);
    return c.json({ success: true, data: { title } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/description", async (c) => {
  try {
    const body = await c.req.json();
    const description = await generateProductDescription(body);
    return c.json({ success: true, data: { description } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/features", async (c) => {
  try {
    const body = await c.req.json();
    const features = await generateProductFeatures(body);
    return c.json({ success: true, data: { features } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/specs", async (c) => {
  try {
    const body = await c.req.json();
    const specs = await generateProductSpecs(body);
    return c.json({ success: true, data: { specs } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/faqs", async (c) => {
  try {
    const body = await c.req.json();
    const faqs = await generateProductFaqs(body);
    return c.json({ success: true, data: { faqs } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/buying-guide", async (c) => {
  try {
    const body = await c.req.json();
    const guide = await generateProductBuyingGuide(body);
    return c.json({ success: true, data: guide });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/seo", async (c) => {
  try {
    const body = await c.req.json();
    const seo = await generateProductSeo(body);
    return c.json({ success: true, data: seo });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/pros-cons", async (c) => {
  try { const body = await c.req.json(); const res = await generateProductProsCons(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/comparison", async (c) => {
  try { const body = await c.req.json(); const res = await generateProductComparison(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/use-cases", async (c) => {
  try { const body = await c.req.json(); const res = await generateUseCases(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/target-audience", async (c) => {
  try { const body = await c.req.json(); const res = await generateTargetAudience(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/gift-suggestions", async (c) => {
  try { const body = await c.req.json(); const res = await generateGiftSuggestions(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/product/internal-links", async (c) => {
  try { const body = await c.req.json(); const res = await generateInternalLinksForProduct(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.get("/product/:productId/summary", async (c) => {
  const summary = await getProductAISummary(c.req.param("productId"));
  if (!summary) return c.json({ success: false, error: "Product not found" }, 404);
  return c.json({ success: true, data: summary });
});

/* ================================================================== */
/*  GENERATE & RECORD                                                  */
/* ================================================================== */

ai.post("/generate", async (c) => {
  try {
    const body = await c.req.json();
    const record = await recordGeneration(body);
    return c.json({ success: true, data: record }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

ai.get("/generations", async (c) => {
  const history = await getGenerationHistory({
    task: c.req.query("task"),
    entity_type: c.req.query("entity_type"),
    entity_id: c.req.query("entity_id"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
  });
  return c.json({ success: true, data: history });
});

ai.get("/usage", async (c) => {
  const days = c.req.query("days") ? parseInt(c.req.query("days")!) : 30;
  const stats = await getUsageStats(days);
  return c.json({ success: true, data: stats });
});

/* ================================================================== */
/*  CONTENT AI                                                         */
/* ================================================================== */

ai.post("/content/category-page", async (c) => {
  try { const body = await c.req.json(); const page = await generateCategoryPage(body); return c.json({ success: true, data: page }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/content/brand-page", async (c) => {
  try { const body = await c.req.json(); const page = await generateBrandPage(body); return c.json({ success: true, data: page }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/content/collection-page", async (c) => {
  try { const body = await c.req.json(); const page = await generateCollectionPage(body); return c.json({ success: true, data: page }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/content/email-campaign", async (c) => {
  try { const body = await c.req.json(); const campaign = await generateEmailCampaign(body); return c.json({ success: true, data: campaign }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/content/platform-post", async (c) => {
  try { const body = await c.req.json(); const post = await generatePlatformSocialPost(body); return c.json({ success: true, data: post }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/content/article", async (c) => {
  try {
    const body = await c.req.json();
    const article = await generateArticle(body);
    return c.json({ success: true, data: article });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/content/buying-guide", async (c) => {
  try {
    const body = await c.req.json();
    const guide = await generateBuyingGuide(body);
    return c.json({ success: true, data: guide });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/content/landing-page", async (c) => {
  try {
    const body = await c.req.json();
    const page = await generateLandingPage(body);
    return c.json({ success: true, data: page });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/content/newsletter", async (c) => {
  try {
    const body = await c.req.json();
    const newsletter = await generateNewsletter(body);
    return c.json({ success: true, data: newsletter });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/content/social-post", async (c) => {
  try {
    const body = await c.req.json();
    const post = await generateSocialPost(body);
    return c.json({ success: true, data: post });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

/* ================================================================== */
/*  IMAGE AI                                                           */
/* ================================================================== */

ai.post("/image/alt-text", async (c) => {
  try {
    const body = await c.req.json();
    const alt = await generateImageAltText(body);
    return c.json({ success: true, data: { alt_text: alt } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/image/caption", async (c) => {
  try {
    const body = await c.req.json();
    const caption = await generateImageCaption(body);
    return c.json({ success: true, data: { caption } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/image/analyze", async (c) => {
  try {
    const { url } = await c.req.json();
    const analysis = await analyzeImageQuality(url);
    return c.json({ success: true, data: analysis });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/image/tags", async (c) => {
  try {
    const body = await c.req.json();
    const tags = await generateImageTags(body);
    return c.json({ success: true, data: { tags } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/image/colors", async (c) => {
  try { const { url } = await c.req.json(); const colors = await analyzeImageColors(url); return c.json({ success: true, data: colors }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/image/detect-duplicates", async (c) => {
  try { const { url, existing_urls } = await c.req.json(); const result = await detectDuplicateImages(url, existing_urls); return c.json({ success: true, data: result }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/image/seo-score", async (c) => {
  try {
    const { alt_text } = await c.req.json();
    const score = await getImageSeoScore(alt_text);
    return c.json({ success: true, data: { score } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

/* ================================================================== */
/*  SEO AI                                                             */
/* ================================================================== */

ai.post("/seo/keywords", async (c) => {
  try {
    const { topic } = await c.req.json();
    const keywords = await keywordResearch(topic);
    return c.json({ success: true, data: keywords });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/seo/topic-clusters", async (c) => {
  try {
    const { topic } = await c.req.json();
    const clusters = await generateTopicClusters(topic);
    return c.json({ success: true, data: clusters });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/seo/schema", async (c) => {
  try {
    const body = await c.req.json();
    const schema = await generateSchema(body);
    return c.json({ success: true, data: schema });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/seo/external-links", async (c) => {
  try { const body = await c.req.json(); const res = await generateExternalLinks(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/seo/extract-entities", async (c) => {
  try { const { text } = await c.req.json(); const res = await extractEntities(text); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/seo/content-gap", async (c) => {
  try { const body = await c.req.json(); const res = await analyzeContentGap(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/seo/competitor-suggestions", async (c) => {
  try { const body = await c.req.json(); const res = await generateCompetitorSuggestions(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/seo/review-schema", async (c) => {
  try { const body = await c.req.json(); const res = await generateReviewSchema(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

/* ================================================================== */
/*  AFFILIATE AI                                                       */
/* ================================================================== */

ai.get("/affiliate/compare-programs", async (c) => {
  const result = await compareAffiliatePrograms();
  return c.json({ success: true, data: result });
});

ai.post("/affiliate/choose-best-link", async (c) => {
  try { const body = await c.req.json(); const res = await chooseBestAffiliateLink(body); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/affiliate/repair-links", async (c) => {
  try { const { urls } = await c.req.json(); const res = await repairBrokenAffiliateLinks(urls); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/affiliate/suggest-products", async (c) => {
  try { const body = await c.req.json(); const res = await suggestBetterAffiliateProducts(body.product_id, body.category); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/affiliate/forecast", async (c) => {
  try {
    const body = await c.req.json();
    const forecast = await forecastAffiliateRevenue(body);
    return c.json({ success: true, data: forecast });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

/* ================================================================== */
/*  PRICE AI                                                           */
/* ================================================================== */

ai.post("/price/analyze-competitors", async (c) => {
  try {
    const body = await c.req.json();
    const analysis = await analyzeCompetitorPrices(body);
    return c.json({ success: true, data: analysis });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/price/analyze-suppliers", async (c) => {
  try {
    const body = await c.req.json();
    const analysis = await analyzeSupplierPrices(body);
    return c.json({ success: true, data: analysis });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/price/recommend", async (c) => {
  try {
    const body = await c.req.json();
    const recommendation = await recommendBestPrice(body);
    return c.json({ success: true, data: recommendation });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

/* ================================================================== */
/*  CUSTOMER AI                                                        */
/* ================================================================== */

ai.get("/customer/segments", async (c) => {
  const segments = await segmentCustomers();
  return c.json({ success: true, data: segments });
});

ai.post("/customer/recommend-products", async (c) => {
  try {
    const { customer_id, limit } = await c.req.json();
    const products = await recommendProducts(customer_id, limit);
    return c.json({ success: true, data: products });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/customer/recommend-emails", async (c) => {
  try {
    const { customer_id } = await c.req.json();
    const emails = await recommendEmails(customer_id);
    return c.json({ success: true, data: emails });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/customer/recommend-offers", async (c) => {
  try {
    const { customer_id } = await c.req.json();
    const offers = await recommendOffers(customer_id);
    return c.json({ success: true, data: offers });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/customer/predict-churn", async (c) => {
  try {
    const body = await c.req.json();
    const prediction = await predictChurn(body);
    return c.json({ success: true, data: prediction });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/customer/predict-ltv", async (c) => {
  try {
    const body = await c.req.json();
    const ltv = await predictLifetimeValue(body);
    return c.json({ success: true, data: ltv });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

/* ================================================================== */
/*  COMMERCE AI                                                        */
/* ================================================================== */

ai.get("/commerce/forecast-revenue", async (c) => {
  const months = c.req.query("months") ? parseInt(c.req.query("months")!) : 12;
  const forecast = await forecastRevenue(months);
  return c.json({ success: true, data: forecast });
});

ai.get("/commerce/forecast-orders", async (c) => {
  const months = c.req.query("months") ? parseInt(c.req.query("months")!) : 12;
  const forecast = await forecastOrders(months);
  return c.json({ success: true, data: forecast });
});

ai.get("/commerce/forecast-demand", async (c) => {
  const forecast = await forecastDemand(c.req.query("product_id"));
  return c.json({ success: true, data: forecast });
});

ai.get("/commerce/forecast-stock/:productId", async (c) => {
  const forecast = await forecastStock(c.req.param("productId"));
  return c.json({ success: true, data: forecast });
});

ai.get("/commerce/forecast-returns", async (c) => {
  const months = c.req.query("months") ? parseInt(c.req.query("months")!) : 6;
  const forecast = await forecastReturns(months);
  return c.json({ success: true, data: forecast });
});

ai.get("/commerce/forecast-refunds", async (c) => {
  const months = c.req.query("months") ? parseInt(c.req.query("months")!) : 6;
  const forecast = await forecastRefunds(months);
  return c.json({ success: true, data: forecast });
});

ai.get("/commerce/forecast-suppliers", async (c) => {
  const months = c.req.query("months") ? parseInt(c.req.query("months")!) : 6;
  const forecast = await forecastSupplierPerformance(months);
  return c.json({ success: true, data: forecast });
});

ai.get("/commerce/forecast-carriers", async (c) => {
  const months = c.req.query("months") ? parseInt(c.req.query("months")!) : 6;
  const forecast = await forecastCarrierPerformance(months);
  return c.json({ success: true, data: forecast });
});

/* ================================================================== */
/*  SEARCH AI                                                          */
/* ================================================================== */

ai.post("/search/semantic", async (c) => {
  try {
    const { query, limit } = await c.req.json();
    const results = await semanticSearch(query, limit);
    return c.json({ success: true, data: results });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/search/intent", async (c) => {
  try {
    const { query } = await c.req.json();
    const intent = await detectIntent(query);
    return c.json({ success: true, data: intent });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/search/natural-language", async (c) => {
  try {
    const { query } = await c.req.json();
    const result = await naturalLanguageSearch(query);
    return c.json({ success: true, data: result });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.get("/search/related/:productId", async (c) => {
  const products = await getRelatedProducts(c.req.param("productId"));
  return c.json({ success: true, data: products });
});

/* ================================================================== */
/*  AI WORKFLOWS                                                       */
/* ================================================================== */

ai.get("/workflows", async (c) => {
  const workflows = await getWorkflows();
  return c.json({ success: true, data: workflows });
});

ai.get("/workflows/stats", async (c) => {
  const stats = await getWorkflowStats();
  return c.json({ success: true, data: stats });
});

ai.get("/workflows/runs", async (c) => {
  const runs = await getWorkflowRuns({
    workflow_id: c.req.query("workflow_id"),
    status: c.req.query("status"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
  });
  return c.json({ success: true, data: runs });
});

ai.post("/workflows", async (c) => {
  try {
    const body = await c.req.json();
    const workflow = await registerWorkflow(body);
    return c.json({ success: true, data: workflow }, 201);
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/workflows/trigger", async (c) => {
  try {
    const { event, entity_type, entity_id } = await c.req.json();
    const runs = await triggerWorkflow(event, entity_type, entity_id);
    return c.json({ success: true, data: runs });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

/* ================================================================== */
/*  PROMPT A/B TESTING & APPROVAL                                      */
/* ================================================================== */

ai.post("/prompts/:id/ab-test/enable", async (c) => {
  try { const res = await enableABTest(c.req.param("id")); if (!res) return c.json({ success: false, error: "Prompt not found" }, 404); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/prompts/:id/ab-test/winner", async (c) => {
  try { const { version } = await c.req.json(); const res = await setABTestWinner(c.req.param("id"), version); if (!res) return c.json({ success: false, error: "Prompt or version not found" }, 404); return c.json({ success: true, data: res }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/prompts/:id/approve", async (c) => {
  try { const { version, approved_by } = await c.req.json(); const res = await approvePromptVersion(c.req.param("id"), version, approved_by || "admin"); if (!res) return c.json({ success: false, error: "Version not found" }, 404); return c.json({ success: true, data: { approved: true } }); }
  catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.get("/prompts/pending-approvals", async (c) => {
  const approvals = await getPendingApprovals();
  return c.json({ success: true, data: approvals });
});

/* ================================================================== */
/*  ENCRYPTION                                                         */
/* ================================================================== */

ai.post("/encrypt", async (c) => {
  try {
    const { value } = await c.req.json();
    const result = encryptValue(value);
    return c.json({ success: true, data: result });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

ai.post("/decrypt", async (c) => {
  try {
    const { encrypted, iv, tag } = await c.req.json();
    const value = decryptValue(encrypted, iv, tag);
    return c.json({ success: true, data: { value } });
  } catch (err: any) { return c.json({ success: false, error: err.message }, 400); }
});

export { ai };
