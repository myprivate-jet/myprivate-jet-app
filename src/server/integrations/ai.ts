import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { integrations } from "./config";

/**
 * AI for the advisor only: drafts and reads, never sends or decides.
 * Every output is reviewed by the advisor before it reaches a client or operator.
 */
const MODEL = "claude-opus-5-5";
let client: Anthropic | null = null;
const ai = () => (client ??= new Anthropic());

export const aiAvailable = () => integrations.ai;

const OPS_SYSTEM = `You are the internal Flight Ops assistant of MyPrivate-Jet, a premium private-jet charter brand acting as the client's agent.
You help the Dedicated Advisor run bookings. You see booking data supplied below.
Rules: be brief and factual; lead with what needs action; use booking references; never invent operator names, registrations, crew names, weather or NOTAMs that are not in the data — say which feed is missing instead.
Crew duty limits and permits are the operator's legal responsibility; flag risks, do not certify compliance.
You draft; the advisor decides and sends.`;

async function text(system: string, user: string, effort: "low" | "medium" = "low"): Promise<string> {
  const res = await ai().beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort },
    system,
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason === "refusal") return "I can't help with that request.";
  return res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
}

export async function askOpsAssistant(question: string, bookingsContext: string) {
  return text(OPS_SYSTEM, `Bookings and notes:\n${bookingsContext}\n\nAdvisor's question: ${question}`);
}

export async function draftOperatorEmail(bookingContext: string, missing: string[]) {
  return text(
    OPS_SYSTEM + "\nWrite plain-text operator emails: courteous, short, signed 'MyPrivate-Jet Operations'. No subject line.",
    `Booking:\n${bookingContext}\n\nStill missing from the operator: ${missing.join(", ") || "nothing; ask them to confirm nothing has changed"}. Ask for it by tomorrow 12:00.`,
  );
}

export const BriefFields = z.object({
  etd: z.string(), eta: z.string(), actype: z.string(), reg: z.string(), operator: z.string(), callsign: z.string(),
  dep_fbo: z.string(), dep_addr: z.string(), dep_phone: z.string(), dep_show: z.string(), dep_notes: z.string(),
  arr_fbo: z.string(), arr_addr: z.string(), arr_phone: z.string(), arr_notes: z.string(),
  capt: z.string(), capt_ph: z.string(), fo: z.string(), ca: z.string(), ops_ph: z.string(), wx: z.string(),
});

/** Read an operator's brief (PDF or photo) into flight-brief fields. Empty string = not in the document. */
export async function readOperatorBrief(file: { data: Buffer; mime: string }) {
  const b64 = file.data.toString("base64");
  const source =
    file.mime === "application/pdf"
      ? ({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } } as const)
      : ({ type: "image", source: { type: "base64", media_type: file.mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: b64 } } as const);
  const res = await ai().messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(BriefFields) },
    messages: [
      {
        role: "user",
        content: [
          source,
          { type: "text", text: "This is an aircraft operator's flight brief or confirmation. Copy each field exactly as written in the document. Use an empty string for anything not present. Times local, as HH:MM." },
        ],
      },
    ],
  });
  return res.parsed_output;
}
