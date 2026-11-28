import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { db, schema } from "@/server/db";

const MEMBER_COOKIE = "mpj_session";
const STAFF_COOKIE = "mpj_staff";
const PENDING_COOKIE = "mpj_pending";
const MEMBER_DAYS = 90;
const STAFF_HOURS = 12;

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (32+ characters).");
    return new TextEncoder().encode("development-only-secret-change-me-0000000");
  }
  return new TextEncoder().encode(s);
}

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

async function createSession(kind: "member" | "staff", id: string) {
  const token = randomBytes(32).toString("base64url");
  const ms = kind === "member" ? MEMBER_DAYS * 864e5 : STAFF_HOURS * 36e5;
  await db().insert(schema.sessions).values({
    id: hash(token),
    kind,
    memberId: kind === "member" ? id : null,
    staffId: kind === "staff" ? id : null,
    expiresAt: new Date(Date.now() + ms),
  });
  (await cookies()).set(kind === "member" ? MEMBER_COOKIE : STAFF_COOKIE, token, cookieOpts(ms / 1000));
}
export const startMemberSession = (memberId: string) => createSession("member", memberId);
export const startStaffSession = (staffId: string) => createSession("staff", staffId);

async function sessionRow(cookie: string) {
  const token = (await cookies()).get(cookie)?.value;
  if (!token) return null;
  const [row] = await db()
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.id, hash(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

export async function currentMember() {
  if (!process.env.DATABASE_URL) return null;
  const s = await sessionRow(MEMBER_COOKIE);
  if (!s?.memberId) return null;
  const [m] = await db().select().from(schema.members).where(eq(schema.members.id, s.memberId)).limit(1);
  return m ?? null;
}

export async function currentStaff() {
  if (!process.env.DATABASE_URL) return null;
  const s = await sessionRow(STAFF_COOKIE);
  if (!s?.staffId) return null;
  const [m] = await db()
    .select({ id: schema.staff.id, name: schema.staff.name, email: schema.staff.email, role: schema.staff.role })
    .from(schema.staff)
    .where(eq(schema.staff.id, s.staffId))
    .limit(1);
  return m ?? null;
}

export async function endSession(kind: "member" | "staff") {
  const name = kind === "member" ? MEMBER_COOKIE : STAFF_COOKIE;
  const jar = await cookies();
  const token = jar.get(name)?.value;
  if (token) await db().delete(schema.sessions).where(eq(schema.sessions.id, hash(token)));
  jar.set(name, "", cookieOpts(0));
}

/** Membership details held between "send my code" and "verify", signed and short-lived. */
export interface PendingMember {
  first: string;
  last: string;
  email: string;
  phone: string;
  termsVersion: string;
  acceptedAt: string;
}
export async function setPending(p: PendingMember) {
  const jwt = await new SignJWT({ ...p }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("10m").sign(secret());
  (await cookies()).set(PENDING_COOKIE, jwt, cookieOpts(600));
}
export async function getPending(): Promise<PendingMember | null> {
  const v = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!v) return null;
  try {
    return (await jwtVerify(v, secret())).payload as unknown as PendingMember;
  } catch {
    return null;
  }
}
export async function clearPending() {
  (await cookies()).set(PENDING_COOKIE, "", cookieOpts(0));
}

export function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [, salt, h] = stored.split("$");
  if (!salt || !h) return false;
  const a = Buffer.from(h, "hex");
  const b = scryptSync(pw, Buffer.from(salt, "hex"), 64);
  return a.length === b.length && timingSafeEqual(a, b);
}
