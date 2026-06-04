import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn()
  }
}));

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

import { listAdminBlacklistReviewCases } from "@/lib/services/blacklist-review.service";

describe("listAdminBlacklistReviewCases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockCaseQuery(rows: Array<Record<string, unknown>>) {
    const chain = {
      innerJoin: vi.fn(),
      leftJoin: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn()
    };
    chain.innerJoin.mockReturnValue(chain);
    chain.leftJoin.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    chain.orderBy.mockResolvedValue(rows);

    return {
      from: vi.fn().mockReturnValue(chain)
    };
  }

  function mockAttachmentQuery(rows: Array<Record<string, unknown>>) {
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(rows)
        })
      })
    };
  }

  it("returns buyer statement and attachments for admin-unit review cases", async () => {
    mocks.db.select
      .mockImplementationOnce(() =>
        mockCaseQuery([
          {
            caseRow: {
              id: "case-1",
              incidentId: "incident-1",
              status: "TERKIRIM",
              submittedAt: new Date("2026-06-04T01:00:00.000Z"),
              buyerStatement:
                "Saya sudah melakukan pembayaran dan mohon review ulang insiden ini.",
              adminRecommendation: null,
              adminRecommendationNote: null
            },
            buyer: {
              name: "Raras Mahesa",
              email: "raras@example.com"
            },
            item: {
              code: "BRG-32807701",
              name: "Kalung Emas"
            },
            auction: {
              mode: "VICKREY_AUCTION"
            },
            transaction: {
              status: "gagal_bayar",
              amount: "90000000",
              paymentDeadline: new Date("2026-05-30T08:30:00.000Z")
            },
            incident: {
              id: "incident-1",
              note: "Pemenang lelang tidak menyelesaikan pembayaran dalam 24 jam.",
              createdAt: new Date("2026-05-29T08:30:00.000Z")
            },
            media: {
              url: "/uploads/barang/kalung-emas.jpg",
              fileName: "kalung-emas.jpg"
            },
            unit: {
              name: "UPC Ranotana"
            }
          }
        ])
      )
      .mockImplementationOnce(() =>
        mockAttachmentQuery([
          {
            id: "att-1",
            fileUrl: "/uploads/blacklist-review/bukti-transfer.pdf",
            fileName: "bukti-transfer.pdf",
            mimeType: "application/pdf",
            uploadedAt: new Date("2026-06-04T01:05:00.000Z")
          }
        ])
      );

    const result = await listAdminBlacklistReviewCases("unit-1");

    expect(result).toEqual([
      expect.objectContaining({
        id: "case-1",
        buyerStatement:
          "Saya sudah melakukan pembayaran dan mohon review ulang insiden ini.",
        incident: expect.objectContaining({
          note: "Pemenang lelang tidak menyelesaikan pembayaran dalam 24 jam.",
          auctionMode: "VICKREY_AUCTION",
          transactionStatus: "gagal_bayar",
          amount: 90000000,
          itemImageUrl: "/uploads/barang/kalung-emas.jpg"
        }),
        attachments: [
          expect.objectContaining({
            id: "att-1",
            fileUrl: "/uploads/blacklist-review/bukti-transfer.pdf",
            fileName: "bukti-transfer.pdf",
            mimeType: "application/pdf"
          })
        ]
      })
    ]);
  });
});
