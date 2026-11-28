import "server-only";

/**
 * Which real services are connected. Anything not configured falls back to a
 * clearly labelled simulation, so the app runs end to end before accounts exist.
 * Simulations are refused in production unless ALLOW_SIMULATIONS=true.
 */
export const integrations = {
  sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID),
  email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  payments: Boolean(process.env.STRIPE_SECRET_KEY),
  ai: Boolean(process.env.ANTHROPIC_API_KEY),
};

export function simulationsAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_SIMULATIONS === "true";
}
