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

  it("falls back to bundled uploads when a configured volume does not contain legacy media", async () => {
    process.env.UPLOADS_DIR = path.join(process.cwd(), ".tmp-production-uploads");

    const { resolvePublicUploadPaths } = await import("@/lib/uploads/storage");
    const mediaPath = [
      "barang",
      "1779802393082-6a1c43c8-38fa-4494-80dc-0e472127f076-pexels-kenzero14-21928764.jpg"
    ];

    expect(resolvePublicUploadPaths(mediaPath)).toEqual([
      path.join(process.cwd(), ".tmp-production-uploads", ...mediaPath),
      path.join(process.cwd(), "public", "uploads", ...mediaPath)
    ]);
  });

  it("serves bundled legacy media when the persistent volume is empty", async () => {
    process.env.UPLOADS_DIR = path.join(process.cwd(), ".tmp-production-uploads");

    const fileName =
      "1779802393085-3c5f13ca-a6a5-432e-9ac7-83b4428e69a6-pexels-arjunadinata-32266896.jpg";
    const { HEAD } = await import("@/app/uploads/[...path]/route");
    const response = await HEAD(new Request(`http://localhost/uploads/barang/${fileName}`), {
      params: Promise.resolve({ path: ["barang", fileName] })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("content-length")).toBe("162845");
  });
});
