"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale } from "@/i18n/dictionaries";

export async function setLocale(l: string) {
  if (!isLocale(l)) return;
  (await cookies()).set("mpj_locale", l, { path: "/", maxAge: 365 * 864e5 / 1000, sameSite: "lax" });
  revalidatePath("/", "layout");
}
