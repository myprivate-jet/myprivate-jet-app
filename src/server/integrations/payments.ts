import "server-only";
import { integrations, simulationsAllowed } from "./config";

/**
 * Client payments: card through Stripe Checkout, or bank transfer against the
 * invoice. The client pays MyPrivate-Jet only; we pay the operator.
 * Without Stripe keys, card payment is simulated (outside production only).
 */
export async function createCardCheckout(p: { ref: string; amount: number; currency: string; email: string; returnUrl: string }) {
  if (!integrations.payments) {
    if (!simulationsAllowed()) throw new Error("Card payments are not configured (Stripe).");
    return { simulated: true as const, url: null };
  }
  const body = new URLSearchParams({
    mode: "payment",
    customer_email: p.email,
    success_url: `${p.returnUrl}?paid=${p.ref}`,
    cancel_url: p.returnUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": p.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(p.amount * 100),
    "line_items[0][price_data][product_data][name]": `Private flight ${p.ref}`,
    "metadata[booking_ref]": p.ref,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Stripe checkout failed: ${res.status}`);
  const j = (await res.json()) as { url: string };
  return { simulated: false as const, url: j.url };
}
