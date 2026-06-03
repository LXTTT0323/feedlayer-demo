import type { UserColumnOverrides } from "@/lib/columnMapping";

export type TabularProcessInput = {
  mode: "csv_text" | "xlsx_buffer";
  csvText?: string;
  xlsxBuffer?: ArrayBuffer;
  sheetName?: string;
  columnOverrides?: UserColumnOverrides;
};

export type TextProcessInput = {
  mode: "text" | "sample_text" | "sample_catalog";
  text?: string;
  sample?: "catalog" | "text";
};

export type ProcessInput = TabularProcessInput | TextProcessInput;

export function parseColumnOverrides(raw: FormDataEntryValue | null): UserColumnOverrides | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    return JSON.parse(raw) as UserColumnOverrides;
  } catch {
    return undefined;
  }
}

export async function inputFromMultipart(form: FormData): Promise<ProcessInput> {
  const file = form.get("file");
  const sheetField = form.get("sheet");
  const sheetName = typeof sheetField === "string" && sheetField.trim() ? sheetField.trim() : undefined;
  const overrides = parseColumnOverrides(form.get("columnOverrides"));

  if (file instanceof Blob) {
    const name = "name" in file && typeof file.name === "string" ? file.name.toLowerCase() : "";
    const buf = await file.arrayBuffer();
    if (name.endsWith(".xlsx")) {
      return { mode: "xlsx_buffer", xlsxBuffer: buf, sheetName, columnOverrides: overrides };
    }
    if (name.endsWith(".csv")) {
      const csvText = new TextDecoder("utf-8").decode(buf);
      return { mode: "csv_text", csvText, columnOverrides: overrides };
    }
    throw new Error("UNSUPPORTED_FILE");
  }

  const csvField = form.get("csvText");
  if (typeof csvField === "string" && csvField.trim()) {
    return { mode: "csv_text", csvText: csvField, columnOverrides: overrides };
  }

  throw new Error("MISSING_FILE");
}

export function inputFromJson(body: unknown): ProcessInput {
  const b = body as {
    type?: string;
    csvText?: string;
    text?: string;
    sample?: "catalog" | "text";
    columnOverrides?: UserColumnOverrides;
  };
  if (b.type === "csv") {
    return { mode: "csv_text", csvText: b.csvText ?? "", columnOverrides: b.columnOverrides };
  }
  if (b.type === "text") {
    return { mode: "text", text: b.text };
  }
  if (b.type === "sample") {
    return b.sample === "text" ? { mode: "sample_text" } : { mode: "sample_catalog" };
  }
  throw new Error("INVALID_JSON");
}

export function pipelineArgs(input: ProcessInput) {
  if (input.mode === "csv_text") {
    return {
      kind: "csv_text" as const,
      csvText: input.csvText,
      columnOverrides: input.columnOverrides,
    };
  }
  if (input.mode === "xlsx_buffer") {
    return {
      kind: "xlsx_buffer" as const,
      xlsxBuffer: input.xlsxBuffer,
      sheetName: input.sheetName,
      columnOverrides: input.columnOverrides,
    };
  }
  if (input.mode === "text") {
    return { kind: "text" as const, text: input.text };
  }
  if (input.mode === "sample_text") {
    return { kind: "sample_text" as const };
  }
  return { kind: "sample_catalog" as const };
}

export function isTabularInput(input: ProcessInput): input is TabularProcessInput {
  return input.mode === "csv_text" || input.mode === "xlsx_buffer";
}
