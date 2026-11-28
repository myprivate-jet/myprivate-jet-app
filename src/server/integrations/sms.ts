import "server-only";
import { integrations, simulationsAllowed } from "./config";

/**
 * Mobile verification through Twilio Verify (codes are generated, sent and
 * checked by Twilio; we never store them). Without Twilio keys, a simulation
 * accepts any 6 digits, outside production only.
 */
export interface SmsVerifier {
  readonly simulated: boolean;
  start(phoneE164: string, locale?: string): Promise<void>;
  check(phoneE164: string, code: string): Promise<boolean>;
}

const twilio: SmsVerifier = {
  simulated: false,
  async start(phone, locale = "en") {
    await call("Verifications", { To: phone, Channel: "sms", Locale: locale });
  },
  async check(phone, code) {
    const r = await call("VerificationCheck", { To: phone, Code: code });
    return r.status === "approved";
  },
};

async function call(path: string, body: Record<string, string>) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const service = process.env.TWILIO_VERIFY_SERVICE_SID!;
  const res = await fetch(`https://verify.twilio.com/v2/Services/${service}/${path}`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok && res.status !== 404) throw new Error(`Twilio Verify ${path} failed: ${res.status}`);
  return res.status === 404 ? { status: "expired" } : ((await res.json()) as { status: string });
}

const simulation: SmsVerifier = {
  simulated: true,
  async start(phone) {
    console.info(`[sms:simulated] verification code requested for ${phone.slice(0, 4)}••• (any 6 digits work)`);
  },
  async check(_phone, code) {
    return /^\d{6}$/.test(code);
  },
};

export function smsVerifier(): SmsVerifier {
  if (integrations.sms) return twilio;
  if (!simulationsAllowed()) throw new Error("SMS verification is not configured (Twilio).");
  return simulation;
}
