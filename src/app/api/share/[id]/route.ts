import { NextResponse } from "next/server";
import { loadSharedReport } from "@/lib/shareStore";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const report = await loadSharedReport(id);
  if (!report) {
    return NextResponse.json({ error: "Share link not found or expired." }, { status: 404 });
  }
  return NextResponse.json(report);
}
