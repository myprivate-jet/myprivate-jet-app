import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { audit } from "@/server/queries";

const { bookings, payments } = schema;

/** Internal operations shared by actions and webhooks. Not callable from the browser. */
export async function markClientPaid(bookingId: string, amount: number, currency: string, method: string) {
  await db().insert(payments).values({ bookingId, direction: "in", amount, currency, status: "received", method });
  await db().update(bookings).set({ stage: 7, needsAdvisor: "Approve operator payment", waitingOn: null, sla: "Before departure", updatedAt: new Date() }).where(eq(bookings.id, bookingId));
  await audit("system", "payment.received", { bookingId }, { amount, currency, method });
}

