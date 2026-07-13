/**
 * ALAYA INSIDER — Communication React Context
 * Bridges the communications engine to the React admin UI.
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
  getNotifications, sendNotification, retryNotification, cancelNotification,
  getTemplates, createTemplate, updateTemplate, deleteTemplate, renderTemplate,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getEmailProviders, updateEmailProvider, sendEmail,
  sendSms, sendPush, getPushNotifications,
  getInAppNotifications, createInAppNotification, markInAppRead, markAllInAppRead, dismissInApp,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getSystemAlerts, createSystemAlert, acknowledgeAlert, resolveAlert,
  getChannelIntegrations, updateChannelIntegration,
  getPreferences, upsertPreference, unsubscribe,
  getCommsAnalytics, getChannelAnalytics, getProviderAnalytics,
  getInternalMessages, sendInternalMessage, markInternalMessageRead,
  getPresenceStates, updatePresence,
  type Notification, type NotificationTemplate,
  type Campaign, type EmailProviderConfig,
  type PushNotification, type InAppInbox,
  type Announcement, type SystemAlert,
  type ChannelIntegration, type CommunicationPreference,
  type CommsAnalytics, type ChannelAnalytics, type ProviderAnalytics,
  type InAppNotification, type InternalMessage, type PresenceState,
} from "../lib/communications";

interface CommunicationContextValue {
  /* Core */
  notifications: Notification[];
  refresh: () => void;
  sendNotif: (input: Parameters<typeof sendNotification>[0]) => Notification;
  retryNotif: (id: string) => boolean;
  cancelNotif: (id: string) => boolean;

  /* Templates */
  templates: NotificationTemplate[];
  createTpl: (input: Parameters<typeof createTemplate>[0]) => NotificationTemplate;
  updateTpl: (id: string, patch: Partial<NotificationTemplate>) => NotificationTemplate | null;
  deleteTpl: (id: string) => boolean;
  renderTpl: (templateId: string, variables: Record<string, string>) => ReturnType<typeof renderTemplate>;
  getInternalMessages: () => InternalMessage[];

  /* Campaigns */
  campaigns: Campaign[];
  createCamp: (input: Parameters<typeof createCampaign>[0]) => Campaign;
  updateCamp: (id: string, patch: Partial<Campaign>) => Campaign | null;
  deleteCamp: (id: string) => boolean;

  /* Email */
  emailProviders: EmailProviderConfig[];
  updateEmailProv: (id: string, patch: Partial<EmailProviderConfig>) => EmailProviderConfig | null;
  sendEmailMsg: (input: { to: string; subject: string; body: string; htmlBody?: string; templateId?: string; tracking?: boolean }) => Notification;

  /* SMS */
  sendSmsMsg: (input: { to: string; body: string }) => Notification;

  /* Push */
  sendPushMsg: (input: { userId?: string; title: string; body: string; icon?: string; image?: string; data?: Record<string, string> }) => Notification;
  pushNotifications: PushNotification[];

  /* In-App */
  inbox: InAppInbox;
  createInApp: (input: Parameters<typeof createInAppNotification>[0]) => InAppNotification;
  markRead: (id: string) => boolean;
  markAllRead: (userId: string) => boolean;
  dismissNotif: (id: string) => boolean;

  /* Announcements */
  announcements: Announcement[];
  createAnn: (input: Parameters<typeof createAnnouncement>[0]) => Announcement;
  updateAnn: (id: string, patch: Partial<Announcement>) => Announcement | null;
  deleteAnn: (id: string) => boolean;

  /* System Alerts */
  systemAlerts: SystemAlert[];
  createAlert: (input: Parameters<typeof createSystemAlert>[0]) => SystemAlert;
  ackAlert: (id: string, userId: string) => boolean;
  resolveAlertById: (id: string) => boolean;

  /* Channel Integrations */
  channelIntegrations: ChannelIntegration[];
  updateChannel: (id: string, patch: Partial<ChannelIntegration>) => ChannelIntegration | null;

  /* Preferences */
  preferences: CommunicationPreference[];
  upsertPref: (pref: CommunicationPreference) => CommunicationPreference;
  unsubscribeUser: (userId: string) => boolean;

  /* Analytics */
  analytics: CommsAnalytics;
  channelAnalytics: ChannelAnalytics[];
  providerAnalytics: ProviderAnalytics[];

  /* Internal Messaging */
  internalMessages: InternalMessage[];
  sendInternal: (input: Parameters<typeof sendInternalMessage>[0]) => InternalMessage;
  markMsgRead: (id: string) => boolean;

  /* Presence */
  presenceStates: PresenceState[];
  updateUserPresence: (userId: string, status: PresenceState["status"], device: string, sessionId: string) => PresenceState;
}

const CommunicationContext = createContext<CommunicationContextValue | null>(null);

export function useCommunications() {
  const ctx = useContext(CommunicationContext);
  if (!ctx) throw new Error("useCommunications must be used within <CommunicationProvider>");
  return ctx;
}

export function CommunicationProvider({ children }: { children: ReactNode }) {
  const [, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const [notifications, setNotifications] = useState(() => getNotifications());
  const [templates, setTemplates] = useState(() => getTemplates());
  const [campaigns, setCampaigns] = useState(() => getCampaigns());
  const [emailProviders, setEmailProviders] = useState(() => getEmailProviders());
  const [pushNotifications, setPushNotifications] = useState(() => getPushNotifications());
  const [inbox, setInbox] = useState(() => getInAppNotifications());
  const [announcements, setAnnouncements] = useState(() => getAnnouncements());
  const [systemAlerts, setSystemAlerts] = useState(() => getSystemAlerts());
  const [channelIntegrations, setChannelIntegrations] = useState(() => getChannelIntegrations());
  const [preferences, setPreferences] = useState(() => getPreferences());
  const [analytics, setAnalytics] = useState(() => getCommsAnalytics());
  const [channelAnalytics, setChannelAnalytics] = useState(() => getChannelAnalytics());
  const [providerAnalytics, setProviderAnalytics] = useState(() => getProviderAnalytics());
  const [internalMessages, setInternalMessagesState] = useState<InternalMessage[]>(() => getInternalMessages());
  const [presenceStates, setPresenceStates] = useState(() => getPresenceStates());

  const doRefresh = useCallback(() => {
    setNotifications(getNotifications());
    setTemplates(getTemplates());
    setCampaigns(getCampaigns());
    setEmailProviders(getEmailProviders());
    setPushNotifications(getPushNotifications());
    setInbox(getInAppNotifications());
    setAnnouncements(getAnnouncements());
    setSystemAlerts(getSystemAlerts());
    setChannelIntegrations(getChannelIntegrations());
    setPreferences(getPreferences());
    setAnalytics(getCommsAnalytics());
    setChannelAnalytics(getChannelAnalytics());
    setProviderAnalytics(getProviderAnalytics());
    setInternalMessagesState(getInternalMessages());
    setPresenceStates(getPresenceStates());
    refresh();
  }, [refresh]);

  /* -- Core -- */
  const sendNotif = useCallback((input: Parameters<typeof sendNotification>[0]) => {
    const n = sendNotification(input); doRefresh(); return n;
  }, [doRefresh]);

  const retryNotif = useCallback((id: string) => {
    const r = retryNotification(id); doRefresh(); return r;
  }, [doRefresh]);

  const cancelNotif = useCallback((id: string) => {
    const r = cancelNotification(id); doRefresh(); return r;
  }, [doRefresh]);

  /* -- Templates -- */
  const createTpl = useCallback((input: Parameters<typeof createTemplate>[0]) => {
    const t = createTemplate(input); doRefresh(); return t;
  }, [doRefresh]);

  const updateTpl = useCallback((id: string, patch: Partial<NotificationTemplate>) => {
    const t = updateTemplate(id, patch); doRefresh(); return t;
  }, [doRefresh]);

  const deleteTpl = useCallback((id: string) => {
    const r = deleteTemplate(id); doRefresh(); return r;
  }, [doRefresh]);

  const renderTpl = useCallback((templateId: string, variables: Record<string, string>) => {
    return renderTemplate(templateId, variables);
  }, []);

  /* -- Campaigns -- */
  const createCamp = useCallback((input: Parameters<typeof createCampaign>[0]) => {
    const c = createCampaign(input); doRefresh(); return c;
  }, [doRefresh]);

  const updateCamp = useCallback((id: string, patch: Partial<Campaign>) => {
    const c = updateCampaign(id, patch); doRefresh(); return c;
  }, [doRefresh]);

  const deleteCamp = useCallback((id: string) => {
    const r = deleteCampaign(id); doRefresh(); return r;
  }, [doRefresh]);

  /* -- Email -- */
  const updateEmailProv = useCallback((id: string, patch: Partial<EmailProviderConfig>) => {
    const r = updateEmailProvider(id, patch); doRefresh(); return r;
  }, [doRefresh]);

  const sendEmailMsg = useCallback((input: { to: string; subject: string; body: string; htmlBody?: string; templateId?: string; tracking?: boolean }) => {
    const n = sendEmail(input); doRefresh(); return n;
  }, [doRefresh]);

  /* -- SMS -- */
  const sendSmsMsg = useCallback((input: { to: string; body: string }) => {
    const n = sendSms(input); doRefresh(); return n;
  }, [doRefresh]);

  /* -- Push -- */
  const sendPushMsg = useCallback((input: { userId?: string; title: string; body: string; icon?: string; image?: string; data?: Record<string, string> }) => {
    const n = sendPush(input); doRefresh(); return n;
  }, [doRefresh]);

  /* -- In-App -- */
  const createInApp = useCallback((input: Parameters<typeof createInAppNotification>[0]) => {
    const n = createInAppNotification(input); doRefresh(); return n;
  }, [doRefresh]);

  const markRead = useCallback((id: string) => {
    const r = markInAppRead(id); doRefresh(); return r;
  }, [doRefresh]);

  const markAllRead = useCallback((userId: string) => {
    const r = markAllInAppRead(userId); doRefresh(); return r;
  }, [doRefresh]);

  const dismissNotif = useCallback((id: string) => {
    const r = dismissInApp(id); doRefresh(); return r;
  }, [doRefresh]);

  /* -- Announcements -- */
  const createAnn = useCallback((input: Parameters<typeof createAnnouncement>[0]) => {
    const a = createAnnouncement(input); doRefresh(); return a;
  }, [doRefresh]);

  const updateAnn = useCallback((id: string, patch: Partial<Announcement>) => {
    const a = updateAnnouncement(id, patch); doRefresh(); return a;
  }, [doRefresh]);

  const deleteAnn = useCallback((id: string) => {
    const r = deleteAnnouncement(id); doRefresh(); return r;
  }, [doRefresh]);

  /* -- System Alerts -- */
  const createAlert = useCallback((input: Parameters<typeof createSystemAlert>[0]) => {
    const a = createSystemAlert(input); doRefresh(); return a;
  }, [doRefresh]);

  const ackAlert = useCallback((id: string, userId: string) => {
    const r = acknowledgeAlert(id, userId); doRefresh(); return r;
  }, [doRefresh]);

  const resolveAlertById = useCallback((id: string) => {
    const r = resolveAlert(id); doRefresh(); return r;
  }, [doRefresh]);

  /* -- Channel Integrations -- */
  const updateChannel = useCallback((id: string, patch: Partial<ChannelIntegration>) => {
    const r = updateChannelIntegration(id, patch); doRefresh(); return r;
  }, [doRefresh]);

  /* -- Preferences -- */
  const upsertPref = useCallback((pref: CommunicationPreference) => {
    const r = upsertPreference(pref); doRefresh(); return r;
  }, [doRefresh]);

  const unsubscribeUser = useCallback((userId: string) => {
    const r = unsubscribe(userId); doRefresh(); return r;
  }, [doRefresh]);

  /* -- Internal Messaging -- */
  const sendInternal = useCallback((input: Parameters<typeof sendInternalMessage>[0]) => {
    const m = sendInternalMessage(input); doRefresh(); return m;
  }, [doRefresh]);

  const markMsgRead = useCallback((id: string) => {
    const r = markInternalMessageRead(id); doRefresh(); return r;
  }, [doRefresh]);

  /* -- Presence -- */
  const updateUserPresence = useCallback((userId: string, status: PresenceState["status"], device: string, sessionId: string) => {
    const r = updatePresence(userId, status, device, sessionId); doRefresh(); return r;
  }, [doRefresh]);

  const value = useMemo<CommunicationContextValue>(() => ({
    notifications, refresh: doRefresh,
    sendNotif, retryNotif, cancelNotif,
    getInternalMessages: () => getInternalMessages(),
    templates, createTpl, updateTpl, deleteTpl, renderTpl,
    campaigns, createCamp, updateCamp, deleteCamp,
    emailProviders, updateEmailProv, sendEmailMsg,
    sendSmsMsg, sendPushMsg, pushNotifications,
    inbox, createInApp, markRead, markAllRead, dismissNotif,
    announcements, createAnn, updateAnn, deleteAnn,
    systemAlerts, createAlert, ackAlert, resolveAlertById,
    channelIntegrations, updateChannel,
    preferences, upsertPref, unsubscribeUser,
    analytics, channelAnalytics, providerAnalytics,
    internalMessages, sendInternal, markMsgRead,
    presenceStates, updateUserPresence,
  }), [
    notifications, templates, campaigns, emailProviders, pushNotifications,
    inbox, announcements, systemAlerts, channelIntegrations, preferences,
    analytics, channelAnalytics, providerAnalytics, internalMessages, presenceStates,
    doRefresh, sendNotif, retryNotif, cancelNotif,
    createTpl, updateTpl, deleteTpl, renderTpl,
    createCamp, updateCamp, deleteCamp,
    updateEmailProv, sendEmailMsg,
    sendSmsMsg, sendPushMsg,
    createInApp, markRead, markAllRead, dismissNotif,
    createAnn, updateAnn, deleteAnn,
    createAlert, ackAlert, resolveAlertById,
    updateChannel, upsertPref, unsubscribeUser,
    sendInternal, markMsgRead, updateUserPresence,
  ]);

  return <CommunicationContext.Provider value={value}>{children}</CommunicationContext.Provider>;
}
