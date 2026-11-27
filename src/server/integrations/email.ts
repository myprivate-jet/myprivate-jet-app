import "server-only";
import { integrations } from "./config";

/** Transactional email via Resend. Without a key, messages are logged and marked queued. */
export async function sendEmail(msg: { to: string; subject: string; text: string; replyTo?: string }): Promise<"sent" | "queued"> {
  if (!integrations.email) {
    console.info(`[email:simulated] to=${msg.to.replace(/(.).*@/, "$1•••@")} subject="${msg.subject}"`);
    return "queued";
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [msg.to], subject: msg.subject, text: msg.text, reply_to: msg.replyTo }),
  });
  if (!res.ok) throw new Error(`Email failed: ${res.status}`);
  return "sent";
}
