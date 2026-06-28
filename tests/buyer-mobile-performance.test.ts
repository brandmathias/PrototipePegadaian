import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

async function source(filePath: string) {
  return readFile(path.join(process.cwd(), filePath), "utf8");
}

describe("buyer mobile performance contracts", () => {
  it("keeps buyer media eager and routes uploaded violation images through next/image", async () => {
    const [transactions, violations] = await Promise.all([
      source("components/buyer/transactions-workspace.tsx"),
      source("components/buyer/buyer-violation-page.tsx")
    ]);

    expect(transactions).not.toContain('loading="lazy"');
    expect(violations).not.toMatch(/<img[\s>]/);
    expect(violations).toContain('loading="eager"');
    expect(violations).toContain('sizes="(max-width: 768px) 100vw, 13rem"');
  });

  it("prioritizes the primary result media without hiding recommendation previews", async () => {
    const [winner, loser] = await Promise.all([
      source("components/buyer/auction-winner-page.tsx"),
      source("components/buyer/auction-loser-page.tsx")
    ]);
    const winnerPrimary = winner.slice(
      winner.indexOf("function ProductVisual"),
      winner.indexOf("export function AuctionWinnerPageContent")
    );
    const loserProduct = loser.slice(
      loser.indexOf("function ProductImage"),
      loser.indexOf("function RecommendationCard")
    );

    expect(winnerPrimary).toContain("priority");
    expect(winnerPrimary).toContain('loading="eager"');
    expect(loserProduct).toContain('loading="eager"');
  });

  it("does not mount a global DOM-scanning reveal observer", async () => {
    const [layout, transitions] = await Promise.all([
      source("app/layout.tsx"),
      source("components/shared/page-transition.tsx")
    ]);

    expect(layout).not.toContain("GlobalScrollReveal");
    expect(transitions).not.toContain("IntersectionObserver");
    expect(transitions).not.toContain("querySelectorAll");
  });

  it("keeps the one-second violation clock inside a countdown leaf component", async () => {
    const violations = await source("components/buyer/buyer-violation-page.tsx");
    const pageComponent = violations.slice(violations.indexOf("export function BuyerViolationPage"));

    expect(violations).toContain("function ViolationCountdown");
    expect(pageComponent).not.toContain("window.setInterval");
    expect(pageComponent).not.toContain("setNow");
  });
});
