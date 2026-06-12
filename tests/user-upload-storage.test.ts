import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const sendMock = vi.fn();
const putObjectCommandMock = vi.fn((input) => ({ input }));

vi.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: putObjectCommandMock,
  S3Client: vi.fn(() => ({ send: sendMock }))
}));

function createUploadFile(content: string, name: string, type: string) {
  const buffer = Buffer.from(content);

  return {
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    name,
    size: buffer.byteLength,
    type
  } as File;
}

describe("user upload storage", () => {
  let tempRoot: string;

  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    sendMock.mockReset();
    putObjectCommandMock.mockClear();
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "pegadaian-user-upload-"));
    vi.stubEnv("USER_UPLOAD_LOCAL_ROOT", tempRoot);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(tempRoot, { force: true, recursive: true });
  });

  test("stores uploads locally when R2 environment is not configured", async () => {
    const { saveUserUploadFile } = await import("@/lib/storage/user-upload-storage");
    const file = createUploadFile("bukti transfer", "bukti transfer.png", "image/png");

    const result = await saveUserUploadFile({
      file,
      folder: "bukti",
      storedName: "payment-proof.png"
    });

    expect(result).toEqual({
      key: "bukti/payment-proof.png",
      storage: "local",
      storedName: "payment-proof.png",
      url: "/uploads/bukti/payment-proof.png"
    });
    await expect(readFile(path.join(tempRoot, "bukti", "payment-proof.png"), "utf8")).resolves.toBe(
      "bukti transfer"
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("uploads to R2 and returns the configured public URL when R2 env is complete", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "account-id");
    vi.stubEnv("R2_ACCESS_KEY_ID", "access-key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret-key");
    vi.stubEnv("R2_BUCKET_NAME", "tugasprototype-user-uploads");
    vi.stubEnv("R2_PUBLIC_BASE_URL", "https://pub-example.r2.dev");

    const { saveUserUploadFile } = await import("@/lib/storage/user-upload-storage");
    const file = createUploadFile("foto barang", "Cincin Emas.png", "image/png");

    const result = await saveUserUploadFile({
      file,
      folder: "barang",
      storedName: "cincin-emas.png"
    });

    expect(result).toEqual({
      key: "barang/cincin-emas.png",
      storage: "r2",
      storedName: "cincin-emas.png",
      url: "https://pub-example.r2.dev/barang/cincin-emas.png"
    });
    expect(putObjectCommandMock).toHaveBeenCalledWith({
      Body: Buffer.from("foto barang"),
      Bucket: "tugasprototype-user-uploads",
      ContentType: "image/png",
      Key: "barang/cincin-emas.png"
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  test("can store existing files from a Buffer for migration scripts", async () => {
    const { saveUserUploadBuffer } = await import("@/lib/storage/user-upload-storage");

    const result = await saveUserUploadBuffer({
      body: Buffer.from("old proof"),
      contentType: "image/jpeg",
      folder: "bukti",
      storedName: "old-proof.jpg"
    });

    expect(result).toEqual({
      key: "bukti/old-proof.jpg",
      storage: "local",
      storedName: "old-proof.jpg",
      url: "/uploads/bukti/old-proof.jpg"
    });
    await expect(readFile(path.join(tempRoot, "bukti", "old-proof.jpg"), "utf8")).resolves.toBe("old proof");
  });

  test("sanitizes generated object names while preserving the extension", async () => {
    const { createStoredUploadName } = await import("@/lib/storage/user-upload-storage");

    const storedName = createStoredUploadName("Bukti Transfer Final!!.PDF", {
      randomId: "abc-123",
      timestamp: 1_718_000_000_000
    });

    expect(storedName).toBe("1718000000000-abc-123-bukti-transfer-final.pdf");
  });
});
