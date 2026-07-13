/**
 * ALAYA INSIDER — PR-11 Load Testing Script
 * --------------------------------------------------------------------------
 * Simulates production traffic to verify platform stability under load.
 * Targets: 1000 concurrent users, 7 endpoint scenarios.
 *
 * Usage: node scripts/load-test.mjs
 *   BASE_URL=http://localhost:3001 node scripts/load-test.mjs
 *   CONCURRENCY=500 DURATION=30 node scripts/load-test.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "100", 10);
const DURATION_SEC = parseInt(process.env.DURATION || "60", 10);

const results = [];
let completedRequests = 0;
let failedRequests = 0;

async function fetchWithTiming(url, options) {
  options = options || {};
  const start = performance.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), ...options });
    const duration = performance.now() - start;
    return { duration, status: res.status, ok: res.ok };
  } catch (err) {
    const duration = performance.now() - start;
    return { duration, status: 0, ok: false };
  }
}

const SCENARIOS = [];

SCENARIOS.push(async () => {
  const queries = ["bag", "shoes", "dress", "watch", "luxury", "chair", "lamp", "table", "sofa", "silk"];
  const query = queries[Math.floor(Math.random() * queries.length)];
  const r = await fetchWithTiming(BASE_URL + "/api/v1/search/search?q=" + query + "&limit=12");
  results.push({ name: "search", duration: r.duration, status: r.status });
  if (!r.ok) failedRequests++; else completedRequests++;
});

SCENARIOS.push(async () => {
  const prefixes = ["b", "sh", "d", "l", "ch", "t"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const r = await fetchWithTiming(BASE_URL + "/api/v1/search/autocomplete?q=" + prefix + "&limit=5");
  results.push({ name: "autocomplete", duration: r.duration, status: r.status });
  if (!r.ok) failedRequests++; else completedRequests++;
});

SCENARIOS.push(async () => {
  const r = await fetchWithTiming(BASE_URL + "/api/v1/search/filters");
  results.push({ name: "filters", duration: r.duration, status: r.status });
  if (!r.ok) failedRequests++; else completedRequests++;
});

SCENARIOS.push(async () => {
  const r = await fetchWithTiming(BASE_URL + "/api/v1/search/recommendations/trending?limit=8");
  results.push({ name: "recommendations", duration: r.duration, status: r.status });
  if (!r.ok) failedRequests++; else completedRequests++;
});

SCENARIOS.push(async () => {
  const r = await fetchWithTiming(BASE_URL + "/api/v1/search/analytics/popular");
  results.push({ name: "analytics", duration: r.duration, status: r.status });
  if (!r.ok) failedRequests++; else completedRequests++;
});

SCENARIOS.push(async () => {
  const r = await fetchWithTiming(BASE_URL + "/api/v1/cache/stats");
  results.push({ name: "cache", duration: r.duration, status: r.status });
  if (!r.ok) failedRequests++; else completedRequests++;
});

SCENARIOS.push(async () => {
  const r = await fetchWithTiming(BASE_URL + "/api/v1/search/dashboard");
  results.push({ name: "dashboard", duration: r.duration, status: r.status });
  if (!r.ok) failedRequests++; else completedRequests++;
});

async function simulateUser() {
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  await scenario();
}

async function runLoadTest() {
  console.log("\n" + "=".repeat(70));
  console.log("  ALAYA INSIDER — LOAD TEST");
  console.log("=".repeat(70));
  console.log("\n  Target:      " + BASE_URL);
  console.log("  Concurrency: " + CONCURRENCY + " users");
  console.log("  Duration:    " + DURATION_SEC + "s");
  console.log("\n" + "-".repeat(70));

  const startTime = Date.now();
  const endTime = startTime + DURATION_SEC * 1000;
  let activeUsers = 0;
  let totalLaunched = 0;

  while (Date.now() < endTime) {
    while (activeUsers < CONCURRENCY && Date.now() < endTime) {
      activeUsers++;
      totalLaunched++;
      simulateUser().finally(function () {
        activeUsers--;
      });
    }
    await new Promise(function (r) { return setTimeout(r, 10); });
  }

  await new Promise(function (r) { return setTimeout(r, 5000); });

  var elapsed = (Date.now() - startTime) / 1000;
  var totalRequests = completedRequests + failedRequests;

  // Compute per-endpoint stats
  var durations = {};
  results.forEach(function (r) {
    if (!durations[r.name]) durations[r.name] = [];
    durations[r.name].push(r.duration);
  });

  console.log("\n  RESULTS");
  console.log("=".repeat(70));
  console.log("  Total launched:  " + totalLaunched);
  console.log("  Completed:       " + completedRequests);
  console.log("  Failed:          " + failedRequests);
  console.log("  Duration:        " + elapsed.toFixed(1) + "s");
  console.log("  Throughput:      " + (totalRequests / elapsed).toFixed(1) + " req/s");
  console.log("\n  PER-ENDPOINT BREAKDOWN");
  console.log("-".repeat(70));

  var allDurs = [];
  Object.keys(durations).forEach(function (name) {
    var durs = durations[name];
    if (!durs || durs.length === 0) return;
    durs.sort(function (a, b) { return a - b; });
    allDurs = allDurs.concat(durs);
    var avg = durs.reduce(function (s, v) { return s + v; }, 0) / durs.length;
    var p50 = durs[Math.floor(durs.length * 0.5)];
    var p95 = durs[Math.floor(durs.length * 0.95)];
    var p99 = durs[Math.floor(durs.length * 0.99)];
    var errors = results.filter(function (r) { return r.name === name && r.status === 0; }).length;
    console.log(
      "  " + (name + "                ").slice(0, 18) +
      "count=" + (durs.length + "     ").slice(0, 6) +
      "avg=" + (avg.toFixed(0) + "ms     ").slice(0, 8) +
      "p50=" + (p50.toFixed(0) + "ms     ").slice(0, 8) +
      "p95=" + (p95.toFixed(0) + "ms     ").slice(0, 8) +
      "p99=" + (p99.toFixed(0) + "ms     ").slice(0, 8) +
      "errors=" + errors
    );
  });

  allDurs.sort(function (a, b) { return a - b; });
  var globalAvg = allDurs.reduce(function (s, v) { return s + v; }, 0) / allDurs.length;
  var globalP95 = allDurs[Math.floor(allDurs.length * 0.95)];
  var globalP99 = allDurs[Math.floor(allDurs.length * 0.99)];

  console.log("\n  GLOBAL PERCENTILES");
  console.log("-".repeat(70));
  console.log("  Average:  " + globalAvg.toFixed(0) + "ms");
  console.log("  P95:      " + globalP95.toFixed(0) + "ms");
  console.log("  P99:      " + globalP99.toFixed(0) + "ms");
  console.log("  Error %:  " + ((failedRequests / Math.max(totalRequests, 1)) * 100).toFixed(2) + "%");

  var success = failedRequests / Math.max(totalRequests, 1) < 0.05 && globalP95 < 5000;
  console.log("\n  VERDICT:  " + (success ? "PASS" : "FAIL"));
  console.log("=".repeat(70));

  process.exit(success ? 0 : 1);
}

runLoadTest().catch(function (err) {
  console.error("Load test error:", err);
  process.exit(1);
});
