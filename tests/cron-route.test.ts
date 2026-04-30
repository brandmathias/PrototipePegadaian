import { beforeEach, describe, expect, it, vi } from "vitest";

const runAuctionSettlementCron = vi.fn();

vi.mock("@/lib/services/cron.service", () => ({
  runAuctionSettlementCron
}));

describe("cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
  });

  it("rejects request without valid bearer secret", async () => {
    const { POST } = await import("@/app/api/cron/proses-lelang/route");
    const response = await POST(
      new Request("http://localhost:3000/api/cron/proses-lelang", {
        method: "POST",
        headers: {
          Authorization: "Bearer salah"
        }
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      message: "Akses cron ditolak."
    });
    expect(runAuctionSettlementCron).not.toHaveBeenCalled();
  });

  it("runs cron service when bearer secret is valid", async () => {
    runAuctionSettlementCron.mockResolvedValueOnce({
      expiredAuctions: {
        processed: 2,
        completed: 1,
        failed: 1
      },
      overduePayments: {
        processed: 1,
        blacklisted: 1
      }
    });

    const { POST } = await import("@/app/api/cron/proses-lelang/route");
    const response = await POST(
      new Request("http://localhost:3000/api/cron/proses-lelang", {
        method: "POST",
        headers: {
          Authorization: "Bearer cron-secret"
        }
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        expiredAuctions: {
          processed: 2,
          completed: 1,
          failed: 1
        },
        overduePayments: {
          processed: 1,
          blacklisted: 1
        }
      }
    });
    expect(runAuctionSettlementCron).toHaveBeenCalledTimes(1);
  });

  it("also allows GET for platform scheduled invocations", async () => {
    runAuctionSettlementCron.mockResolvedValueOnce({
      expiredAuctions: {
        processed: 1,
        completed: 1,
        failed: 0
      },
      overduePayments: {
        processed: 0,
        blacklisted: 0
      }
    });

    const { GET } = await import("@/app/api/cron/proses-lelang/route");
    const response = await GET(
      new Request("http://localhost:3000/api/cron/proses-lelang", {
        method: "GET",
        headers: {
          Authorization: "Bearer cron-secret"
        }
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        expiredAuctions: {
          processed: 1,
          completed: 1,
          failed: 0
        }
      }
    });
  });
});
