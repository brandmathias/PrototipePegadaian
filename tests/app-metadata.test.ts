import { describe, expect, it } from "vitest";

import { metadata } from "@/app/layout";

describe("app metadata", () => {
  it("uses non-technical share copy and includes share images", () => {
    const description = String(metadata.description ?? "");
    const icons = metadata.icons as { icon?: Array<{ url?: string }> } | undefined;

    expect(description.toLowerCase()).toContain("prototipe");
    expect(description).not.toContain("Next.js");
    expect(description).not.toContain("shadcn");
    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alt: expect.stringContaining("Prototipe"),
          url: "/opengraph-image"
        })
      ])
    );
    expect(icons?.icon).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "/icon.svg"
        })
      ])
    );
  });
});
