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
});
