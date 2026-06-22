import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Docker upload packaging", () => {
  it("keeps tracked fallback uploads in the Docker build context", async () => {
    const dockerIgnore = await readFile(path.join(process.cwd(), ".dockerignore"), "utf8");
    const ignoredPaths = dockerIgnore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    expect(ignoredPaths).not.toContain("public/uploads/barang");
    expect(ignoredPaths).not.toContain("public/uploads/bukti");
    expect(ignoredPaths).not.toContain("public/uploads/blacklist-review");
    expect(ignoredPaths).not.toContain("public/uploads/serah-terima");
  });

  it("moves recovery media outside the persistent mount before the Next build", async () => {
    const dockerfile = await readFile(path.join(process.cwd(), "Dockerfile"), "utf8");
    const moveUploadsAt = dockerfile.indexOf("/app/public/uploads /app/bundled-uploads");
    const buildAt = dockerfile.indexOf("RUN npm run build");

    expect(dockerfile).toContain("ENV BUNDLED_UPLOADS_DIR=/app/bundled-uploads");
    expect(moveUploadsAt).toBeGreaterThan(-1);
    expect(moveUploadsAt).toBeLessThan(buildAt);
    expect(dockerfile).toContain("/app/bundled-uploads ./bundled-uploads");
  });
});
