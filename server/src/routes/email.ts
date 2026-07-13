/**
 * ALAYA INSIDER — Email Routes
 * --------------------------------------------------------------------------
 * Endpoints for sending transactional emails via the Bird API.
 */

import { Hono } from "hono";
import { sendEmail } from "../services/email.js";

const email = new Hono();

/* ================================================================== */
/*  SEND TRANSACTIONAL EMAIL                                           */
/* ================================================================== */

email.post("/email/send", async (c) => {
  const { to, subject, htmlBody, textBody, from } = await c.req.json<{
    to: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    from?: string;
  }>();

  if (!to || !subject || !htmlBody) {
    return c.json(
      { code: "VALIDATION_ERROR", message: "to, subject, and htmlBody are required" },
      400,
    );
  }

  const result = await sendEmail(to, subject, htmlBody, textBody, from);

  return c.json(
    {
      success: result.success,
      status: result.status,
      messageId: result.messageId,
      ...(result.error ? { error: result.error } : {}),
    },
    result.success ? 200 : 500,
  );
});

export { email };
