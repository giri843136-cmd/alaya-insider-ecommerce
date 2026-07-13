import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initMobilePlatform } from "./lib/mobilePlatform";
import { initResourceHints } from "./lib/performance";
import App from "./App";

// Initialize mobile platform, PWA, performance monitoring
initMobilePlatform();

// Initialize critical resource hints (preconnect, dns-prefetch)
initResourceHints();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
