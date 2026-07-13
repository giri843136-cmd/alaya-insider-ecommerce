import { Hono } from "hono";
import {
  getAllProviders,
  getProvidersForModule,
  getIntegration,
  getAllMaskedIntegrations,
  getIntegrationsByModule,
  getIntegrationsByEnvironment,
  saveIntegration,
  deleteIntegration,
  toggleIntegration,
  changeIntegrationEnvironment,
  testConnection,
  rotateCredentials,
  getIntegrationLogs,
  getAllLogs,
  getIntegrationStats,
  getHealthDashboard,
  createBackup,
  listBackups,
  restoreBackup,
  exportConfigs,
  importConfigs,
} from "../services/integrations.js";
import type { IntegrationModule, IntegrationEnvironment } from "../services/integrations.js";

const integrations = new Hono();

async function requireAdmin(c: any, next: any) {
  const session = (c as any).get("session");
  if (!session || session.type !== "admin") {
    return c.json({ code: "UNAUTHORIZED", message: "Admin authentication required", status: 401 }, 401);
  }
  return next();
}

async function requireSuperAdmin(c: any, next: any) {
  const session = (c as any).get("session");
  if (!session || session.type !== "admin") {
    return c.json({ code: "UNAUTHORIZED", message: "Admin authentication required", status: 401 }, 401);
  }
  const adminEmail = session.email || "";
  const isSuperAdmin = adminEmail === "alayainsider@gmail.com" || session.role === "super_admin";
  if (!isSuperAdmin) {
    return c.json({ code: "FORBIDDEN", message: "Super Admin privileges required", status: 403 }, 403);
  }
  return next();
}

function getActorInfo(c: any): { ip?: string; userAgent?: string; device?: string; country?: string; role?: any } {
  const session = (c as any).get("session");
  return {
    ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    userAgent: c.req.header("user-agent"),
    device: c.req.header("sec-ch-ua-platform") || "unknown",
    country: c.req.header("cf-ipcountry") || "unknown",
    role: session?.role || "super_admin",
  };
}

// Provider definitions
integrations.get("/integrations/providers", requireAdmin, (c: any) => {
  return c.json({ data: getAllProviders() });
});
integrations.get("/integrations/providers/:module", requireAdmin, (c: any) => {
  const module = c.req.param("module") as IntegrationModule;
  return c.json({ data: getProvidersForModule(module) });
});

// List all (masked)
integrations.get("/integrations", requireAdmin, async (c: any) => {
  return c.json({ data: await getAllMaskedIntegrations() });
});

// Single integration
integrations.get("/integrations/:id", requireAdmin, async (c: any) => {
  const id = c.req.param("id");
  const config = await getIntegration(id);
  if (!config) {
    return c.json({ code: "NOT_FOUND", message: "Integration not found", status: 404 }, 404);
  }
  const allMasked = await getAllMaskedIntegrations();
  const masked = allMasked.find((i: any) => i.id === id);
  return c.json({ data: masked });
});

// By module
integrations.get("/integrations/module/:module", requireAdmin, async (c: any) => {
  const module = c.req.param("module") as IntegrationModule;
  const allMasked = await getAllMaskedIntegrations();
  const masked = allMasked.filter((i: any) => i.module === module);
  return c.json({ data: masked });
});

// By environment
integrations.get("/integrations/environment/:env", requireAdmin, async (c: any) => {
  const env = c.req.param("env") as IntegrationEnvironment;
  const envIntegrations = await getIntegrationsByEnvironment(env);
  const allMasked = await getAllMaskedIntegrations();
  const masked = allMasked.filter((i: any) => envIntegrations.some((ei) => ei.id === i.id));
  return c.json({ data: masked });
});

// Create/Update
integrations.post("/integrations", requireSuperAdmin, async (c: any) => {
  const body = await c.req.json();
  const { module, provider, label, settings, environment } = body;
  if (!module || !provider || !label) {
    return c.json({ code: "VALIDATION_ERROR", message: "module, provider, and label are required", status: 400 }, 400);
  }
  try {
    const session = (c as any).get("session");
    const actorInfo = getActorInfo(c);
    const config = await saveIntegration(
      { module, provider, label, settings: settings || {}, environment },
      session?.email || "admin",
      actorInfo,
    );
    return c.json({ data: config, message: "Integration saved" });
  } catch (error: any) {
    return c.json({ code: "VALIDATION_ERROR", message: error.message, status: 400 }, 400);
  }
});

// Delete
integrations.delete("/integrations/:id", requireSuperAdmin, async (c: any) => {
  const id = c.req.param("id");
  const session = (c as any).get("session");
  const actorInfo = getActorInfo(c);
  const deleted = await deleteIntegration(id, session?.email || "admin", actorInfo);
  if (!deleted) {
    return c.json({ code: "NOT_FOUND", message: "Integration not found", status: 404 }, 404);
  }
  return c.json({ message: "Integration deleted" });
});

// Toggle
integrations.post("/integrations/:id/toggle", requireSuperAdmin, async (c: any) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const enabled = body.enabled === true;
  const session = (c as any).get("session");
  const actorInfo = getActorInfo(c);
  const config = await toggleIntegration(id, enabled, session?.email || "admin", actorInfo);
  if (!config) {
    return c.json({ code: "NOT_FOUND", message: "Integration not found", status: 404 }, 404);
  }
  return c.json({ data: config, message: enabled ? "Integration enabled" : "Integration disabled" });
});

// Test connection
integrations.post("/integrations/:id/test", requireAdmin, async (c: any) => {
  const id = c.req.param("id");
  const result = await testConnection(id);
  return c.json({ data: result });
});

// Rotate
integrations.post("/integrations/:id/rotate", requireSuperAdmin, async (c: any) => {
  const id = c.req.param("id");
  const session = (c as any).get("session");
  const actorInfo = getActorInfo(c);
  const config = await rotateCredentials(id, session?.email || "admin", actorInfo);
  if (!config) {
    return c.json({ code: "NOT_FOUND", message: "Integration not found", status: 404 }, 404);
  }
  return c.json({ data: config, message: "Credentials rotated" });
});

// Environment
integrations.post("/integrations/:id/environment", requireSuperAdmin, async (c: any) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { environment } = body;
  if (!environment) {
    return c.json({ code: "VALIDATION_ERROR", message: "environment is required", status: 400 }, 400);
  }
  const session = (c as any).get("session");
  const actorInfo = getActorInfo(c);
  const config = await changeIntegrationEnvironment(id, environment, session?.email || "admin", actorInfo);
  if (!config) {
    return c.json({ code: "NOT_FOUND", message: "Integration not found", status: 404 }, 404);
  }
  return c.json({ data: config, message: `Environment changed to ${environment}` });
});

// Health
integrations.get("/integrations/health", requireAdmin, async (c: any) => {
  return c.json({ data: await getHealthDashboard() });
});
integrations.get("/integrations/health/:id", requireAdmin, async (c: any) => {
  const { id } = c.req.param();
  const allHealth = await getHealthDashboard();
  const health = allHealth.find((h) => h.id === id);
  if (!health) {
    return c.json({ code: "NOT_FOUND", message: "Integration not found", status: 404 }, 404);
  }
  return c.json({ data: health });
});

// Logs
integrations.get("/integrations/:id/logs", requireAdmin, async (c: any) => {
  const id = c.req.param("id");
  const limit = Number(c.req.query("limit")) || 50;
  return c.json({ data: await getIntegrationLogs(id, limit) });
});
integrations.get("/integrations/logs", requireAdmin, async (c: any) => {
  const limit = Number(c.req.query("limit")) || 100;
  return c.json({ data: await getAllLogs(limit) });
});

// Stats
integrations.get("/integrations/stats", requireAdmin, async (c: any) => {
  return c.json({ data: await getIntegrationStats() });
});

// Backup
integrations.post("/integrations/backup", requireSuperAdmin, async (c: any) => {
  const body = await c.req.json().catch(() => ({}));
  const label = body.label || `Backup ${new Date().toISOString().slice(0, 10)}`;
  const environment = body.environment || "all";
  const session = (c as any).get("session");
  const actorInfo = getActorInfo(c);
  const backup = await createBackup(label, session?.email || "admin", environment, actorInfo);
  return c.json({ data: backup, message: `Backup "${label}" created` });
});

// List backups
integrations.get("/integrations/backups", requireSuperAdmin, async (c: any) => {
  return c.json({ data: await listBackups() });
});

// Restore
integrations.post("/integrations/backups/:id/restore", requireSuperAdmin, async (c: any) => {
  const backupId = c.req.param("id");
  const session = (c as any).get("session");
  const actorInfo = getActorInfo(c);
  const result = await restoreBackup(backupId, session?.email || "admin", actorInfo);
  return c.json(result);
});

// Export
integrations.get("/integrations/export", requireSuperAdmin, async (c: any) => {
  const environment = c.req.query("environment") || "all";
  const exportData = await exportConfigs(environment as IntegrationEnvironment | "all");
  c.header("Content-Type", "application/json");
  c.header("Content-Disposition", `attachment; filename="integrations-export-${new Date().toISOString().slice(0, 10)}.json"`);
  return c.body(exportData);
});

// Import
integrations.post("/integrations/import", requireSuperAdmin, async (c: any) => {
  const body = await c.req.json();
  const jsonData = body.data;
  if (!jsonData) {
    return c.json({ code: "VALIDATION_ERROR", message: "data field with JSON string is required", status: 400 }, 400);
  }
  const session = (c as any).get("session");
  const actorInfo = getActorInfo(c);
  const result = await importConfigs(jsonData, session?.email || "admin", actorInfo);
  return c.json(result);
});

export { integrations };
