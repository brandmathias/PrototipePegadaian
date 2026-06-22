import React from "react";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import {
  AdminInventoryHistoryWorkspace,
  AdminInventoryWorkspace
} from "@/components/admin/admin-inventory-workspace";

function expectPaginationCopy(text: string) {
  expect(
    screen.getByText((_, node) => {
      const normalized = node?.textContent?.replace(/\s+/g, " ").trim().toLowerCase();

      return node?.tagName.toLowerCase() === "p" && normalized === text.toLowerCase();
    })
  ).toBeInTheDocument();
}

function makeItem(index: number) {
  return {
    id: `barang-${index}`,
    code: `BRG-${String(index).padStart(3, "0")}`,
    name: `Barang Demo ${index}`,
    category: index % 2 === 0 ? "emas" : "kendaraan",
    condition: "baik",
    ownerName: `Nasabah ${index}`,
    customerNumber: `NSB-${String(index).padStart(4, "0")}`,
    pawnedAt: "2026-05-01",
    dueDate: "2026-06-01",
    appraisalValue: 10_000_000 + index,
    status: "JAMINAN"
  };
}

describe("AdminInventoryWorkspace", () => {
  it("keeps process status out of the inventory table", () => {
    render(<AdminInventoryWorkspace items={Array.from({ length: 3 }, (_, index) => makeItem(index + 1))} />);

    const detailLink = screen.getAllByRole("link", { name: /lihat detail/i })[0];
    expect(detailLink).toHaveAttribute("href", "/admin/barang/barang-1");
    expect(detailLink).toHaveClass("hover:bg-[#006747]", "hover:text-white");
    expect(screen.queryByText("Semua Status")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /status/i })).not.toBeInTheDocument();
    expect(screen.queryByText("JAMINAN")).not.toBeInTheDocument();
    expect(screen.queryByText("GAGAL")).not.toBeInTheDocument();
    expect(screen.queryByText(/pencarian langsung/i)).not.toBeInTheDocument();
  });

  it("keeps failed auctions ready for remarketing while hiding marketed and finished goods", () => {
    render(
      <AdminInventoryWorkspace
        items={[
          makeItem(1),
          { ...makeItem(2), id: "barang-failed", code: "BRG-FAILED", name: "Barang Gagal Lelang", status: "GAGAL" },
          { ...makeItem(2), id: "barang-marketed", code: "BRG-MARKET", name: "Barang Sudah Dipasarkan", status: "DIPASARKAN" },
          { ...makeItem(3), id: "barang-waiting", code: "BRG-WAIT", name: "Barang Menunggu Pembayaran", status: "MENUNGGU_PEMBAYARAN" },
          { ...makeItem(4), id: "barang-sold", code: "BRG-SOLD", name: "Barang Terjual", status: "TERJUAL" }
        ]}
      />
    );

    expect(screen.getByText("BRG-001")).toBeInTheDocument();
    expect(screen.getByText("BRG-FAILED")).toBeInTheDocument();
    expect(screen.queryByText("BRG-MARKET")).not.toBeInTheDocument();
    expect(screen.queryByText("BRG-WAIT")).not.toBeInTheDocument();
    expect(screen.queryByText("BRG-SOLD")).not.toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent?.replace(/\s+/g, " ").trim() === "Menampilkan 2 dari 2 barang.")).toBeInTheDocument();
  });

  it("paginates inventory rows without rendering every item at once", () => {
    render(<AdminInventoryWorkspace items={Array.from({ length: 11 }, (_, index) => makeItem(index + 1))} />);

    expectPaginationCopy("Menampilkan 1 sampai 10 dari 11 barang");
    expect(screen.getByText("BRG-001")).toBeInTheDocument();
    expect(screen.queryByText("BRG-011")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expectPaginationCopy("Menampilkan 11 sampai 11 dari 11 barang");
    expect(screen.getByText("BRG-011")).toBeInTheDocument();
  });

  it("filters inventory by ready-for-marketing items", () => {
    render(
      <AdminInventoryWorkspace
        items={[
          makeItem(1),
          makeItem(2),
          { ...makeItem(3), status: "GAGAL" },
          makeItem(4)
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /siap dipasarkan/i }));

    expect(screen.getByText("BRG-001")).toBeInTheDocument();
    expect(screen.getByText("BRG-003")).toBeInTheDocument();
  });

  it("sorts inventory rows by due date from the header control", () => {
    render(
      <AdminInventoryWorkspace
        items={[
          { ...makeItem(1), id: "barang-far", code: "BRG-FAR", name: "Barang Tempo Jauh", dueDate: "2026-07-01" },
          { ...makeItem(2), id: "barang-near", code: "BRG-NEAR", name: "Barang Tempo Dekat", dueDate: "2026-06-01" }
        ]}
      />
    );

    const nearRow = screen.getByText("Barang Tempo Dekat");
    const farRow = screen.getByText("Barang Tempo Jauh");

    expect(nearRow.compareDocumentPosition(farRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /urutkan jatuh tempo/i }));

    expect(farRow.compareDocumentPosition(nearRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("AdminInventoryHistoryWorkspace", () => {
  it("filters history by operational process", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-1",
            barangId: "barang-1",
            barangCode: "BRG-001",
            barangName: "Motor Racing",
            ownerName: "Rizki",
            customerNumber: "9018",
            actionKey: "input_baru",
            actionLabel: "Barang Masuk",
            actionTone: "default",
            note: "Barang masuk dari unit.",
            actorName: "Admin Unit",
            createdAt: "2026-05-25T00:00:00.000Z",
            createdAtLabel: "25 Mei 2026"
          },
          {
            id: "hist-2",
            barangId: "barang-2",
            barangCode: "BRG-002",
            barangName: "Kalung Emas",
            ownerName: "Brando",
            customerNumber: "56789",
            actionKey: "ditebus",
            actionLabel: "Ditebus",
            actionTone: "warning",
            note: "Nasabah menebus barang.",
            actorName: "Admin Unit",
            createdAt: "2026-05-26T00:00:00.000Z",
            createdAtLabel: "26 Mei 2026"
          }
        ]}
      />
    );

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "ditebus" } });

    expect(screen.getByText("Kalung Emas")).toBeInTheDocument();
    expect(screen.queryByText("Motor Racing")).not.toBeInTheDocument();
  });

  it("opens the timeline calendar popover with shortcut and calendar panels", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-calendar",
            barangId: "barang-calendar",
            barangCode: "BRG-CAL",
            barangName: "Ipad Terbaru",
            category: "elektronik",
            condition: "baik",
            description: "Tablet Apple iPad Pro 11-inch.",
            specifications: { jenis: "tablet", merek: "Apple" },
            ownerName: "Budi Santoso",
            customerNumber: "0812-3456-7890",
            actionKey: "input_baru",
            actionLabel: "Barang Masuk",
            actionTone: "default",
            note: "Barang masuk dari unit.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-31T01:12:33.000Z",
            createdAtLabel: "31 Mei 2026, 09:12:33 WIB"
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /linimasa/i }));

    expect(screen.getByText("Shortcut Periode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bulan sebelumnya" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bulan berikutnya" })).toBeInTheDocument();
  });

  it("sorts history rows by process time from the header control", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-old",
            barangId: "barang-old",
            barangCode: "BRG-OLD",
            barangName: "Barang Lama",
            category: "elektronik",
            condition: "baik",
            description: "Riwayat lama.",
            specifications: { jenis: "tablet" },
            ownerName: "Budi Santoso",
            customerNumber: "0812-1111-1111",
            actionKey: "input_baru",
            actionLabel: "Barang Masuk",
            actionTone: "default",
            note: "Barang masuk lebih awal.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-25T01:00:00.000Z",
            createdAtLabel: "25 Mei 2026"
          },
          {
            id: "hist-new",
            barangId: "barang-new",
            barangCode: "BRG-NEW",
            barangName: "Barang Baru",
            category: "elektronik",
            condition: "baik",
            description: "Riwayat baru.",
            specifications: { jenis: "tablet" },
            ownerName: "Siti Rahmawati",
            customerNumber: "0812-2222-2222",
            actionKey: "dipasarkan",
            actionLabel: "Dipasarkan",
            actionTone: "success",
            note: "Barang dipasarkan belakangan.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-31T01:00:00.000Z",
            createdAtLabel: "31 Mei 2026"
          }
        ]}
      />
    );

    const oldRow = screen.getByText("Barang Lama");
    const newRow = screen.getByText("Barang Baru");
    expect(newRow.compareDocumentPosition(oldRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /urutkan waktu proses/i }));

    expect(oldRow.compareDocumentPosition(newRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders and filters sold and failed item history entries", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-sold",
            barangId: "barang-sold",
            barangCode: "BRG-SOLD",
            barangName: "Cincin Terjual",
            category: "perhiasan",
            condition: "baik",
            description: "Barang berhasil terjual.",
            specifications: { jenis: "cincin" },
            ownerName: "Budi Santoso",
            customerNumber: "NSB-001",
            actionKey: "terjual",
            actionLabel: "Terjual",
            actionTone: "success",
            note: "Pembayaran harga tetap disetujui admin unit.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-06-03T02:00:00.000Z",
            createdAtLabel: "3 Jun 2026, 10.00 WIB"
          },
          {
            id: "hist-failed",
            barangId: "barang-failed",
            barangCode: "BRG-FAILED",
            barangName: "Ipad Gagal",
            category: "elektronik",
            condition: "baik",
            description: "Barang gagal diproses.",
            specifications: { jenis: "tablet" },
            ownerName: "Siti Rahmawati",
            customerNumber: "NSB-002",
            actionKey: "gagal",
            actionLabel: "Gagal",
            actionTone: "danger",
            note: "Verifikasi bukti harga tetap ditolak admin unit.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-06-03T03:00:00.000Z",
            createdAtLabel: "3 Jun 2026, 11.00 WIB"
          }
        ]}
      />
    );

    expect(screen.getAllByText("Terjual").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gagal").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Filter proses riwayat barang"), { target: { value: "gagal" } });

    expect(screen.getByText("Ipad Gagal")).toBeInTheDocument();
    expect(screen.queryByText("Cincin Terjual")).not.toBeInTheDocument();
  });

  it("renders the history ledger with compact public-facing columns", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-layout",
            barangId: "barang-layout",
            barangCode: "BRG-LAYOUT",
            barangName: "Ipad Terbaru",
            category: "elektronik",
            condition: "baik",
            description: "Tablet Apple iPad Pro 11-inch.",
            specifications: { jenis: "tablet", merek: "Apple" },
            ownerName: "Budi Santoso",
            customerNumber: "0812-3456-7890",
            actionKey: "input_baru",
            actionLabel: "Barang Masuk",
            actionTone: "default",
            note: "Barang masuk dari unit.",
            actorName: "Operator Arsip",
            actorRole: "admin_unit",
            createdAt: "2026-05-31T01:12:33.000Z",
            createdAtLabel: "31 Mei 2026, 09:12:33 WIB"
          }
        ]}
      />
    );

    expect(screen.getByText("Informasi Barang")).toBeInTheDocument();
    expect(screen.queryByText("Komoditas Jaminan")).not.toBeInTheDocument();
    expect(screen.queryByText("Aktor Internal")).not.toBeInTheDocument();
    expect(screen.queryByText("Operator Arsip")).not.toBeInTheDocument();
    expect(screen.getByText("31 Mei 2026, 09:12:33 WIB")).not.toHaveClass("font-mono");
    expect(screen.getByRole("link", { name: /lihat detail/i })).toHaveClass(
      "hover:bg-[#006747]",
      "hover:text-white"
    );

    const searchInput = screen.getByPlaceholderText(
      "Cari barang, nasabah, atau staf penginput"
    );
    const timelineButton = screen.getByRole("button", { name: /Linimasa:/i });
    expect(searchInput.parentElement?.parentElement).not.toContainElement(timelineButton);
    expect(timelineButton.querySelector(".truncate")).toBeNull();

    const resetButton = screen.getByRole("button", { name: /reset filter/i });
    expect(resetButton).not.toHaveClass("hover:-translate-y-0.5");
    expect(screen.getByRole("button", { name: /^cetak$/i }).querySelector("svg")).toHaveClass("size-5");
  });

  it("prepares a same-page printable audit report before opening native print preview", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-print",
            barangId: "barang-print",
            barangCode: "BRG-PRINT",
            barangName: "Ipad Terbaru Dengan Nama Panjang",
            category: "elektronik",
            condition: "baik",
            description: "Tablet Apple iPad Pro 11-inch dengan catatan audit panjang yang harus tetap terlihat.",
            specifications: { jenis: "tablet", merek: "Apple" },
            ownerName: "Budi Santoso",
            customerNumber: "0812-3456-7890",
            actionKey: "dipasarkan",
            actionLabel: "Dipasarkan",
            actionTone: "success",
            note: "Barang dipublikasikan ke katalog dengan catatan proses yang cukup panjang.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-06-01T13:47:00.000Z",
            createdAtLabel: "1 Jun 2026, 21.47 WIB"
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^cetak$/i }));

    await waitFor(() => expect(printSpy).toHaveBeenCalledTimes(1));
    expect(openSpy).not.toHaveBeenCalled();

    const report = screen.getByTestId("admin-history-print-document");
    expect(report).toHaveTextContent("Laporan Riwayat Barang");
    expect(report).toHaveTextContent("Informasi Barang");
    expect(report).toHaveTextContent("Ipad Terbaru Dengan Nama Panjang");
    expect(report).not.toHaveTextContent("Tablet Apple iPad Pro 11-inch dengan catatan audit panjang yang harus tetap terlihat.");
    expect(report).toHaveTextContent("Barang dipublikasikan ke katalog dengan catatan proses yang cukup panjang.");
    expect(report).toHaveTextContent("Dokumen ini dihasilkan otomatis dari sistem Ruang Agunan");
    expect(report).toHaveTextContent("Admin Unit");
    expect(report).not.toHaveTextContent("Aktor Internal");

    const reportClasses = Array.from(report.querySelectorAll("[class]"))
      .map((element) => element.getAttribute("class") ?? "")
      .join(" ");
    expect(reportClasses).not.toMatch(/\b(truncate|line-clamp|overflow-hidden)\b/);
    expect(reportClasses).toContain("print:grid-cols-[minmax(0,1fr)_15.75rem]");
    expect(reportClasses).toContain("print:grid-cols-4");
    expect(reportClasses).toContain("print:grid-cols-[1fr_1fr_1fr_1.35fr]");
    expect(reportClasses).toContain("admin-history-print-header-grid");
    expect(reportClasses).toContain("admin-history-print-metrics-grid");
    expect(reportClasses).toContain("admin-history-print-filter-grid");
    expect(reportClasses).toContain("admin-history-print-table");
    expect(reportClasses).toContain("bg-[linear-gradient(100deg,#00513d_0%,#056a49_58%,#b29216_100%)]");
    expect(reportClasses).toContain(
      "bg-[linear-gradient(135deg,rgba(245,246,198,0.30),rgba(185,165,58,0.36))]"
    );

    const printCss = readFileSync("app/globals.css", "utf8");
    expect(printCss).toContain("size: auto;");
    expect(printCss).toContain("@media print and (orientation: portrait)");
    expect(printCss).toContain(".admin-history-print-table th:nth-child(6)");
    expect(printCss).not.toContain("size: A4 landscape");

    printSpy.mockRestore();
    openSpy.mockRestore();
  });

  it("filters history by synced item categories", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-logam",
            barangId: "barang-logam",
            barangCode: "BRG-LGM",
            barangName: "Koin Antam",
            category: "logam_mulia",
            condition: "baik",
            description: "Barang logam mulia masuk ke unit.",
            specifications: { jenis: "emas batangan", berat: "10 gram" },
            ownerName: "Rizki",
            customerNumber: "9018",
            actionKey: "input_baru",
            actionLabel: "Barang Masuk",
            actionTone: "default",
            note: "Barang masuk dari unit.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-25T00:00:00.000Z",
            createdAtLabel: "25 Mei 2026"
          },
          {
            id: "hist-elektronik",
            barangId: "barang-elektronik",
            barangCode: "BRG-ELK",
            barangName: "Laptop Kerja",
            category: "elektronik",
            condition: "baik",
            description: "Barang elektronik dipasarkan.",
            specifications: { merek: "Lenovo", model: "ThinkPad" },
            ownerName: "Brando",
            customerNumber: "56789",
            actionKey: "dipasarkan",
            actionLabel: "Dipasarkan",
            actionTone: "success",
            note: "Barang masuk katalog.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-05-26T00:00:00.000Z",
            createdAtLabel: "26 Mei 2026"
          }
        ]}
      />
    );

    const categorySelect = screen.getByLabelText("Filter kategori riwayat barang");
    const categoryTrigger = categorySelect.closest(".admin-select-root")?.querySelector("button");

    expect(categoryTrigger?.querySelectorAll("svg")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Logam Mulia" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Elektronik" })).toBeInTheDocument();

    fireEvent.change(categorySelect, { target: { value: "elektronik" } });

    expect(screen.getByText("Laptop Kerja")).toBeInTheDocument();
    expect(screen.queryByText("Koin Antam")).not.toBeInTheDocument();
  });
});
