/**
 * ALAYA INSIDER — Gateway React Context
 * Bridges the gateway, integrations, and microservices engines to React UI.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getEndpoints, getInternalApis, getVersions,
  getGatewayAnalytics, getGatewayEvents,
  getWebhooks, createWebhook, updateWebhook, deleteWebhook,
  getWebhookDeliveries, getWebhookStats, deliverWebhook, replayWebhook,
  registerEndpoint, updateEndpoint, deprecateEndpoint, sunsetEndpoint,
  type ApiEndpoint, type InternalApi, type ApiVersion,
  type GatewayAnalytics, type GatewayEvent,
  type WebhookEndpoint, type WebhookDelivery, type WebhookStats,
} from "../lib/gateway";
import {
  getConnectors, getConnectorInstances,
  installConnector, uninstallConnector, updateConnectorInstance,
  getIntegrationFlows, createIntegrationFlow, toggleFlow, deleteFlow,
  getQueueMessages, getSdkPackages,
  type ConnectorProvider, type ConnectorInstance,
  type IntegrationFlow, type QueueMessage, type ConnectorSdkPackage,
} from "../lib/integrations";
import {
  getServices, getDiscoveryEntries, getDnsRecords,
  getDependencies, getServiceGraph,
  runServiceHealthChecks,
  getFabricSummary, selectInstance,
  type Microservice, type ServiceDiscoveryEntry, type DnsRecord,
  type ServiceDependency, type ServiceHealthCheck,
} from "../lib/microservices";

/* ================================================================== */
/*  CONTEXT DEFINITION                                                  */
/* ================================================================== */

interface GatewayContextValue {
  /* API Gateway */
  endpoints: ApiEndpoint[];
  internalApis: InternalApi[];
  versions: ApiVersion[];
  analytics: GatewayAnalytics;
  gatewayEvents: GatewayEvent[];
  refresh: () => void;
  registerNewEndpoint: (input: Omit<ApiEndpoint, "id" | "createdAt" | "updatedAt">) => ApiEndpoint;
  editEndpoint: (id: string, patch: Partial<ApiEndpoint>) => ApiEndpoint | null;
  deprecate: (id: string, replacementId?: string) => boolean;
  sunset: (id: string) => boolean;

  /* Webhooks */
  webhooks: WebhookEndpoint[];
  deliveries: WebhookDelivery[];
  webhookStats: WebhookStats;
  createWh: (input: Omit<WebhookEndpoint, "id" | "createdAt" | "updatedAt">) => WebhookEndpoint;
  updateWh: (id: string, patch: Partial<WebhookEndpoint>) => WebhookEndpoint | null;
  deleteWh: (id: string) => boolean;
  deliverEvent: (webhookId: string, event: string, payload: string) => WebhookDelivery | null;
  replayDelivery: (deliveryId: string) => WebhookDelivery | null;

  /* Integrations */
  connectors: ConnectorProvider[];
  connectorInstances: ConnectorInstance[];
  installConn: (providerId: string, name: string, config: Record<string, string>) => ConnectorInstance | null;
  uninstallConn: (instanceId: string) => boolean;
  updateConnector: (id: string, patch: Partial<ConnectorInstance>) => ConnectorInstance | null;
  flows: IntegrationFlow[];
  createFlow: (input: Omit<IntegrationFlow, "id" | "runCount">) => IntegrationFlow;
  toggleFlowById: (id: string) => boolean;
  removeFlow: (id: string) => boolean;
  queueMessages: QueueMessage[];
  sdkPackages: ConnectorSdkPackage[];

  /* Microservices */
  services: Microservice[];
  serviceGraph: { nodes: { id: string; name: string; status: string }[]; edges: { source: string; target: string; type: string }[] };
  discoveryEntries: ServiceDiscoveryEntry[];
  dnsRecords: DnsRecord[];
  dependencies: ServiceDependency[];
  healthChecks: ServiceHealthCheck[];
  fabricSummary: ReturnType<typeof getFabricSummary>;
  runHealthChecks: () => ServiceHealthCheck[];
  selectServiceInstance: (serviceId: string) => any;
}

const GatewayContext = createContext<GatewayContextValue | null>(null);

export function useGateway() {
  const ctx = useContext(GatewayContext);
  if (!ctx) throw new Error("useGateway must be used within <GatewayProvider>");
  return ctx;
}

/* ================================================================== */
/*  PROVIDER                                                           */
/* ================================================================== */

export function GatewayProvider({ children }: { children: ReactNode }) {
  const [, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(() => getEndpoints());
  const [internalApis, setInternalApis] = useState<InternalApi[]>(() => getInternalApis());
  const [versions, setVersions] = useState<ApiVersion[]>(() => getVersions());
  const [analytics, setAnalytics] = useState(() => getGatewayAnalytics());
  const [gatewayEvents, setGatewayEvents] = useState<GatewayEvent[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(() => getWebhooks());
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [webhookStats, setWebhookStats] = useState(() => getWebhookStats());
  const [connectors, setConnectors] = useState(() => getConnectors());
  const [connectorInstances, setConnectorInstances] = useState(() => getConnectorInstances());
  const [flows, setFlows] = useState(() => getIntegrationFlows());
  const [queueMessages, setQueueMessages] = useState<QueueMessage[]>([]);
  const [sdkPackages] = useState(() => getSdkPackages());
  const [services, setServices] = useState(() => getServices());
  const [serviceGraph, setServiceGraph] = useState(() => getServiceGraph());
  const [discoveryEntries, setDiscoveryEntries] = useState(() => getDiscoveryEntries());
  const [dnsRecords, setDnsRecords] = useState(() => getDnsRecords());
  const [dependencies, setDependencies] = useState(() => getDependencies());
  const [healthChecks, setHealthChecks] = useState<ServiceHealthCheck[]>([]);
  const [fabricSummary, setFabricSummary] = useState(() => getFabricSummary());

  const doRefresh = useCallback(() => {
    setEndpoints(getEndpoints());
    setInternalApis(getInternalApis());
    setVersions(getVersions());
    setAnalytics(getGatewayAnalytics());
    setWebhooks(getWebhooks());
    setWebhookStats(getWebhookStats());
    setConnectors(getConnectors());
    setConnectorInstances(getConnectorInstances());
    setFlows(getIntegrationFlows());
    setServices(getServices());
    setServiceGraph(getServiceGraph());
    setDiscoveryEntries(getDiscoveryEntries());
    setDnsRecords(getDnsRecords());
    setDependencies(getDependencies());
    setFabricSummary(getFabricSummary());
    setGatewayEvents(getGatewayEvents());
    setDeliveries(getWebhookDeliveries());
    setQueueMessages(getQueueMessages());
    refresh();
  }, [refresh]);

  /* ================================================================ */
  /*  API GATEWAY ACTIONS                                              */
  /* ================================================================ */

  const registerNewEndpoint = useCallback((input: Omit<ApiEndpoint, "id" | "createdAt" | "updatedAt">) => {
    const ep = registerEndpoint(input);
    doRefresh();
    return ep;
  }, [doRefresh]);

  const editEndpoint = useCallback((id: string, patch: Partial<ApiEndpoint>) => {
    const ep = updateEndpoint(id, patch);
    doRefresh();
    return ep;
  }, [doRefresh]);

  const deprecate = useCallback((id: string, replacementId?: string) => {
    const result = deprecateEndpoint(id, replacementId);
    doRefresh();
    return result;
  }, [doRefresh]);

  const sunset = useCallback((id: string) => {
    const result = sunsetEndpoint(id);
    doRefresh();
    return result;
  }, [doRefresh]);

  /* ================================================================ */
  /*  WEBHOOK ACTIONS                                                  */
  /* ================================================================ */

  const createWh = useCallback((input: Omit<WebhookEndpoint, "id" | "createdAt" | "updatedAt">) => {
    const wh = createWebhook(input);
    doRefresh();
    return wh;
  }, [doRefresh]);

  const updateWh = useCallback((id: string, patch: Partial<WebhookEndpoint>) => {
    const wh = updateWebhook(id, patch);
    doRefresh();
    return wh;
  }, [doRefresh]);

  const deleteWh = useCallback((id: string) => {
    const result = deleteWebhook(id);
    doRefresh();
    return result;
  }, [doRefresh]);

  const deliverEvent = useCallback((webhookId: string, event: string, payload: string) => {
    const result = deliverWebhook(webhookId, event as import("../lib/gateway").WebhookEvent, payload);
    doRefresh();
    return result;
  }, [doRefresh]);

  const replayDelivery = useCallback((deliveryId: string) => {
    const result = replayWebhook(deliveryId);
    doRefresh();
    return result;
  }, [doRefresh]);

  /* ================================================================ */
  /*  INTEGRATION ACTIONS                                              */
  /* ================================================================ */

  const installConn = useCallback((providerId: string, name: string, config: Record<string, string>) => {
    const result = installConnector(providerId, name, config);
    doRefresh();
    return result;
  }, [doRefresh]);

  const uninstallConn = useCallback((instanceId: string) => {
    const result = uninstallConnector(instanceId);
    doRefresh();
    return result;
  }, [doRefresh]);

  const updateConnector = useCallback((id: string, patch: Partial<ConnectorInstance>) => {
    const result = updateConnectorInstance(id, patch);
    doRefresh();
    return result;
  }, [doRefresh]);

  const createFlow = useCallback((input: Omit<IntegrationFlow, "id" | "runCount">) => {
    const flow = createIntegrationFlow(input);
    doRefresh();
    return flow;
  }, [doRefresh]);

  const toggleFlowById = useCallback((id: string) => {
    const result = toggleFlow(id);
    doRefresh();
    return result;
  }, [doRefresh]);

  const removeFlow = useCallback((id: string) => {
    const result = deleteFlow(id);
    doRefresh();
    return result;
  }, [doRefresh]);

  /* ================================================================ */
  /*  MICROSERVICES ACTIONS                                            */
  /* ================================================================ */

  const runHealthChecks = useCallback(() => {
    const checks = runServiceHealthChecks();
    setHealthChecks(checks);
    return checks;
  }, []);

  const selectServiceInstance = useCallback((serviceId: string) => {
    return selectInstance(serviceId);
  }, []);

  /* ================================================================ */
  /*  CONTEXT VALUE                                                    */
  /* ================================================================ */

  const value = useMemo<GatewayContextValue>(() => ({
    endpoints, internalApis, versions, analytics, gatewayEvents,
    refresh: doRefresh,
    registerNewEndpoint, editEndpoint, deprecate, sunset,
    webhooks, deliveries, webhookStats,
    createWh, updateWh, deleteWh, deliverEvent, replayDelivery,
    connectors, connectorInstances, installConn, uninstallConn, updateConnector,
    flows, createFlow, toggleFlowById, removeFlow,
    queueMessages, sdkPackages,
    services, serviceGraph, discoveryEntries, dnsRecords,
    dependencies, healthChecks, fabricSummary,
    runHealthChecks, selectServiceInstance,
  }), [
    endpoints, internalApis, versions, analytics, gatewayEvents,
    doRefresh, registerNewEndpoint, editEndpoint, deprecate, sunset,
    webhooks, deliveries, webhookStats,
    createWh, updateWh, deleteWh, deliverEvent, replayDelivery,
    connectors, connectorInstances, installConn, uninstallConn, updateConnector,
    flows, createFlow, toggleFlowById, removeFlow,
    queueMessages, sdkPackages,
    services, serviceGraph, discoveryEntries, dnsRecords,
    dependencies, healthChecks, fabricSummary,
    runHealthChecks, selectServiceInstance,
  ]);

  return <GatewayContext.Provider value={value}>{children}</GatewayContext.Provider>;
}
