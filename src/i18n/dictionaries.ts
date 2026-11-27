/**
 * Interface languages. English is the source; French, Italian and Arabic cover
 * the site frame and the key promises, and need review by a native speaker
 * before launch. Long-form guides are English-first (see README: "Languages").
 */
export const LOCALES = ["en", "fr", "it", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", fr: "Français", it: "Italiano", ar: "العربية" };
export const RTL: Locale[] = ["ar"];
export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

const en = {
  tagline: "Private Aviation Office",
  nav: { plan: "Plan a flight", standards: "Cabin standards", guides: "Guides", office: "Your Office", profile: "Profile" },
  heroQ: "One recommendation. One final price.",
  promise: [
    ["One final price", "All-inclusive. It never moves."],
    ["Never a downgrade", "Same standard or higher, at our cost."],
    ["Audited operators only", "Never the cheapest bidder. Always a carrier we have checked."],
    ["One advisor", "From first question to landing."],
  ],
  chat: "Chat with your advisor",
  advisor: "Your Dedicated Advisor",
  guest: "Browsing as a guest.",
  openOffice: "Open your Private Office",
  demo: "See a demo",
  footer: "MyPrivate-Jet arranges flights as the client's agent. Flights are operated by licensed, audited air carriers, which keep final authority over every flight.",
  footerLinks: { how: "The Assured Price", membership: "Membership", standards: "Cabin standards", guides: "Guides", faq: "Questions", terms: "Membership terms", privacy: "Privacy" },
};
export type Dict = typeof en;

const fr: Dict = {
  tagline: "Bureau d'aviation privée",
  nav: { plan: "Préparer un vol", standards: "Standards de cabine", guides: "Guides", office: "Votre bureau", profile: "Profil" },
  heroQ: "Une recommandation. Un prix final.",
  promise: [
    ["Un prix final", "Tout compris. Il ne bouge jamais."],
    ["Jamais de déclassement", "Même standard ou supérieur, à nos frais."],
    ["Opérateurs audités uniquement", "Jamais le moins-disant. Toujours un transporteur vérifié."],
    ["Un seul conseiller", "De la première question à l'atterrissage."],
  ],
  chat: "Écrire à votre conseiller",
  advisor: "Votre conseiller dédié",
  guest: "Vous naviguez en invité.",
  openOffice: "Ouvrir votre bureau privé",
  demo: "Voir une démonstration",
  footer: "MyPrivate-Jet organise les vols en qualité de mandataire du client. Les vols sont opérés par des transporteurs aériens agréés et audités, qui gardent l'autorité finale sur chaque vol.",
  footerLinks: { how: "Le prix garanti", membership: "Adhésion", standards: "Standards de cabine", guides: "Guides", faq: "Questions", terms: "Conditions d'adhésion", privacy: "Confidentialité" },
};

const it: Dict = {
  tagline: "Ufficio di aviazione privata",
  nav: { plan: "Pianifica un volo", standards: "Standard di cabina", guides: "Guide", office: "Il tuo ufficio", profile: "Profilo" },
  heroQ: "Una raccomandazione. Un prezzo finale.",
  promise: [
    ["Un prezzo finale", "Tutto incluso. Non cambia mai."],
    ["Mai un declassamento", "Stesso standard o superiore, a nostre spese."],
    ["Solo operatori verificati", "Mai il prezzo più basso. Sempre un vettore controllato."],
    ["Un solo consulente", "Dalla prima domanda all'atterraggio."],
  ],
  chat: "Scrivi al tuo consulente",
  advisor: "Il tuo consulente dedicato",
  guest: "Stai navigando come ospite.",
  openOffice: "Apri il tuo ufficio privato",
  demo: "Guarda una demo",
  footer: "MyPrivate-Jet organizza i voli come mandatario del cliente. I voli sono operati da vettori aerei autorizzati e verificati, che mantengono l'autorità finale su ogni volo.",
  footerLinks: { how: "Il prezzo garantito", membership: "Adesione", standards: "Standard di cabina", guides: "Guide", faq: "Domande", terms: "Condizioni di adesione", privacy: "Privacy" },
};

const ar: Dict = {
  tagline: "مكتب الطيران الخاص",
  nav: { plan: "خطّط رحلة", standards: "معايير المقصورة", guides: "أدلة", office: "مكتبك", profile: "الملف الشخصي" },
  heroQ: "توصية واحدة. سعر نهائي واحد.",
  promise: [
    ["سعر نهائي واحد", "شامل لكل شيء. لا يتغيّر أبداً."],
    ["لا تخفيض للمستوى أبداً", "المعيار نفسه أو أعلى، على نفقتنا."],
    ["مشغّلون مدقَّقون فقط", "ليس الأرخص أبداً. دائماً ناقل تحقّقنا منه."],
    ["مستشار واحد", "من السؤال الأول حتى الهبوط."],
  ],
  chat: "تحدّث مع مستشارك",
  advisor: "مستشارك المخصّص",
  guest: "أنت تتصفّح كزائر.",
  openOffice: "افتح مكتبك الخاص",
  demo: "شاهد عرضاً تجريبياً",
  footer: "تنظّم MyPrivate-Jet الرحلات بصفتها وكيلاً عن العميل. تُشغَّل الرحلات من قبل ناقلين جويين مرخّصين وخاضعين للتدقيق، ولهم السلطة النهائية على كل رحلة.",
  footerLinks: { how: "السعر المضمون", membership: "العضوية", standards: "معايير المقصورة", guides: "أدلة", faq: "أسئلة", terms: "شروط العضوية", privacy: "الخصوصية" },
};

export const DICTS: Record<Locale, Dict> = { en, fr, it, ar };
