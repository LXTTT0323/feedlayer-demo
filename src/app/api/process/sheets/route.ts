import { NextResponse } from "next/server";
import { listXlsxSheetNames } from "@/lib/parseExcel";

export const runtime = "nodejs";

/** POST multipart field `file` (.xlsx) → `{ sheets: string[] }` */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing form field \"file\"." }, { status: 400 });
    }
    const name = "name" in file && typeof file.name === "string" ? file.name.toLowerCase() : "";
    if (!name.endsWith(".xlsx")) {
      return NextResponse.json({ error: "Only .xlsx files expose worksheets." }, { status: 400 });
    }
    const buf = await file.arrayBuffer();
    const sheets = listXlsxSheetNames(buf);
    if (sheets.length === 0) {
      return NextResponse.json({ error: "No worksheets found in workbook." }, { status: 400 });
    }
    return NextResponse.json({ sheets });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not read workbook." }, { status: 500 });
  }
}
