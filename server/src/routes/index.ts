/**
 * ALAYA INSIDER — Route Aggregator
 * --------------------------------------------------------------------------
 * Combines all route groups into a single router mounted at /api/v1.
 */

import { Hono } from "hono";
import { catalog } from "./catalog.js";
import { commerce } from "./commerce.js";
import { content } from "./content.js";
import { customers } from "./customers.js";
import { system } from "./system.js";
import { auth } from "./auth.js";
import { email } from "./email.js";import { integrations } from "./integrations.js";
import { notifications } from "./notifications.js";
import { media } from "./media.js";
import { payments } from "./payments.js";
import { affiliate } from "./affiliate.js";
import { supplier } from "./supplier.js";
import { shipping } from "./shipping.js";
import { orchestrator } from "./orchestrator.js";
import { automation } from "./automation.js";
import { observability } from "./observability.js";
import { ai } from "./ai.js";
import { search } from "./search.js";
import { cacheRouter } from "./cache.js";

const routes = new Hono();

routes.route("/", catalog);
 routes.route("/", commerce);
 routes.route("/", content);
 routes.route("/", customers);
 routes.route("/", system);
 routes.route("/", auth);
 routes.route("/", email);
 routes.route("/", integrations);
 routes.route("/", notifications);
 routes.route("/", media);
 routes.route("/", payments);
 routes.route("/affiliates", affiliate);
 routes.route("/suppliers", supplier);
 routes.route("/shipping", shipping);
 routes.route("/orchestrator", orchestrator);
 routes.route("/automation", automation);
 routes.route("/observability", observability);
 routes.route("/ai", ai);
 routes.route("/search", search);
 routes.route("/cache", cacheRouter);

export { routes };
