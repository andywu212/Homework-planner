import { NextResponse } from "next/server";
import * as ical from "node-ical";
import { RawCanvasEvent } from "@/lib/types";

// Runs server-side only. Canvas blocks browser-side fetches of the .ics
// feed (CORS) and the feed URL itself must never reach the client, so
// this route fetches + parses it and hands back plain JSON.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// node-ical types some fields as either a plain string or a
// { val, params } wrapper (when the ICS line carries parameters).
function textValue(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "val" in (v as any)) return String((v as any).val);
  return String(v);
}

export async function GET() {
  const url = process.env.CANVAS_ICS_URL;
  if (!url) {
    return NextResponse.json(
      { error: "CANVAS_ICS_URL is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Canvas feed returned ${res.status}` },
        { status: 502 }
      );
    }
    const text = await res.text();
    const parsed = ical.parseICS(text);

    const events: RawCanvasEvent[] = Object.values(parsed)
      .filter((e): e is ical.VEvent => !!e && e.type === "VEVENT")
      .map((e) => ({
        uid: String(e.uid),
        summary: textValue(e.summary) ?? "",
        description: textValue(e.description),
        url: textValue((e as any).url),
        dtstart: (e.start instanceof Date ? e.start : new Date(e.start as any)).toISOString(),
      }));

    return NextResponse.json({ events, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch Canvas feed" },
      { status: 502 }
    );
  }
}
