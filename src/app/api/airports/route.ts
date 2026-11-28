import { NextResponse } from "next/server";
import { searchAirports } from "@/lib/pricing/airports";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const list = searchAirports(q.slice(0, 60)).map((a) => ({ icao: a[0], iata: a[1], name: a[2], city: a[3], country: a[4] }));
  return NextResponse.json(list, { headers: { "Cache-Control": "public, max-age=86400" } });
}
