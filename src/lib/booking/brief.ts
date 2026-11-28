/** Flight brief fields. Fields marked "int" are internal and never reach the client. */
export const BRIEF_SECTIONS: [string, [string, string, ("int" | "area")?][]][] = [
  ["Flight", [["date", "Date"], ["etd", "Departure, local"], ["eta", "Arrival, local"], ["ftime", "Flight time"], ["actype", "Aircraft type"], ["reg", "Registration"], ["operator", "Operator"], ["callsign", "Callsign", "int"]]],
  ["Departure", [["dep_ap", "Airport"], ["dep_fbo", "FBO or terminal"], ["dep_addr", "Address"], ["dep_phone", "FBO phone"], ["dep_show", "Show time"], ["dep_notes", "Access notes"]]],
  ["Arrival", [["arr_ap", "Airport"], ["arr_fbo", "FBO or terminal"], ["arr_addr", "Address"], ["arr_phone", "FBO phone"], ["arr_notes", "Customs and access"]]],
  ["Crew", [["capt", "Captain"], ["capt_ph", "Captain mobile", "int"], ["fo", "First officer"], ["ca", "Cabin attendant"], ["ops_ph", "Operator 24 h ops line", "int"]]],
  ["Service", [["pax", "Passengers"], ["bags", "Luggage"], ["cater", "Catering"], ["car", "Ground transport"]]],
  ["Notes", [["wx", "Weather outlook"], ["comment", "Comment for the client", "area"]]],
];
export const INTERNAL_BRIEF_FIELDS = new Set(BRIEF_SECTIONS.flatMap(([, fs]) => fs.filter((f) => f[2] === "int").map((f) => f[0])));

/** What the client sees: internal fields removed. */
export function clientBrief(fields: Record<string, string>) {
  return Object.fromEntries(Object.entries(fields).filter(([k]) => !INTERNAL_BRIEF_FIELDS.has(k)));
}
