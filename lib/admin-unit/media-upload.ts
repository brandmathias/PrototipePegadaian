import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ADMIN_BARANG_MEDIA_LIMIT } from "@/lib/admin-unit/validation";

function safeFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  const baseName = path
    .basename(fileName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

  return `${Date.now()}-${crypto.randomUUID()}-${baseName || "media"}${ext}`;
}

export async function saveAdminBarangMediaFiles(files: File[]) {
  if (files.length > ADMIN_BARANG_MEDIA_LIMIT) {
    throw new Error(`Maksimal ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video untuk satu barang.`);
  }

  const invalidFile = files.find((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"));
  if (invalidFile) {
    throw new Error("Media hanya boleh berupa foto atau video.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "barang");
  await mkdir(uploadDir, { recursive: true });

  return Promise.all(
    files.map(async (file, index) => {
      const storedName = safeFileName(file.name);
      const targetPath = path.join(uploadDir, storedName);
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(targetPath, bytes);

      return {
        type: file.type.startsWith("video/") ? "video" : "foto",
        url: `/uploads/barang/${storedName}`,
        fileName: file.name,
        sizeBytes: file.size,
        sortOrder: index
      };
    })
  );
}
