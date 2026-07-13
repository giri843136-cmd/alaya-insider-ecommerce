/**
 * ALAYA INSIDER — Notification Dispatch Service
 * --------------------------------------------------------------------------
 * Routes push notifications through the configured provider (FCM, OneSignal,
 * or Pusher) using credentials stored in the Integrations Center.
 *
 * The service reads the active notification provider's configuration from the
 * encrypted integrations store, then dispatches the notification via the
 * appropriate provider's REST API.
 */

import { getIntegrations, decrypt } from "./integrations.js";
import type { IntegrationConfig } from "./integrations.js";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type NotificationProvider = "firebase" | "onesignal" | "pusher";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  targetTokens?: string[];
  targetSegments?: string[];
  targetChannels?: string[];
  icon?: string;
  url?: string;
}

export interface NotificationResult {
  success: boolean;
  provider: NotificationProvider;
  recipients?: number;
  messageId?: string;
  error?: string;
}

/* ================================================================== */
/*  PROVIDER LOOKUP                                                    */
/* ================================================================== */

/**
 * Read decrypted settings for a notification provider from the integrations store.
 */
async function getProviderSettings(provider: NotificationProvider): Promise<Record<string, string> | null> {
  const allIntegrations = await getIntegrations();
  const config = allIntegrations.find(
    (i: IntegrationConfig) => i.module === "notifications" && i.provider === provider
  );
  if (!config || !config.enabled) return null;

  // Decrypt the stored settings
  const settings: Record<string, string> = {};
  if (config.settings) {
    for (const [key, value] of Object.entries(config.settings)) {
      try {
        settings[key] = decrypt(value);
      } catch {
        settings[key] = value;
      }
    }
  }
  return settings;
}

/* ================================================================== */
/*  FIREBASE CLOUD MESSAGING                                           */
/* ================================================================== */

async function sendFCM(
  payload: NotificationPayload,
  settings: Record<string, string>,
): Promise<NotificationResult> {
  const serverKey = settings.server_key || settings.serverKey || "";
  if (!serverKey) {
    return { success: false, provider: "firebase", error: "FCM server key not configured" };
  }

  try {
    const message: Record<string, any> = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    };

    if (payload.targetTokens && payload.targetTokens.length > 0) {
      const results: NotificationResult[] = [];
      for (const token of payload.targetTokens) {
        const res = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Authorization": `key=${serverKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: token,
            notification: message.notification,
            data: message.data,
            ...(payload.icon ? { icon: payload.icon } : {}),
          }),
        });
        const data: any = await res.json();
        results.push({
          success: res.ok,
          provider: "firebase",
          messageId: data.message_id || data.canonical_ids?.[0] || undefined,
          recipients: 1,
          error: data.error || undefined,
        });
      }
      const succeeded = results.filter((r) => r.success).length;
      return {
        success: succeeded > 0,
        provider: "firebase",
        recipients: succeeded,
        messageId: results.find((r) => r.messageId)?.messageId,
        error: succeeded === 0 ? results[0]?.error : undefined,
      };
    }

    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: "/topics/all",
        notification: message.notification,
        data: message.data,
      }),
    });
    const data: any = await res.json();
    return {
      success: res.ok,
      provider: "firebase",
      messageId: data.message_id || undefined,
      recipients: data.success || 0,
      error: data.error || undefined,
    };
  } catch (error: any) {
    return { success: false, provider: "firebase", error: error.message };
  }
}

/* ================================================================== */
/*  ONESIGNAL                                                          */
/* ================================================================== */

async function sendOneSignal(
  payload: NotificationPayload,
  settings: Record<string, string>,
): Promise<NotificationResult> {
  const appId = settings.app_id || settings.appId || "";
  const apiKey = settings.rest_api_key || settings.restApiKey || "";
  if (!appId || !apiKey) {
    return { success: false, provider: "onesignal", error: "OneSignal credentials not configured" };
  }

  try {
    const body: Record<string, any> = {
      app_id: appId,
      headings: { en: payload.title },
      contents: { en: payload.body },
      data: payload.data || {},
    };

    if (payload.targetTokens && payload.targetTokens.length > 0) {
      body.include_player_ids = payload.targetTokens;
    } else if (payload.targetSegments && payload.targetSegments.length > 0) {
      body.included_segments = payload.targetSegments;
    } else {
      body.included_segments = ["All"];
    }

    if (payload.url) body.url = payload.url;
    if (payload.icon) body.chrome_web_icon = payload.icon;

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data: any = await res.json();
    return {
      success: res.ok,
      provider: "onesignal",
      messageId: data.id || undefined,
      recipients: data.recipients || 0,
      error: data.errors?.[0] || data.error || undefined,
    };
  } catch (error: any) {
    return { success: false, provider: "onesignal", error: error.message };
  }
}

/* ================================================================== */
/*  PUSHER                                                             */
/* ================================================================== */

async function sendPusher(
  payload: NotificationPayload,
  settings: Record<string, string>,
): Promise<NotificationResult> {
  const appId = settings.app_id || settings.appId || "";
  const key = settings.key || "";
  const secret = settings.secret || "";
  const cluster = settings.cluster || "us2";
  if (!appId || !key || !secret) {
    return { success: false, provider: "pusher", error: "Pusher credentials not configured" };
  }

  try {
    const channels = payload.targetChannels && payload.targetChannels.length > 0
      ? payload.targetChannels
      : ["alaya-notifications"];

    const results: NotificationResult[] = [];
    for (const channel of channels) {
      const pushBody = JSON.stringify({
        name: "notification",
        channel,
        data: JSON.stringify({
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          url: payload.url,
          icon: payload.icon,
        }),
      });

      const { createHash, createHmac } = await import("node:crypto");
      const md5 = createHash("md5").update(pushBody).digest("hex");
      const signatureString = `POST\n/apps/${appId}/events\n${md5}`;
      const authSignature = createHmac("sha256", secret)
        .update(signatureString)
        .digest("hex");

      const res = await fetch(`https://api-${cluster}.pusher.com/apps/${appId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Pusher-Key": key,
          "X-Pusher-Signature": authSignature,
        },
        body: pushBody,
      });
      const data: any = await res.json();
      results.push({
        success: res.ok,
        provider: "pusher",
        error: res.ok ? undefined : (data.error || `Pusher returned ${res.status}`),
      });
    }

    const succeeded = results.filter((r) => r.success).length;
    return {
      success: succeeded > 0,
      provider: "pusher",
      recipients: succeeded,
      error: succeeded === 0 ? results[0]?.error : undefined,
    };
  } catch (error: any) {
    return { success: false, provider: "pusher", error: error.message };
  }
}

/* ================================================================== */
/*  PUBLIC API                                                         */
/* ================================================================== */

/**
 * Send a push notification through the configured provider.
 *
 * @param provider - Which notifications provider to use
 * @param payload  - Notification content and targeting info
 */
export async function sendNotification(
  provider: NotificationProvider,
  payload: NotificationPayload,
): Promise<NotificationResult> {
  const settings = await getProviderSettings(provider);
  if (!settings) {
    return {
      success: false,
      provider,
      error: `Notification provider "${provider}" is not configured or not enabled. Go to Integrations Center → Notifications → ${provider} to set it up.`,
    };
  }

  switch (provider) {
    case "firebase":
      return sendFCM(payload, settings);
    case "onesignal":
      return sendOneSignal(payload, settings);
    case "pusher":
      return sendPusher(payload, settings);
    default:
      return { success: false, provider, error: `Unknown notification provider: ${provider}` };
  }
}

/**
 * Send a notification through the *first enabled* notification provider.
 */
export async function sendViaAnyProvider(
  payload: NotificationPayload,
): Promise<NotificationResult> {
  const providers: NotificationProvider[] = ["firebase", "onesignal", "pusher"];
  for (const provider of providers) {
    const result = await sendNotification(provider, payload);
    if (result.success) return result;
  }
  return {
    success: false,
    provider: "firebase",
    error: "No notification provider is configured and enabled. Go to Integrations Center → Notifications to configure one.",
  };
}

/**
 * Check if a notification provider is configured and operational.
 */
export async function checkNotificationProvider(
  provider: NotificationProvider,
): Promise<{ configured: boolean; message: string }> {
  const settings = await getProviderSettings(provider);
  if (!settings) {
    return { configured: false, message: `Provider "${provider}" is not configured in Integrations Center.` };
  }

  switch (provider) {
    case "firebase":
      return {
        configured: !!settings.server_key || !!settings.serverKey,
        message: (settings.server_key || settings.serverKey)
          ? "FCM server key is configured"
          : "FCM server key is missing",
      };
    case "onesignal":
      return {
        configured: !!settings.app_id && !!settings.rest_api_key,
        message: (settings.app_id && settings.rest_api_key)
          ? "OneSignal app ID and REST API key are configured"
          : "OneSignal credentials are incomplete",
      };
    case "pusher":
      return {
        configured: !!settings.app_id && !!settings.key && !!settings.secret,
        message: (settings.app_id && settings.key && settings.secret)
          ? "Pusher credentials are configured"
          : "Pusher credentials are incomplete",
      };
    default:
      return { configured: false, message: `Unknown provider: ${provider}` };
  }
}
