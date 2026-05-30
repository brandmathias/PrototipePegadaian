import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_REVIEW_EVIDENCE_SIZE = 5 * 1024 * 1024;

function getTextField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function persistEvidenceFile(file: File) {
  if (file.size > MAX_REVIEW_EVIDENCE_SIZE) {
    throw new Error("Ukuran bukti review maksimal 5 MB per file.");
  }

  if (!/\.(jpg|jpeg|png|pdf)$/i.test(file.name)) {
    throw new Error("Format bukti review harus JPG, PNG, atau PDF.");
  }

  const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "blacklist-review");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeFileName), Buffer.from(await file.arrayBuffer()));

  return {
    fileUrl: `/uploads/blacklist-review/${safeFileName}`,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream"
  };
}

export async function readBlacklistReviewRequestPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return request.json().catch(() => ({}));
  }

  const formData = await request.formData();
  const evidence = await Promise.all(
    formData
      .getAll("file")
      .filter((item): item is File => item instanceof File && item.size > 0)
      .map(persistEvidenceFile)
  );

  return {
    incidentId: getTextField(formData, "incidentId"),
    buyerStatement: getTextField(formData, "buyerStatement"),
    nationalId: getTextField(formData, "nationalId"),
    contact: getTextField(formData, "contact"),
    evidence
  };
}
