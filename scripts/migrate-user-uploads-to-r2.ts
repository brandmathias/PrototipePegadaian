import type { Dirent } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { eq, like } from "drizzle-orm";

import { db, pool } from "@/lib/db/client";
import { blacklistReviewAttachments, mediaBarang, transaksi } from "@/lib/db/schema";
import { saveUserUploadBuffer } from "@/lib/storage/user-upload-storage";

type LocalUploadFile = {
  absolutePath: string;
  folder: string;
  localUrl: string;
  storedName: string;
};

const USER_UPLOAD_FOLDERS = ["barang", "bukti", "blacklist-review"] as const;
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const REQUIRED_R2_ENVS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL"
];
const MIME_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webm": "video/webm",
  ".webp": "image/webp"
};

function ensureR2Environment() {
  const missing = REQUIRED_R2_ENVS.filter((name) => !process.env[name]?.trim());

  if (missing.length) {
    throw new Error(`Env R2 belum lengkap: ${missing.join(", ")}`);
  }
}

function getContentType(filePath: string) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function toPosixPath(value: string) {
  return value.split(path.sep).join("/");
}

async function collectUploadFiles(rootFolder: string, currentFolder = rootFolder): Promise<LocalUploadFile[]> {
  const absoluteFolder = path.join(UPLOADS_ROOT, currentFolder);
  let entries: Dirent<string>[];

  try {
    entries = await readdir(absoluteFolder, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = path.join(currentFolder, entry.name);
      const absolutePath = path.join(UPLOADS_ROOT, relativePath);

      if (entry.isDirectory()) {
        return collectUploadFiles(rootFolder, relativePath);
      }

      if (!entry.isFile()) {
        return [];
      }

      const fileStats = await stat(absolutePath);
      if (!fileStats.isFile()) {
        return [];
      }

      const storedName = entry.name;
      const folder = toPosixPath(path.dirname(relativePath));
      const localUrl = `/uploads/${toPosixPath(relativePath)}`;

      return [
        {
          absolutePath,
          folder,
          localUrl,
          storedName
        }
      ];
    })
  );

  return files.flat();
}

async function updateDatabaseReferences(oldUrl: string, newUrl: string) {
  const updatedMedia = await db
    .update(mediaBarang)
    .set({ url: newUrl })
    .where(eq(mediaBarang.url, oldUrl))
    .returning({ id: mediaBarang.id });

  const updatedBlacklistAttachments = await db
    .update(blacklistReviewAttachments)
    .set({ fileUrl: newUrl })
    .where(eq(blacklistReviewAttachments.fileUrl, oldUrl))
    .returning({ id: blacklistReviewAttachments.id });

  const candidateTransactions = await db
    .select({ id: transaksi.id, proofUrl: transaksi.proofUrl })
    .from(transaksi)
    .where(like(transaksi.proofUrl, `${oldUrl}%`));

  const transactionUpdates = await Promise.all(
    candidateTransactions
      .filter((row) => row.proofUrl === oldUrl || row.proofUrl?.startsWith(`${oldUrl} (`))
      .map((row) =>
        db
          .update(transaksi)
          .set({ proofUrl: row.proofUrl!.replace(oldUrl, newUrl), updatedAt: new Date() })
          .where(eq(transaksi.id, row.id))
          .returning({ id: transaksi.id })
      )
  );

  return {
    blacklistAttachments: updatedBlacklistAttachments.length,
    media: updatedMedia.length,
    transactions: transactionUpdates.flat().length
  };
}

async function migrateFile(file: LocalUploadFile) {
  const savedFile = await saveUserUploadBuffer({
    body: await readFile(file.absolutePath),
    contentType: getContentType(file.absolutePath),
    folder: file.folder,
    storedName: file.storedName
  });

  if (savedFile.storage !== "r2") {
    throw new Error("Migrasi dibatalkan karena upload tidak memakai R2. Periksa env R2.");
  }

  const updates = await updateDatabaseReferences(file.localUrl, savedFile.url);

  return {
    ...updates,
    localUrl: file.localUrl,
    r2Url: savedFile.url
  };
}

async function main() {
  ensureR2Environment();

  const files = (await Promise.all(USER_UPLOAD_FOLDERS.map((folder) => collectUploadFiles(folder)))).flat();
  console.log(`Ditemukan ${files.length} file user-upload lokal untuk migrasi.`);

  let migrated = 0;
  let mediaUpdates = 0;
  let transactionUpdates = 0;
  let blacklistUpdates = 0;

  for (const file of files) {
    const result = await migrateFile(file);
    migrated += 1;
    mediaUpdates += result.media;
    transactionUpdates += result.transactions;
    blacklistUpdates += result.blacklistAttachments;
    console.log(`[${migrated}/${files.length}] ${result.localUrl} -> ${result.r2Url}`);
  }

  console.log("Migrasi selesai.");
  console.log(`File diupload ke R2: ${migrated}`);
  console.log(`media_barang.url diupdate: ${mediaUpdates}`);
  console.log(`transaksi.proof_url diupdate: ${transactionUpdates}`);
  console.log(`blacklist_review_attachment.file_url diupdate: ${blacklistUpdates}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
