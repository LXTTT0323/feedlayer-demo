import { runCatalogPipeline } from "@/lib/processPipeline";
import { inputFromJson, inputFromMultipart, pipelineArgs } from "@/lib/processRequest";
import type { ProcessProgressEvent } from "@/lib/processProgress";

export const runtime = "nodejs";

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** POST — SSE progress events + final report. */
export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const contentType = req.headers.get("content-type") ?? "";

  let input;
  try {
    if (contentType.includes("multipart/form-data")) {
      input = await inputFromMultipart(await req.formData());
    } else {
      input = inputFromJson(await req.json());
    }
  } catch {
    return new Response(sse("error", { error: "Invalid request body." }), {
      status: 400,
      headers: { "content-type": "text/event-stream" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      try {
        const report = await runCatalogPipeline({
          ...pipelineArgs(input),
          onProgress: (ev: ProcessProgressEvent) => send("progress", ev),
        });
        send("result", report);
      } catch (e) {
        if (e instanceof Error && e.message === "NO_PRODUCT_ROWS") {
          send("error", {
            error: "No product rows found. Check headers, sheet selection, and column mapping.",
          });
        } else {
          console.error(e);
          send("error", { error: "Processing failed." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}
