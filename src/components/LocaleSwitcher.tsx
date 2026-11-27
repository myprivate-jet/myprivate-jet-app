"use client";
import { useTransition } from "react";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/dictionaries";
import { setLocale } from "@/server/actions/locale";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const [pending, start] = useTransition();
  return (
    <select className="lang" aria-label="Language" value={locale} disabled={pending} onChange={(e) => start(() => setLocale(e.target.value))}>
      {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
    </select>
  );
}
