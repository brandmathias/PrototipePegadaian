import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { getUploadMimeType, resolvePublicUploadPath } from "@/lib/uploads/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ path?: string[] }> };

function toWebStream(filePath: string, start?: number, end?: number) {
  return Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
}

function parseByteRange(rangeHeader: string | null, size: number) {
  const match = rangeHeader?.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) {
    return null;
  }

  const rawStart = match[1];
  const rawEnd = match[2];
  let start = rawStart ? Number(rawStart) : undefined;
  let end = rawEnd ? Number(rawEnd) : undefined;

  if (start === undefined && end !== undefined) {
    start = Math.max(size - end, 0);
    end = size - 1;
  } else {
    start ??= 0;
    end ??= size - 1;
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return "invalid" as const;
  }

  return {
    start,
    end: Math.min(end, size - 1)
  };
}

async function getUploadResponse(request: Request, context: Context, includeBody: boolean) {
  const { path: uploadPath } = await context.params;
  const filePath = resolvePublicUploadPath(uploadPath);

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  let fileStats: Awaited<ReturnType<typeof stat>>;
  try {
    fileStats = await stat(filePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (!fileStats.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = getUploadMimeType(filePath);
  const range = parseByteRange(request.headers.get("range"), fileStats.size);
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff"
  };

  if (range === "invalid") {
    return new Response(null, {
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes */${fileStats.size}`
      },
      status: 416
    });
  }

  if (range) {
    const contentLength = range.end - range.start + 1;
    return new Response(includeBody ? toWebStream(filePath, range.start, range.end) : null, {
      headers: {
        ...baseHeaders,
        "Content-Length": String(contentLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${fileStats.size}`
      },
      status: 206
    });
  }

  return new Response(includeBody ? toWebStream(filePath) : null, {
    headers: {
      ...baseHeaders,
      "Content-Length": String(fileStats.size)
    }
  });
}

export async function GET(request: Request, context: Context) {
  return getUploadResponse(request, context, true);
}

export async function HEAD(request: Request, context: Context) {
  return getUploadResponse(request, context, false);
}
