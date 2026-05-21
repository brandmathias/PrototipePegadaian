import { describe, expect, it } from "vitest";

import {
  APP_TIME_ZONE,
  APP_TIME_ZONE_LABEL,
  formatAppDate,
  formatAppDateTime
} from "@/lib/timezone";

describe("application timezone helpers", () => {
  it("uses WIB as the operational display timezone", () => {
    expect(APP_TIME_ZONE).toBe("Asia/Jakarta");
    expect(APP_TIME_ZONE_LABEL).toBe("WIB");
  });

  it("formats timestamps consistently with the WIB label", () => {
    expect(formatAppDateTime("2026-05-05T04:00:00.000Z")).toMatch(/WIB$/);
    expect(formatAppDate("2026-05-05T04:00:00.000Z")).toContain("5 Mei 2026");
  });
});
