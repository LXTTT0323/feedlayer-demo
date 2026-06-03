import { NextResponse } from "next/server";
import { saveSharedReport } from "@/lib/shareStore";
import { isSupportedReportVersion, type FeedLayerFullReport } from "@/types/report";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FeedLayerFullReport;
    if (!body?.version || !isSupportedReportVersion(body.version)) {
      return NextResponse.json({ error: "Unsupported report version." }, { status: 400 });
    }
    if (!body.ai_ready_feed?.length) {
      return NextResponse.json({ error: "Empty report." }, { status: 400 });
    }
    const id = await saveSharedReport(body);
    const origin = new URL(req.url).origin;
    return NextResponse.json({ id, url: `${origin}/results?id=${id}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save share link." }, { status: 500 });
  }
}
