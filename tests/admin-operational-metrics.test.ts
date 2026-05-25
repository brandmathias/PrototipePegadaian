import {
  getAdminInventoryMetrics,
  isAdminMarketingActionable,
  isAdminTransactionActionable
} from "@/lib/admin-unit/operational-metrics";

describe("admin operational metrics", () => {
  const now = new Date("2026-05-25T00:00:00.000Z");

  it("counts due-soon inventory from the due date shown in the table", () => {
    const metrics = getAdminInventoryMetrics(
      [
        { dueDate: "2026-05-31", status: "JAMINAN" },
        { dueDate: "2026-05-31", status: "TERJUAL" },
        { dueDate: "2026-06-17", status: "JAMINAN" }
      ],
      now
    );

    expect(metrics.total).toBe(3);
    expect(metrics.readyForMarketing).toBe(2);
    expect(metrics.dueSoon).toBe(2);
  });

  it("only raises marketing action for ended vickrey sessions", () => {
    expect(
      isAdminMarketingActionable(
        {
          endingAt: "2026-05-24T00:00:00.000Z",
          mode: "VICKREY_AUCTION",
          status: "AKTIF",
          visibility: "MENUNGGU_REVEAL"
        },
        now
      )
    ).toBe(true);

    expect(
      isAdminMarketingActionable(
        {
          endingAt: "2026-05-26T00:00:00.000Z",
          mode: "VICKREY_AUCTION",
          status: "AKTIF",
          visibility: "TERKUNCI"
        },
        now
      )
    ).toBe(false);

    expect(
      isAdminMarketingActionable(
        {
          endingAt: "2026-05-24T00:00:00.000Z",
          mode: "VICKREY_AUCTION",
          status: "SELESAI",
          visibility: "HASIL_DIBUKA"
        },
        now
      )
    ).toBe(false);
  });

  it("only raises transaction action for payment verification states", () => {
    expect(isAdminTransactionActionable({ status: "BUKTI_DIUNGGAH" })).toBe(true);
    expect(isAdminTransactionActionable({ status: "MENUNGGU_KONFIRMASI_LANGSUNG" })).toBe(true);
    expect(isAdminTransactionActionable({ status: "MENUNGGU_PEMBAYARAN" })).toBe(false);
    expect(isAdminTransactionActionable({ status: "LUNAS" })).toBe(false);
  });
});
