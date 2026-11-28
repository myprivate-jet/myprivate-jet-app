/** Profile schema: completed at leisure, nothing required to book. */
export type FieldType = "text" | "email" | "date" | "chk" | "ro" | "area" | `sel:${string}`;
export const PROFILE_SCHEMA: [string, [string, string, FieldType?][]][] = [
  ["About you", [["title", "Title", "sel:|Mr|Mrs|Ms|Dr|Sir|Lady"], ["first", "First name"], ["last", "Family name"], ["dob", "Date of birth", "date"], ["nat", "Nationality"]]],
  ["Contact", [["email", "Email", "email"], ["phone", "Mobile, verified", "ro"], ["lang", "Preferred language", "sel:|English|Français|Italiano|العربية|Deutsch|Español|Русский"], ["hours", "Best time to reach you"]]],
  ["Home address", [["a1", "Address"], ["city", "City"], ["zip", "Postcode"], ["country", "Country"]]],
  ["Billing", [["billsame", "Same as home address", "chk"], ["company", "Company or family office"], ["vat", "VAT number"], ["billaddr", "Billing address", "area"], ["billemail", "Send invoices to", "email"]]],
  ["Travellers", [["t1", "Traveller"], ["t2", "Traveller"], ["t3", "Traveller"], ["t4", "Traveller"]]],
  ["On board", [["diet", "Dietary requirements"], ["allerg", "Allergies"], ["drinks", "Drinks"], ["cater", "Catering notes", "area"]]],
  ["On the ground", [["cardep", "Car to the aircraft at departure", "chk"], ["cararr", "Car waiting on arrival", "chk"], ["ground", "Notes for the ground team", "area"]]],
  ["Pets", [["pet", "Name and breed"], ["petw", "Weight with carrier"]]],
];
export const PROFILE_KEYS = new Set(PROFILE_SCHEMA.flatMap(([, fs]) => fs.filter((f) => f[2] !== "ro").map((f) => f[0])));

export function profilePct(P: Record<string, unknown>) {
  let n = 0, f = 0;
  for (const [, fs] of PROFILE_SCHEMA) for (const [k, , ty] of fs) {
    if (ty === "chk" || ty === "ro") continue;
    if (k === "billaddr" && P.billsame) continue;
    n++;
    if (P[k]) f++;
  }
  return Math.round((f / n) * 100);
}
