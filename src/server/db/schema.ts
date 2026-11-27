import { boolean, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const created = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

/** A verified client. Membership is free; the mandate is accepted once, at sign-up. */
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(), // E.164, verified by SMS
  locale: text("locale").default("en").notNull(),
  termsVersion: text("terms_version").notNull(),
  mandateAcceptedAt: timestamp("mandate_accepted_at", { withTimezone: true }).notNull(),
  mandateIp: text("mandate_ip"),
  mandateUserAgent: text("mandate_user_agent"),
  mandateWithdrawnAt: timestamp("mandate_withdrawn_at", { withTimezone: true }),
  isDemo: boolean("is_demo").default(false).notNull(),
  createdAt: created(),
}, (t) => [uniqueIndex("members_phone_idx").on(t.phone)]);

/** Profile completed at leisure: addresses, billing, travellers, catering, ground, pets. */
export const profiles = pgTable("profiles", {
  memberId: uuid("member_id").primaryKey().references(() => members.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Record<string, string | boolean>>().default({}).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Advisors and operations staff. */
export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"advisor" | "admin">().default("advisor").notNull(),
  createdAt: created(),
}, (t) => [uniqueIndex("staff_email_idx").on(t.email)]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // SHA-256 of the cookie token
  kind: text("kind").$type<"member" | "staff">().notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").references(() => staff.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
});

/** SMS verification attempts, for rate limiting and audit. */
export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull(),
  ip: text("ip"),
  status: text("status").$type<"sent" | "approved" | "failed">().notNull(),
  createdAt: created(),
}, (t) => [index("verifications_phone_idx").on(t.phone, t.createdAt)]);

/**
 * A booking moves through 12 stages (see src/lib/booking/stages.ts).
 * `stage` is the index of the stage currently in progress.
 */
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  ref: text("ref").notNull(),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  fromIcao: text("from_icao").notNull(),
  toIcao: text("to_icao").notNull(),
  date: date("date").notNull(),
  time: text("time").notNull(),
  returnDate: date("return_date"),
  pax: integer("pax").notNull(),
  luggage: text("luggage").default("std").notNull(),
  standUp: boolean("stand_up").default(false).notNull(),
  attendant: boolean("attendant").default(false).notNull(),
  pets: boolean("pets").default(false).notNull(),
  standard: text("standard").notNull(),
  upgradedTo: text("upgraded_to"),
  /** Whole currency units. Null while the advisor prices it personally. */
  price: integer("price"),
  currency: text("currency").$type<"EUR" | "USD">().notNull(),
  guarantee: text("guarantee").$type<"instant" | "with-aircraft">().notNull(),
  priceValidUntil: timestamp("price_valid_until", { withTimezone: true }),
  stage: integer("stage").default(2).notNull(),
  needsAdvisor: text("needs_advisor"),
  sla: text("sla"),
  waitingOn: text("waiting_on"),
  flags: jsonb("flags").$type<string[]>().default([]).notNull(),
  exception: boolean("exception").default(false).notNull(),
  operatorName: text("operator_name"),
  aircraft: text("aircraft"),
  payBy: date("pay_by"),
  keepPassports: boolean("keep_passports").default(false).notNull(),
  advisorNote: text("advisor_note"),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("bookings_ref_idx").on(t.ref), index("bookings_member_idx").on(t.memberId)]);

export const passengers = pgTable("passengers", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  seat: integer("seat").notNull(),
  fullName: text("full_name"),
  /** Passport images are not stored yet: reading (OCR/MRZ) is simulated until the document provider is connected. */
  passportStatus: text("passport_status").$type<"none" | "read">().default("none").notNull(),
  passportReadAt: timestamp("passport_read_at", { withTimezone: true }),
}, (t) => [uniqueIndex("passengers_seat_idx").on(t.bookingId, t.seat)]);

/** Operator offers. Advisor-only: never shown to clients. */
export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  operatorName: text("operator_name").notNull(),
  aircraft: text("aircraft").notNull(),
  year: integer("year").notNull(),
  base: text("base").notNull(),
  audited: boolean("audited").notNull(),
  cost: integer("cost").notNull(),
  currency: text("currency").notNull(),
  status: text("status").$type<"received" | "chosen" | "declined">().default("received").notNull(),
  createdAt: created(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  direction: text("direction").$type<"in" | "out">().notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").$type<"requested" | "received" | "awaiting_approval" | "paid">().notNull(),
  method: text("method"),
  providerRef: text("provider_ref"),
  createdAt: created(),
});

export const flightBriefs = pgTable("flight_briefs", {
  bookingId: uuid("booking_id").primaryKey().references(() => bookings.id, { onDelete: "cascade" }),
  fields: jsonb("fields").$type<Record<string, string>>().default({}).notNull(),
  /** Field keys read from the operator's brief (shown in gold for checking). */
  fromOperator: jsonb("from_operator").$type<string[]>().default([]).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Operator mailbox, threaded by booking reference. */
export const operatorMessages = pgTable("operator_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  direction: text("direction").$type<"in" | "out">().notNull(),
  fromName: text("from_name").notNull(),
  toName: text("to_name"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  attachment: text("attachment"),
  aiNote: text("ai_note"),
  label: text("label"),
  status: text("status").$type<"received" | "sent" | "queued">().default("sent").notNull(),
  createdAt: created(),
});

/** Direct chat between a member and their Dedicated Advisor. */
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  author: text("author").$type<"member" | "advisor">().notNull(),
  staffId: uuid("staff_id").references(() => staff.id),
  body: text("body").notNull(),
  context: text("context"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: created(),
}, (t) => [index("chat_member_idx").on(t.memberId, t.createdAt)]);

/** Append-only trail of every step, for the advisor and for compliance. */
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  detail: jsonb("detail").$type<Record<string, unknown>>(),
  createdAt: created(),
});

export type Member = typeof members.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Passenger = typeof passengers.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type FlightBrief = typeof flightBriefs.$inferSelect;
export type OperatorMessage = typeof operatorMessages.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
