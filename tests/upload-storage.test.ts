import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

describe("upload storage helpers", () => {
  const originalUploadsDir = process.env.UPLOADS_DIR;

  afterEach(() => {
    if (originalUploadsDir === undefined) {
      delete process.env.UPLOADS_DIR;
    } else {
      process.env.UPLOADS_DIR = originalUploadsDir;
    }
  });

  it("uses UPLOADS_DIR for stored files while keeping public /uploads URLs", async () => {
    process.env.UPLOADS_DIR = path.join(process.cwd(), ".tmp-production-uploads");

    const { createUploadWriteTarget, getUploadsRoot } = await import("@/lib/uploads/storage");
    const target = createUploadWriteTarget("serah-terima", "foto serah terima.webp", 12345);

    expect(getUploadsRoot()).toBe(path.resolve(process.cwd(), ".tmp-production-uploads"));
    expect(target.directory).toBe(path.join(process.cwd(), ".tmp-production-uploads", "serah-terima"));
    expect(target.filePath).toBe(path.join(process.cwd(), ".tmp-production-uploads", "serah-terima", "12345-foto-serah-terima.webp"));
    expect(target.publicUrl).toBe("/uploads/serah-terima/12345-foto-serah-terima.webp");
  });

  it("rejects traversal attempts when resolving public upload paths", async () => {
    process.env.UPLOADS_DIR = path.join(process.cwd(), ".tmp-production-uploads");

    const { resolvePublicUploadPath } = await import("@/lib/uploads/storage");

    expect(resolvePublicUploadPath(["serah-terima", "proof.jpg"])).toBe(
      path.join(process.cwd(), ".tmp-production-uploads", "serah-terima", "proof.jpg")
    );
    expect(resolvePublicUploadPath(["..", ".env.local"])).toBeNull();
    expect(resolvePublicUploadPath(["serah-terima", "proof.exe"])).toBeNull();
  });
});
