import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

describe("production cron scheduler", () => {
  it("starts the protected settlement cron inside the Dokploy container", () => {
    const startup = readFileSync(join(process.cwd(), "scripts", "start-production.mjs"), "utf8");
    const dockerfile = readFileSync(join(process.cwd(), "Dockerfile"), "utf8");

    expect(startup).toContain("startProductionCronScheduler");
    expect(startup).toContain("process.env.CRON_SECRET");
    expect(dockerfile).toContain("production-cron-scheduler.mjs");
  });

  it("runs once after startup and repeats every five minutes with the cron secret", async () => {
    const schedulerUrl = pathToFileURL(
      join(process.cwd(), "scripts", "production-cron-scheduler.mjs"),
    ).href;
    const { startProductionCronScheduler } = await import(schedulerUrl);
    const scheduledTimeouts: Array<() => Promise<void>> = [];
    const scheduledIntervals: Array<() => Promise<void>> = [];
    const fetchCalls: Array<[string, RequestInit]> = [];

    startProductionCronScheduler({
      secret: "cron-secret",
      port: "3000",
      fetchImpl: async (url: string, init: RequestInit) => {
        fetchCalls.push([url, init]);
        return new Response(JSON.stringify({ data: { handoverAutoCompletions: { completed: 2 } } }));
      },
      setTimeoutImpl: (callback: () => Promise<void>, delay: number) => {
        expect(delay).toBe(10_000);
        scheduledTimeouts.push(callback);
        return 1;
      },
      setIntervalImpl: (callback: () => Promise<void>, delay: number) => {
        expect(delay).toBe(300_000);
        scheduledIntervals.push(callback);
        return 2;
      },
    });

    await scheduledTimeouts[0]();
    await scheduledIntervals[0]();

    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0]).toEqual([
      "http://127.0.0.1:3000/api/cron/proses-lelang",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer cron-secret",
        },
      },
    ]);
  });
});
