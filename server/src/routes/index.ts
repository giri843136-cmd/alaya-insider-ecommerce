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

const routes = new Hono();

routes.route("/", catalog);
routes.route("/", commerce);
routes.route("/", content);
routes.route("/", customers);
routes.route("/", system);

export { routes };
