import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  VickreyRankingTable,
  type VickreyRankingRow,
} from "@/components/shared/vickrey-ranking-table";

const rows: VickreyRankingRow[] = [
  {
    id: "bid-1",
    rank: 1,
    bidderName: "Safira Melani",
    bidderImage: "/uploads/safira.webp",
    submittedAtLabel: "31 Mei 2026, 09.00 WIB",
    amountLabel: "Rp 8.800.000",
    statusLabel: "Gagal / Pelanggaran",
    statusKind: "violation",
  },
  {
    id: "bid-2",
    rank: 2,
    bidderName: "Reza Anugrah",
    submittedAtLabel: "31 Mei 2026, 08.54 WIB",
    amountLabel: "Rp 8.450.000",
    statusLabel: "Harga yang Dibayarkan",
    statusKind: "payment",
  },
  {
    id: "bid-3",
    rank: 3,
    bidderName: "Ilham Ramadhan",
    submittedAtLabel: "31 Mei 2026, 08.50 WIB",
    amountLabel: "Rp 8.250.000",
    statusLabel: "Tidak Menang",
    statusKind: "lost",
  },
  {
    id: "bid-4",
    rank: 4,
    bidderName: "Tiara Oktaviani",
    submittedAtLabel: "31 Mei 2026, 08.46 WIB",
    amountLabel: "Rp 8.000.000",
    statusLabel: "Tidak Menang",
    statusKind: "lost",
  },
];

describe("VickreyRankingTable", () => {
  it("renders prominent podium rows and a responsive compact continuation", () => {
    render(
      <VickreyRankingTable
        rows={rows}
        testIdPrefix="shared-ranking"
        title="Bidders Ranking Table (Arsip)"
        totalParticipants={5}
      />,
    );

    const ranking = screen.getByTestId("shared-ranking");
    expect(ranking).toHaveTextContent("Bidders Ranking Table (Arsip)");
    expect(screen.getByTestId("shared-ranking-desktop-header")).toHaveClass(
      "hidden",
      "md:grid",
    );

    for (const rank of [1, 2, 3]) {
      const marker = screen.getByTestId(`shared-ranking-marker-${rank}`);
      const medal = within(marker).getByRole("img", {
        name: `Peringkat ${rank}`,
      });
      expect(decodeURIComponent(medal.getAttribute("src") ?? "")).toContain(
        `/media/ranking/peringkat-${rank}.webp`,
      );
    }

    expect(screen.getByTestId("shared-ranking-row-1")).toHaveClass(
      "md:min-h-[5.75rem]",
    );
    expect(screen.getByTestId("shared-ranking-row-4")).toHaveClass(
      "md:min-h-[4rem]",
    );
    expect(
      screen.getByRole("img", { name: "Foto peserta Safira Melani" }),
    ).toHaveAttribute("src", expect.stringContaining("%2Fuploads%2Fsafira.webp"));
    expect(ranking).toHaveTextContent("Total 5 peserta");
  });
});
