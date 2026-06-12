import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type StoredUploadNameOptions = {
  randomId?: string;
  timestamp?: number;
};

type R2Config = {
  bucketName: string;
  endpoint: string;
  publicBaseUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type UserUploadStorageProvider = "local" | "r2";

export type SaveUserUploadFileInput = {
  file: File;
  folder: string;
  storedName?: string;
};

export type SaveUserUploadBufferInput = {
  body: Buffer;
  contentType?: string;
  folder: string;
  storedName: string;
};

export type SavedUserUploadFile = {
  key: string;
  storage: UserUploadStorageProvider;
  storedName: string;
  url: string;
};

const DEFAULT_LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getRequestedStorageProvider(): UserUploadStorageProvider {
  const configuredProvider = readEnv("USER_UPLOAD_STORAGE_DRIVER");

  if (!configuredProvider) {
    return process.env.NODE_ENV === "production" ? "r2" : "local";
  }

  if (configuredProvider === "local" || configuredProvider === "r2") {
    return configuredProvider;
  }

  throw new Error("USER_UPLOAD_STORAGE_DRIVER harus bernilai local atau r2.");
}

function getR2Config(): R2Config | null {
  const accountId = readEnv("R2_ACCOUNT_ID");
  const accessKeyId = readEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = readEnv("R2_BUCKET_NAME");
  const publicBaseUrl = readEnv("R2_PUBLIC_BASE_URL")?.replace(/\/+$/, "");
  const endpoint = readEnv("R2_ENDPOINT") ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
  const values = [accountId, accessKeyId, secretAccessKey, bucketName, publicBaseUrl, endpoint];

  if (!values.some(Boolean)) {
    return null;
  }

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl || !endpoint) {
    throw new Error("Konfigurasi R2 belum lengkap. Periksa R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, dan R2_PUBLIC_BASE_URL.");
  }

  return {
    accessKeyId,
    bucketName,
    endpoint,
    publicBaseUrl,
    secretAccessKey
  };
}

function getLocalUploadRoot() {
  return readEnv("USER_UPLOAD_LOCAL_ROOT") ?? DEFAULT_LOCAL_UPLOAD_ROOT;
}

function normalizeObjectSegment(value: string, fallback: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized || fallback;
}

export function createStoredUploadName(fileName: string, options: StoredUploadNameOptions = {}) {
  const originalExt = path.extname(fileName);
  const ext = originalExt.toLowerCase();
  const baseName = normalizeObjectSegment(path.basename(fileName, originalExt), "media").slice(0, 64);
  const timestamp = options.timestamp ?? Date.now();
  const randomId = options.randomId ?? crypto.randomUUID();

  return `${timestamp}-${randomId}-${baseName}${ext}`;
}

export function createUserUploadKey(folder: string, storedName: string) {
  const folderSegments = folder
    .split("/")
    .map((segment) => normalizeObjectSegment(segment, ""))
    .filter(Boolean);
  const safeStoredName = normalizeObjectSegment(storedName, "media");

  if (!folderSegments.length) {
    throw new Error("Folder upload tidak valid.");
  }

  return [...folderSegments, safeStoredName].join("/");
}

function createR2Client(config: R2Config) {
  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    endpoint: config.endpoint,
    region: "auto"
  });
}

async function saveUserUploadBody(input: SaveUserUploadBufferInput): Promise<SavedUserUploadFile> {
  const key = createUserUploadKey(input.folder, input.storedName);
  const contentType = input.contentType || "application/octet-stream";
  const requestedStorageProvider = getRequestedStorageProvider();
  const r2Config = getR2Config();

  if (r2Config) {
    const client = createR2Client(r2Config);
    await client.send(
      new PutObjectCommand({
        Body: input.body,
        Bucket: r2Config.bucketName,
        ContentType: contentType,
        Key: key
      })
    );

    return {
      key,
      storage: "r2",
      storedName: input.storedName,
      url: `${r2Config.publicBaseUrl}/${key}`
    };
  }

  if (requestedStorageProvider === "r2") {
    throw new Error(
      "R2 belum dikonfigurasi untuk upload production. Lengkapi R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, dan R2_PUBLIC_BASE_URL di environment Dokploy."
    );
  }

  const targetPath = path.join(getLocalUploadRoot(), ...key.split("/"));
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, input.body);

  return {
    key,
    storage: "local",
    storedName: input.storedName,
    url: `/uploads/${key}`
  };
}

export async function saveUserUploadBuffer(input: SaveUserUploadBufferInput): Promise<SavedUserUploadFile> {
  return saveUserUploadBody(input);
}

export async function saveUserUploadFile(input: SaveUserUploadFileInput): Promise<SavedUserUploadFile> {
  const storedName = input.storedName ?? createStoredUploadName(input.file.name);
  const body = Buffer.from(await input.file.arrayBuffer());

  return saveUserUploadBody({
    body,
    contentType: input.file.type,
    folder: input.folder,
    storedName
  });
}
