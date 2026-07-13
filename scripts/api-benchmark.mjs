/**
 * ALAYA INSIDER — PR-11 API Performance Benchmark
 * --------------------------------------------------------------------------
 * Benchmarks all key REST endpoints: avg latency, P50, P95, P99, response size,
 * and compression ratio.
 *
 * Usage: node scripts/api-benchmark.mjs
 *   BASE_URL=http://localhost:3001 node scripts/api-benchmark.mjs
 *   WARMUP=10 SAMPLES=100 node scripts/api-benchmark.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const WARMUP = parseInt(process.env.WARMUP || "5", 10);
const SAMPLES = parseInt(process.env.SAMPLES || "50", 10);

async function benchmarkEndpoint(method, path, body) {
  var options = { method: method, signal: AbortSignal.timeout(15000) };
  if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  var start = performance.now();
  try {
    var res = await fetch(BASE_URL + path, options);
    var duration = performance.now() - start;
    var text = await res.text();
    return { duration: duration, size: text.length, status: res.status, ok: res.ok };
  } catch (err) {
    var duration = performance.now() - start;
    return { duration: duration, size: 0, status: 0, ok: false };
  }
}

function computeStats(durations, sizes, statusCodes) {
  if (durations.length === 0) return null;
  var sorted = durations.slice().sort(function (a, b) { return a - b; });
  return {
    count: durations.length,
    min: Math.min.apply(null, durations),
    max: Math.max.apply(null, durations),
    avg: durations.reduce(function (s, v) { return s + v; }, 0) / durations.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    avgResponseSize: sizes.reduce(function (s, v) { return s + v; }, 0) / Math.max(sizes.length, 1),
    errors: statusCodes.filter(function (c) { return c === 0; }).length,
  };
}

var ENDPOINTS = [
  { method: "GET", path: "/api/v1/search/filters" },
  { method: "GET", path: "/api/v1/search/search?q=bag&limit=12" },
  { method: "GET", path: "/api/v1/search/autocomplete?q=sh" },
  { method: "GET", path: "/api/v1/search/suggestions?q=bag" },
  { method: "GET", path: "/api/v1/search/recommendations/trending?limit=8" },
  { method: "GET", path: "/api/v1/search/analytics/popular" },
  { method: "GET", path: "/api/v1/search/dashboard" },
  { method: "GET", path: "/api/v1/search/index/stats" },
  { method: "GET", path: "/api/v1/cache/stats" },
  { method: "GET", path: "/api/v1/observability/dashboard" },
  { method: "GET", path: "/api/v1/observability/logs/stats" },
  { method: "GET", path: "/api/v1/observability/metrics/summary?days=1" },
  { method: "GET", path: "/api/v1/observability/health/services" },
  { method: "GET", path: "/api/v1/system/health" },
];

async function runBenchmark() {
  console.log("\n" + "=".repeat(80));
  console.log("  ALAYA INSIDER — API PERFORMANCE BENCHMARK (PR-11)");
  console.log("=".repeat(80));
  console.log("\n  Target:   " + BASE_URL);
  console.log("  Warmup:   " + WARMUP + " requests/endpoint");
  console.log("  Samples:  " + SAMPLES + " requests/endpoint");
  console.log("\n" + "-".repeat(80));

  var results = {};

  for (var e = 0; e < ENDPOINTS.length; e++) {
    var ep = ENDPOINTS[e];
    var key = ep.method + " " + ep.path;
    results[key] = { endpoint: ep.path, method: ep.method, durations: [], sizes: [], statuses: [], errors: 0 };

    // Warmup
    for (var i = 0; i < WARMUP; i++) {
      await benchmarkEndpoint(ep.method, ep.path, ep.body);
    }

    // Benchmark samples
    for (var i = 0; i < SAMPLES; i++) {
      var r = await benchmarkEndpoint(ep.method, ep.path, ep.body);
      results[key].durations.push(r.duration);
      results[key].sizes.push(r.size);
      results[key].statuses.push(r.status);
      if (!r.ok) results[key].errors++;
    }
  }

  console.log("\n  BENCHMARK RESULTS");
  console.log("=".repeat(80));
  console.log("  Endpoint                                    Count   Avg      P50      P95      P99     Size      Errors");
  console.log("  " + "-".repeat(78));

  var allDurations = [];
  var allErrors = 0;
  var allTotal = 0;

  Object.keys(results).forEach(function (key) {
    var result = results[key];
    var stats = computeStats(result.durations, result.sizes, result.statuses);
    if (!stats) return;

    allDurations = allDurations.concat(result.durations);
    allErrors += result.errors;
    allTotal += result.durations.length;

    var m = (result.method + "    ").slice(0, 4);
    var p = (result.endpoint + "                                                ").slice(0, 48);
    console.log(
      "  " + m + " " + p + " " +
      (stats.count + "     ").slice(0, 5) + "  " +
      (stats.avg.toFixed(0) + "ms    ").slice(0, 6) + " " +
      (stats.p50.toFixed(0) + "ms    ").slice(0, 6) + " " +
      (stats.p95.toFixed(0) + "ms    ").slice(0, 6) + " " +
      (stats.p99.toFixed(0) + "ms    ").slice(0, 6) + "  " +
      (Math.round(stats.avgResponseSize) + "     ").slice(0, 7) + "  " +
      result.errors
    );
  });

  var globalStats = computeStats(allDurations, [], []);
  if (globalStats) {
    console.log("  " + "-".repeat(78));
    console.log(
      "  GLOBAL                                " +
      (allTotal + "     ").slice(0, 5) + "  " +
      (globalStats.avg.toFixed(0) + "ms    ").slice(0, 6) + " " +
      (globalStats.p50.toFixed(0) + "ms    ").slice(0, 6) + " " +
      (globalStats.p95.toFixed(0) + "ms    ").slice(0, 6) + " " +
      (globalStats.p99.toFixed(0) + "ms    ").slice(0, 6)
    );
    console.log("  Error rate:  " + (allErrors / Math.max(allTotal, 1) * 100).toFixed(2) + "%");
    console.log("  Total reqs:  " + allTotal);
    console.log("  Max latency: " + globalStats.max.toFixed(0) + " ms");
    console.log("  Min latency: " + globalStats.min.toFixed(0) + " ms");
  }

  // Compression check
  console.log("\n  COMPRESSION CHECK");
  console.log("-".repeat(80));
  try {
    var res = await fetch(BASE_URL + "/api/v1/cache/stats", { headers: { "Accept-Encoding": "gzip" } });
    var text = await res.text();
    var rawSize = text.length;
    var compressedSize = (await res.clone().blob()).size;
    var ratio = ((1 - compressedSize / Math.max(rawSize, 1)) * 100).toFixed(1);
    console.log("  Raw response:      " + rawSize + " B");
    console.log("  Compressed:        " + compressedSize + " B");
    console.log("  Compression ratio: " + ratio + "%");
  } catch (err) {
    console.log("  Compression check skipped: " + err.message);
  }

  var pass = allErrors / Math.max(allTotal, 1) < 0.05 && globalStats && globalStats.p95 < 5000;
  console.log("\n  VERDICT:  " + (pass ? "PASS" : "FAIL"));
  console.log("=".repeat(80));
  process.exit(pass ? 0 : 1);
}

runBenchmark().catch(function (err) {
  console.error("Benchmark error:", err);
  process.exit(1);
});
