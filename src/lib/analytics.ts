/**
 * Conversion events. Sent to Plausible (cookie-free) and to the Google tag /
 * dataLayer when configured. No personal data is ever sent: only event names
 * and coarse properties (standard, region, currency).
 */
export type MpjEvent =
  | "quote_viewed" | "standard_selected" | "confirm_clicked" | "membership_started"
  | "membership_completed" | "booking_created" | "chat_opened" | "guide_cta_clicked";

type W = Window & { plausible?: (e: string, o?: { props?: Record<string, string | number> }) => void; dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };

export function track(event: MpjEvent, props: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  const w = window as W;
  try {
    w.plausible?.(event, { props });
    if (w.gtag) w.gtag("event", event, props);
    else (w.dataLayer ??= []).push({ event, ...props });
  } catch {
    /* analytics must never break the page */
  }
}
