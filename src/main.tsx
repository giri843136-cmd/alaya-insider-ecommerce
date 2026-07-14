import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initMobilePlatform } from "./lib/mobilePlatform";
import { initResourceHints } from "./lib/performance";
import { initMerchantsFromApi } from "./lib/affiliateCommerce";
import App from "./App";

// Initialize mobile platform, PWA, performance monitoring
initMobilePlatform();

// Initialize critical resource hints (preconnect, dns-prefetch)
initResourceHints();

// Initialize merchant data from backend API (falls back to hardcoded MERCHANTS array)
initMerchantsFromApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
