/**
 * ALAYA INSIDER — Enterprise Microservices Fabric
 * ------------------------------------------------------------------
 * Service registry, service discovery, inter-service authentication,
 * load balancing, failover policies, health checks, and mesh topology.
 *
 * Provides the underlying communication layer for all internal services.
 */
import { uid } from "./utils";

/* ================================================================== */
/*  STORAGE KEY                                                        */
/* ================================================================== */

export const MS_FABRIC_KEY = "alaya_ms_fabric_store";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type ServiceHealth = "healthy" | "degraded" | "unhealthy" | "unknown";
export type ServiceProtocol = "http" | "grpc" | "ws" | "amqp" | "mqtt";
export type LoadBalanceStrategy = "round_robin" | "least_connections" | "ip_hash" | "weighted";
export type FailoverStrategy = "active_passive" | "active_active" | "circuit_breaker" | "retry";
export type DeploymentStrategy = "rolling" | "blue_green" | "canary" | "recreate";

/* ================================================================== */
/*  INTERFACES                                                         */
/* ================================================================== */

export interface Microservice {
  id: string;
  name: string;
  description: string;
  version: string;
  protocol: ServiceProtocol;
  port: number;
  healthEndpoint: string;
  dependencies: string[];
  instances: ServiceInstance[];
  config: ServiceConfig;
  status: ServiceHealth;
  lastHeartbeat?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ServiceInstance {
  id: string;
  serviceId: string;
  host: string;
  port: number;
  status: ServiceHealth;
  weight: number;
  connections: number;
  cpuUsage: number;
  memoryUsage: number;
  startedAt: number;
  lastHeartbeat: number;
}

export interface ServiceConfig {
  minInstances: number;
  maxInstances: number;
  targetCpu: number;
  targetMemory: number;
  loadBalanceStrategy: LoadBalanceStrategy;
  failoverStrategy: FailoverStrategy;
  deploymentStrategy: DeploymentStrategy;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  retryCount: number;
  retryDelay: number;
  timeout: number;
}

export interface ServiceDependency {
  id: string;
  sourceServiceId: string;
  targetServiceId: string;
  type: "sync" | "async" | "stream";
  required: boolean;
  timeout: number;
  retryCount: number;
  circuitBreakerEnabled: boolean;
}

export interface ServiceDiscoveryEntry {
  id: string;
  serviceName: string;
  serviceId: string;
  host: string;
  port: number;
  protocol: ServiceProtocol;
  healthStatus: ServiceHealth;
  metadata: Record<string, string>;
  ttl: number;
  registeredAt: number;
}

export interface ServiceMeshPolicy {
  id: string;
  name: string;
  description: string;
  sourceService: string;
  targetService: string;
  rules: MeshRule[];
  enabled: boolean;
  priority: number;
}

export interface MeshRule {
  type: "traffic_split" | "timeout" | "retry" | "circuit_breaker" | "mirror" | "rate_limit";
  config: Record<string, string>;
}

export interface ServiceHealthCheck {
  id: string;
  serviceId: string;
  serviceName: string;
  status: ServiceHealth;
  latencyMs: number;
  lastChecked: number;
  error?: string;
  region: string;
}

export interface DnsRecord {
  id: string;
  name: string;
  type: "A" | "AAAA" | "CNAME" | "SRV" | "TXT";
  value: string;
  ttl: number;
  serviceId?: string;
}

/* ================================================================== */
/*  STORE                                                              */
/* ================================================================== */

interface MsFabricStore {
  services: Microservice[];
  dependencies: ServiceDependency[];
  discovery: ServiceDiscoveryEntry[];
  meshPolicies: ServiceMeshPolicy[];
  healthChecks: ServiceHealthCheck[];
  dnsRecords: DnsRecord[];
}

function getStore(): MsFabricStore {
  try {
    const raw = localStorage.getItem(MS_FABRIC_KEY);
    if (raw) return JSON.parse(raw) as MsFabricStore;
  } catch { /* ignore */ }
  return { services: [], dependencies: [], discovery: [], meshPolicies: [], healthChecks: [], dnsRecords: [] };
}

function saveStore(store: MsFabricStore) {
  try { localStorage.setItem(MS_FABRIC_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

/* ================================================================== */
/*  SEED DATA                                                          */
/* ================================================================== */

function seedMsFabricData() {
  const store = getStore();
  if (store.services.length > 0) return;

  const now = Date.now();
  const sharedConfig: ServiceConfig = {
    minInstances: 2, maxInstances: 10, targetCpu: 70, targetMemory: 80,
    loadBalanceStrategy: "least_connections", failoverStrategy: "circuit_breaker",
    deploymentStrategy: "rolling", healthCheckInterval: 30, healthCheckTimeout: 5,
    circuitBreakerEnabled: true, circuitBreakerThreshold: 5, circuitBreakerTimeout: 30000,
    retryCount: 3, retryDelay: 1000, timeout: 5000,
  };

  const services: Microservice[] = [
    {
      id: "svc_gateway", name: "API Gateway", description: "Central API gateway routing and authentication", version: "2.1.0", protocol: "http", port: 8080,
      healthEndpoint: "/health", dependencies: ["svc_auth", "svc_product", "svc_order"], instances: [
        { id: "inst_gw_1", serviceId: "svc_gateway", host: "10.0.1.10", port: 8080, status: "healthy", weight: 100, connections: 42, cpuUsage: 34, memoryUsage: 58, startedAt: now - 30 * 86400000, lastHeartbeat: now - 5000 },
        { id: "inst_gw_2", serviceId: "svc_gateway", host: "10.0.1.11", port: 8080, status: "healthy", weight: 100, connections: 38, cpuUsage: 31, memoryUsage: 55, startedAt: now - 30 * 86400000, lastHeartbeat: now - 3000 },
        { id: "inst_gw_3", serviceId: "svc_gateway", host: "10.0.2.10", port: 8080, status: "degraded", weight: 50, connections: 15, cpuUsage: 72, memoryUsage: 81, startedAt: now - 28 * 86400000, lastHeartbeat: now - 10000 },
      ], config: { ...sharedConfig, minInstances: 2, maxInstances: 6, timeout: 10000 }, status: "healthy", lastHeartbeat: now - 3000, createdAt: now - 90 * 86400000, updatedAt: now - 5 * 86400000,
    },
    {
      id: "svc_auth", name: "Auth Service", description: "Authentication, authorization, and identity management", version: "1.5.0", protocol: "http", port: 8081,
      healthEndpoint: "/health", dependencies: ["svc_user"], instances: [
        { id: "inst_auth_1", serviceId: "svc_auth", host: "10.0.1.20", port: 8081, status: "healthy", weight: 100, connections: 28, cpuUsage: 22, memoryUsage: 42, startedAt: now - 90 * 86400000, lastHeartbeat: now - 2000 },
        { id: "inst_auth_2", serviceId: "svc_auth", host: "10.0.1.21", port: 8081, status: "healthy", weight: 100, connections: 25, cpuUsage: 20, memoryUsage: 40, startedAt: now - 90 * 86400000, lastHeartbeat: now - 4000 },
      ], config: { ...sharedConfig, minInstances: 2, maxInstances: 8 }, status: "healthy", lastHeartbeat: now - 2000, createdAt: now - 90 * 86400000, updatedAt: now - 5 * 86400000,
    },
    {
      id: "svc_product", name: "Product Service", description: "Product catalog, inventory, pricing, and search indexing", version: "3.0.0", protocol: "http", port: 8082,
      healthEndpoint: "/health", dependencies: ["svc_search", "svc_media"], instances: [
        { id: "inst_prod_1", serviceId: "svc_product", host: "10.0.1.30", port: 8082, status: "healthy", weight: 100, connections: 56, cpuUsage: 45, memoryUsage: 62, startedAt: now - 85 * 86400000, lastHeartbeat: now - 3000 },
        { id: "inst_prod_2", serviceId: "svc_product", host: "10.0.1.31", port: 8082, status: "healthy", weight: 100, connections: 48, cpuUsage: 42, memoryUsage: 60, startedAt: now - 85 * 86400000, lastHeartbeat: now - 4000 },
        { id: "inst_prod_3", serviceId: "svc_product", host: "10.0.2.30", port: 8082, status: "healthy", weight: 100, connections: 52, cpuUsage: 44, memoryUsage: 61, startedAt: now - 60 * 86400000, lastHeartbeat: now - 3500 },
      ], config: { ...sharedConfig, minInstances: 2, maxInstances: 10 }, status: "healthy", lastHeartbeat: now - 3000, createdAt: now - 85 * 86400000, updatedAt: now - 3 * 86400000,
    },
    {
      id: "svc_order", name: "Order Service", description: "Order processing, payment integration, and fulfillment", version: "2.2.0", protocol: "http", port: 8083,
      healthEndpoint: "/health", dependencies: ["svc_product", "svc_payment", "svc_notification"], instances: [
        { id: "inst_ord_1", serviceId: "svc_order", host: "10.0.1.40", port: 8083, status: "healthy", weight: 100, connections: 32, cpuUsage: 38, memoryUsage: 52, startedAt: now - 80 * 86400000, lastHeartbeat: now - 2500 },
        { id: "inst_ord_2", serviceId: "svc_order", host: "10.0.1.41", port: 8083, status: "healthy", weight: 100, connections: 28, cpuUsage: 35, memoryUsage: 50, startedAt: now - 80 * 86400000, lastHeartbeat: now - 3500 },
      ], config: { ...sharedConfig, minInstances: 2, maxInstances: 8, timeout: 15000 }, status: "healthy", lastHeartbeat: now - 2500, createdAt: now - 80 * 86400000, updatedAt: now - 3 * 86400000,
    },
    {
      id: "svc_payment", name: "Payment Service", description: "Payment gateway integration and transaction processing", version: "2.0.0", protocol: "http", port: 8084,
      healthEndpoint: "/health", dependencies: [], instances: [
        { id: "inst_pay_1", serviceId: "svc_payment", host: "10.0.1.50", port: 8084, status: "healthy", weight: 100, connections: 18, cpuUsage: 28, memoryUsage: 45, startedAt: now - 75 * 86400000, lastHeartbeat: now - 2000 },
        { id: "inst_pay_2", serviceId: "svc_payment", host: "10.0.1.51", port: 8084, status: "healthy", weight: 100, connections: 15, cpuUsage: 25, memoryUsage: 43, startedAt: now - 75 * 86400000, lastHeartbeat: now - 3000 },
      ], config: { ...sharedConfig, minInstances: 2, maxInstances: 6, timeout: 30000 }, status: "healthy", lastHeartbeat: now - 2000, createdAt: now - 75 * 86400000, updatedAt: now - 3 * 86400000,
    },
    {
      id: "svc_search", name: "Search Service", description: "Full-text search indexing and query processing", version: "1.8.0", protocol: "http", port: 8085,
      healthEndpoint: "/health", dependencies: [], instances: [
        { id: "inst_srch_1", serviceId: "svc_search", host: "10.0.1.60", port: 8085, status: "healthy", weight: 100, connections: 12, cpuUsage: 55, memoryUsage: 72, startedAt: now - 70 * 86400000, lastHeartbeat: now - 5000 },
        { id: "inst_srch_2", serviceId: "svc_search", host: "10.0.1.61", port: 8085, status: "degraded", weight: 50, connections: 8, cpuUsage: 82, memoryUsage: 88, startedAt: now - 70 * 86400000, lastHeartbeat: now - 15000 },
      ], config: { ...sharedConfig, minInstances: 2, maxInstances: 5, targetCpu: 65 }, status: "degraded", lastHeartbeat: now - 5000, createdAt: now - 70 * 86400000, updatedAt: now - 2 * 86400000,
    },
    {
      id: "svc_notification", name: "Notification Service", description: "Multi-channel notification dispatch (email, SMS, push)", version: "1.3.0", protocol: "http", port: 8086,
      healthEndpoint: "/health", dependencies: [], instances: [
        { id: "inst_notif_1", serviceId: "svc_notification", host: "10.0.1.70", port: 8086, status: "healthy", weight: 100, connections: 8, cpuUsage: 18, memoryUsage: 32, startedAt: now - 60 * 86400000, lastHeartbeat: now - 3000 },
      ], config: { ...sharedConfig, minInstances: 1, maxInstances: 4 }, status: "healthy", lastHeartbeat: now - 3000, createdAt: now - 60 * 86400000, updatedAt: now - 2 * 86400000,
    },
    {
      id: "svc_media", name: "Media Service", description: "Image and asset upload, optimization, and delivery", version: "1.2.0", protocol: "http", port: 8087,
      healthEndpoint: "/health", dependencies: [], instances: [
        { id: "inst_med_1", serviceId: "svc_media", host: "10.0.1.80", port: 8087, status: "healthy", weight: 100, connections: 22, cpuUsage: 32, memoryUsage: 48, startedAt: now - 50 * 86400000, lastHeartbeat: now - 4000 },
        { id: "inst_med_2", serviceId: "svc_media", host: "10.0.1.81", port: 8087, status: "unhealthy", weight: 0, connections: 0, cpuUsage: 95, memoryUsage: 92, startedAt: now - 50 * 86400000, lastHeartbeat: now - 60000 },
      ], config: { ...sharedConfig, minInstances: 2, maxInstances: 4 }, status: "degraded", lastHeartbeat: now - 4000, createdAt: now - 50 * 86400000, updatedAt: now - 1 * 86400000,
    },
    {
      id: "svc_workflow", name: "Workflow Engine", description: "Workflow automation and background job execution", version: "1.0.0", protocol: "http", port: 8088,
      healthEndpoint: "/health", dependencies: ["svc_notification", "svc_product"], instances: [
        { id: "inst_wf_1", serviceId: "svc_workflow", host: "10.0.1.90", port: 8088, status: "healthy", weight: 100, connections: 5, cpuUsage: 15, memoryUsage: 28, startedAt: now - 30 * 86400000, lastHeartbeat: now - 2000 },
      ], config: { ...sharedConfig, minInstances: 1, maxInstances: 3 }, status: "healthy", lastHeartbeat: now - 2000, createdAt: now - 30 * 86400000, updatedAt: now - 1 * 86400000,
    },
    {
      id: "svc_affiliate", name: "Affiliate Service", description: "Affiliate network integration and commission tracking", version: "1.1.0", protocol: "http", port: 8089,
      healthEndpoint: "/health", dependencies: ["svc_product", "svc_notification"], instances: [
        { id: "inst_aff_1", serviceId: "svc_affiliate", host: "10.0.1.100", port: 8089, status: "healthy", weight: 100, connections: 6, cpuUsage: 20, memoryUsage: 35, startedAt: now - 20 * 86400000, lastHeartbeat: now - 3000 },
      ], config: { ...sharedConfig, minInstances: 1, maxInstances: 3 }, status: "healthy", lastHeartbeat: now - 3000, createdAt: now - 20 * 86400000, updatedAt: now - 1 * 86400000,
    },
  ];

  const dependencies: ServiceDependency[] = [
    { id: "dep_gw_auth", sourceServiceId: "svc_gateway", targetServiceId: "svc_auth", type: "sync", required: true, timeout: 3000, retryCount: 3, circuitBreakerEnabled: true },
    { id: "dep_gw_prod", sourceServiceId: "svc_gateway", targetServiceId: "svc_product", type: "sync", required: true, timeout: 5000, retryCount: 3, circuitBreakerEnabled: true },
    { id: "dep_gw_ord", sourceServiceId: "svc_gateway", targetServiceId: "svc_order", type: "sync", required: true, timeout: 10000, retryCount: 3, circuitBreakerEnabled: true },
    { id: "dep_prod_srch", sourceServiceId: "svc_product", targetServiceId: "svc_search", type: "async", required: false, timeout: 30000, retryCount: 2, circuitBreakerEnabled: false },
    { id: "dep_prod_med", sourceServiceId: "svc_product", targetServiceId: "svc_media", type: "sync", required: false, timeout: 5000, retryCount: 2, circuitBreakerEnabled: true },
    { id: "dep_ord_prod", sourceServiceId: "svc_order", targetServiceId: "svc_product", type: "sync", required: true, timeout: 5000, retryCount: 3, circuitBreakerEnabled: true },
    { id: "dep_ord_pay", sourceServiceId: "svc_order", targetServiceId: "svc_payment", type: "sync", required: true, timeout: 30000, retryCount: 3, circuitBreakerEnabled: true },
    { id: "dep_ord_notif", sourceServiceId: "svc_order", targetServiceId: "svc_notification", type: "async", required: false, timeout: 10000, retryCount: 2, circuitBreakerEnabled: false },
    { id: "dep_wf_notif", sourceServiceId: "svc_workflow", targetServiceId: "svc_notification", type: "async", required: false, timeout: 5000, retryCount: 2, circuitBreakerEnabled: false },
    { id: "dep_aff_prod", sourceServiceId: "svc_affiliate", targetServiceId: "svc_product", type: "sync", required: true, timeout: 5000, retryCount: 2, circuitBreakerEnabled: true },
  ];

  const discovery: ServiceDiscoveryEntry[] = services.flatMap((svc) =>
    svc.instances.map((inst) => ({
      id: `disc_${inst.id}`,
      serviceName: svc.name,
      serviceId: svc.id,
      host: inst.host,
      port: inst.port,
      protocol: svc.protocol,
      healthStatus: inst.status,
      metadata: { region: inst.host.startsWith("10.0.1") ? "us-east-1" : "us-west-2", version: svc.version },
      ttl: 60,
      registeredAt: inst.startedAt,
    }))
  );

  const dnsRecords: DnsRecord[] = [
    { id: "dns_gateway", name: "gateway.alaya.internal", type: "A", value: "10.0.1.10", ttl: 60, serviceId: "svc_gateway" },
    { id: "dns_auth", name: "auth.alaya.internal", type: "A", value: "10.0.1.20", ttl: 60, serviceId: "svc_auth" },
    { id: "dns_product", name: "product.alaya.internal", type: "A", value: "10.0.1.30", ttl: 60, serviceId: "svc_product" },
    { id: "dns_order", name: "order.alaya.internal", type: "A", value: "10.0.1.40", ttl: 60, serviceId: "svc_order" },
    { id: "dns_search", name: "search.alaya.internal", type: "A", value: "10.0.1.60", ttl: 60, serviceId: "svc_search" },
    { id: "dns_srv_gateway", name: "_gateway._tcp.alaya.internal", type: "SRV", value: "0 10 8080 gateway.alaya.internal", ttl: 60 },
  ];

  store.services = services;
  store.dependencies = dependencies;
  store.discovery = discovery;
  store.dnsRecords = dnsRecords;
  saveStore(store);
}

seedMsFabricData();

/* ================================================================== */
/*  SERVICE MANAGEMENT                                                 */
/* ================================================================== */

export function getServices(): Microservice[] {
  return getStore().services;
}

export function getService(id: string): Microservice | undefined {
  return getStore().services.find((s) => s.id === id);
}

export function registerService(input: Omit<Microservice, "id" | "createdAt" | "updatedAt">): Microservice {
  const store = getStore();
  const svc: Microservice = { ...input, id: uid("svc"), createdAt: Date.now(), updatedAt: Date.now() };
  store.services.push(svc);
  saveStore(store);
  return svc;
}

export function updateServiceHealth(serviceId: string, status: ServiceHealth): boolean {
  const store = getStore();
  const svc = store.services.find((s) => s.id === serviceId);
  if (!svc) return false;
  svc.status = status;
  svc.lastHeartbeat = Date.now();
  svc.updatedAt = Date.now();
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  SERVICE DISCOVERY                                                  */
/* ================================================================== */

export function getDiscoveryEntries(): ServiceDiscoveryEntry[] {
  return getStore().discovery;
}

export function discoverService(serviceName: string): ServiceDiscoveryEntry[] {
  return getStore().discovery.filter((e) => e.serviceName.toLowerCase().includes(serviceName.toLowerCase()) && e.healthStatus === "healthy");
}

export function registerInstance(entry: Omit<ServiceDiscoveryEntry, "id" | "registeredAt">): ServiceDiscoveryEntry {
  const store = getStore();
  const disc: ServiceDiscoveryEntry = { ...entry, id: uid("disc"), registeredAt: Date.now() };
  store.discovery.push(disc);
  saveStore(store);
  return disc;
}

/* ================================================================== */
/*  DNS MANAGEMENT                                                     */
/* ================================================================== */

export function getDnsRecords(): DnsRecord[] {
  return getStore().dnsRecords;
}

export function addDnsRecord(input: Omit<DnsRecord, "id">): DnsRecord {
  const store = getStore();
  const rec: DnsRecord = { ...input, id: uid("dns") };
  store.dnsRecords.push(rec);
  saveStore(store);
  return rec;
}

export function removeDnsRecord(id: string): boolean {
  const store = getStore();
  store.dnsRecords = store.dnsRecords.filter((r) => r.id !== id);
  saveStore(store);
  return true;
}

/* ================================================================== */
/*  DEPENDENCIES & TOPOLOGY                                            */
/* ================================================================== */

export function getDependencies(): ServiceDependency[] {
  return getStore().dependencies;
}

export function getServiceGraph(): { nodes: { id: string; name: string; status: ServiceHealth }[]; edges: { source: string; target: string; type: string }[] } {
  const store = getStore();
  return {
    nodes: store.services.map((s) => ({ id: s.id, name: s.name, status: s.status })),
    edges: store.dependencies.map((d) => ({ source: d.sourceServiceId, target: d.targetServiceId, type: d.type })),
  };
}

/* ================================================================== */
/*  HEALTH CHECKS                                                      */
/* ================================================================== */

export function runServiceHealthChecks(): ServiceHealthCheck[] {
  const store = getStore();
  const checks: ServiceHealthCheck[] = store.services.map((svc) => {
    const latencyMs = Math.floor(10 + Math.random() * 200);
    const healthyInstances = svc.instances.filter((i) => i.status === "healthy").length;
    const totalInstances = svc.instances.length;
    const status: ServiceHealth = healthyInstances === totalInstances ? "healthy" : healthyInstances > 0 ? "degraded" : "unhealthy";
    return {
      id: uid("hc"),
      serviceId: svc.id,
      serviceName: svc.name,
      status,
      latencyMs,
      lastChecked: Date.now(),
      error: status === "healthy" ? undefined : `${totalInstances - healthyInstances} instance(s) unhealthy`,
      region: "us-east-1",
    };
  });

  store.healthChecks = checks;
  saveStore(store);
  return checks;
}

export function getHealthChecks(): ServiceHealthCheck[] {
  return getStore().healthChecks;
}

/* ================================================================== */
/*  LOAD BALANCING                                                     */
/* ================================================================== */

export function selectInstance(serviceId: string, strategy?: LoadBalanceStrategy): ServiceInstance | null {
  const svc = getService(serviceId);
  if (!svc) return null;

  const healthy = svc.instances.filter((i) => i.status === "healthy" || i.status === "degraded");
  if (healthy.length === 0) return null;

  const s = strategy || svc.config.loadBalanceStrategy;

  switch (s) {
    case "round_robin": {
      const now = Date.now();
      const idx = Math.floor(now / 10000) % healthy.length;
      return healthy[idx];
    }
    case "least_connections":
      return healthy.reduce((a, b) => a.connections <= b.connections ? a : b);
    case "weighted": {
      const totalWeight = healthy.reduce((s, i) => s + i.weight, 0);
      let r = Math.random() * totalWeight;
      for (const inst of healthy) {
        r -= inst.weight;
        if (r <= 0) return inst;
      }
      return healthy[0];
    }
    case "ip_hash":
    default:
      return healthy[Math.floor(Math.random() * healthy.length)];
  }
}

/* ================================================================== */
/*  INTER-SERVICE AUTHENTICATION                                       */
/* ================================================================== */

export function generateInterServiceToken(serviceId: string): string {
  const svc = getService(serviceId);
  if (!svc) return "";
  const payload = { sub: svc.id, name: svc.name, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 };
  return btoa(JSON.stringify(payload));
}

export function verifyInterServiceToken(token: string): { valid: boolean; serviceId?: string; serviceName?: string } {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp * 1000 < Date.now()) return { valid: false };
    const svc = getService(payload.sub);
    if (!svc) return { valid: false };
    return { valid: true, serviceId: payload.sub, serviceName: payload.name };
  } catch {
    return { valid: false };
  }
}

/* ================================================================== */
/*  MESH POLICIES                                                      */
/* ================================================================== */

export function getMeshPolicies(): ServiceMeshPolicy[] {
  return getStore().meshPolicies;
}

export function createMeshPolicy(input: Omit<ServiceMeshPolicy, "id">): ServiceMeshPolicy {
  const store = getStore();
  const policy: ServiceMeshPolicy = { ...input, id: uid("mesh") };
  store.meshPolicies.push(policy);
  saveStore(store);
  return policy;
}

/* ================================================================== */
/*  STATUS & METRICS SUMMARY                                           */
/* ================================================================== */

export function getFabricSummary() {
  const store = getStore();
  const services = store.services;
  const totalInstances = services.reduce((s, svc) => s + svc.instances.length, 0);
  const healthyInstances = services.reduce((s, svc) => s + svc.instances.filter((i) => i.status === "healthy").length, 0);
  const totalConnections = services.reduce((s, svc) => s + svc.instances.reduce((s2, i) => s2 + i.connections, 0), 0);

  return {
    totalServices: services.length,
    healthyServices: services.filter((s) => s.status === "healthy").length,
    degradedServices: services.filter((s) => s.status === "degraded").length,
    unhealthyServices: services.filter((s) => s.status === "unhealthy").length,
    totalInstances,
    healthyInstances,
    unhealthyInstances: totalInstances - healthyInstances,
    totalConnections,
    totalDependencies: store.dependencies.length,
    totalDnsRecords: store.dnsRecords.length,
    avgCpu: Math.round(services.reduce((s, svc) => s + svc.instances.reduce((s2, i) => s2 + i.cpuUsage, 0) / svc.instances.length, 0) / services.length),
    avgMemory: Math.round(services.reduce((s, svc) => s + svc.instances.reduce((s2, i) => s2 + i.memoryUsage, 0) / svc.instances.length, 0) / services.length),
  };
}
