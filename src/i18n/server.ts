import "server-only";
import { cookies, headers } from "next/headers";
import { DICTS, isLocale, type Locale } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get("mpj_locale")?.value;
  if (isLocale(c)) return c;
  const al = (await headers()).get("accept-language") ?? "";
  const first = al.split(",")[0]?.slice(0, 2).toLowerCase();
  return isLocale(first) ? first : "en";
}
export async function getDict() {
  const l = await getLocale();
  return { locale: l, t: DICTS[l] };
}
