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

  it("keeps failed marketed goods out of daftar barang and siap dipasarkan", () => {
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
    expect(screen.queryByText("BRG-FAILED")).not.toBeInTheDocument();
    expect(screen.queryByText("BRG-MARKET")).not.toBeInTheDocument();
    expect(screen.queryByText("BRG-WAIT")).not.toBeInTheDocument();
    expect(screen.queryByText("BRG-SOLD")).not.toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent?.replace(/\s+/g, " ").trim() === "Menampilkan 1 dari 1 barang.")).toBeInTheDocument();
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
    expect(screen.getByText("BRG-002")).toBeInTheDocument();
    expect(screen.queryByText("BRG-003")).not.toBeInTheDocument();
    expect(screen.getByText("BRG-004")).toBeInTheDocument();
  });

  it("shows precisely expired collateral as overdue and keeps it in the due-soon filter", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T11:57:00.000Z"));

    try {
      render(
        <AdminInventoryWorkspace
          items={[
            {
              ...makeItem(1),
              code: "BRG-EXPIRED",
              dueDate: "2026-05-01",
              dueAt: "2026-05-01T10:57:00.000Z",
            },
            { ...makeItem(2), code: "BRG-FUTURE", dueDate: "2099-05-01", dueAt: "2099-05-01T10:57:00.000Z" },
          ]}
        />,
      );

      expect(screen.getByText("Lewat jatuh tempo")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /jatuh tempo dekat/i }));

      expect(screen.getByText("BRG-EXPIRED")).toBeInTheDocument();
      expect(screen.queryByText("BRG-FUTURE")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("wraps item names and aligns inventory table headers with their cells", () => {
    render(
      <AdminInventoryWorkspace
        items={[
          {
            ...makeItem(1),
            name: "Mobil Smart Forfour Passion 1.0 AT Tahun 2016 Warna Biru Kondisi Sangat Baik"
          }
        ]}
      />
    );

    const itemName = screen.getByText("Mobil Smart Forfour Passion 1.0 AT Tahun 2016 Warna Biru Kondisi Sangat Baik");
    expect(itemName).not.toHaveClass("truncate");
    expect(itemName).toHaveClass("whitespace-normal", "break-words", "text-left");

    expect(screen.getByRole("columnheader", { name: "Barang" })).toHaveClass("text-left");
    expect(screen.getByRole("columnheader", { name: "Kategori" })).toHaveClass("text-center");
    expect(screen.getByRole("columnheader", { name: "No. Nasabah" })).toHaveClass("text-center");
    expect(screen.getByRole("columnheader", { name: "Nilai Taksiran" })).toHaveClass("text-right");
    expect(screen.getByRole("columnheader", { name: "Aksi" })).toHaveClass("text-center");
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
            ownerName: "Rizki Pratama",
            customerNumber: "0812000009018",
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
            ownerName: "Brando Mahendra",
            customerNumber: "0812000056789",
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

    const statusBadge = screen.getAllByText("Barang Masuk").find((element) => element.tagName.toLowerCase() === "div");
    const historyRow = screen.getByText("Motor Racing").closest('[class*="lg:grid-cols-"]');
    const infoCell = screen.getByText("Motor Racing").closest('[class*="lg:pl-2"]');
    const headerRow = screen.getByText("Informasi Barang").closest('[class*="lg:grid-cols-"]');
    const infoHeader = screen.getByText("Informasi Barang").closest('[class*="lg:pl-2"]');

    expect(statusBadge).toHaveClass("whitespace-nowrap");
    expect(statusBadge).toHaveClass("min-w-[7.5rem]");
    expect(headerRow).toHaveClass("gap-2.5");
    expect(headerRow).toHaveClass(
      "lg:grid-cols-[minmax(12.5rem,1.12fr)_9.1rem_minmax(10.8rem,0.9fr)_8.8rem_minmax(10.4rem,0.82fr)_minmax(12.8rem,1fr)_6.7rem]"
    );
    expect(infoHeader).toHaveClass("lg:pl-2");
    expect(historyRow).toHaveClass(
      "lg:grid-cols-[minmax(12.5rem,1.12fr)_9.1rem_minmax(10.8rem,0.9fr)_8.8rem_minmax(10.4rem,0.82fr)_minmax(12.8rem,1fr)_6.7rem]"
    );
    expect(infoCell).toHaveClass("lg:pl-2");
    expect(screen.queryByRole("link", { name: "Edit Data" })).not.toBeInTheDocument();

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "ditebus" } });

    expect(screen.getByText("Kalung Emas")).toBeInTheDocument();
    expect(screen.queryByText("Motor Racing")).not.toBeInTheDocument();
  });

  it("keeps history filters limited to the six agreed operational processes", () => {
    render(<AdminInventoryHistoryWorkspace history={[]} />);

    const processFilter = screen.getByLabelText("Filter proses riwayat barang");
    const labels = Array.from(processFilter.querySelectorAll("option")).map((option) => option.textContent);

    expect(labels).toEqual([
      "Semua Proses",
      "Barang Masuk",
      "Perpanjang",
      "Tebus",
      "Dipasarkan",
      "Terjual",
      "Gagal"
    ]);
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
            customerNumber: "0812-3456-78901",
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

    expect(screen.getByText("Periode")).toBeInTheDocument();
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
            customerNumber: "0812-1111-11111",
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
            customerNumber: "0812-2222-22222",
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

  it("uses distinct operational badge colors for each item history status", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-market",
            barangId: "barang-market",
            barangCode: "BRG-MKT",
            barangName: "Kalung Dipasarkan",
            category: "perhiasan",
            condition: "baik",
            description: "Barang dipasarkan.",
            specifications: { jenis: "kalung" },
            ownerName: "Andi Wijaya",
            customerNumber: "NSB-MKT",
            actionKey: "dipasarkan",
            actionLabel: "Dipasarkan",
            actionTone: "success",
            note: "Barang dipublikasikan ke katalog.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-06-03T01:00:00.000Z",
            createdAtLabel: "3 Jun 2026, 09.00 WIB"
          },
          {
            id: "hist-sold-tone",
            barangId: "barang-sold-tone",
            barangCode: "BRG-SLD",
            barangName: "Cincin Terjual",
            category: "perhiasan",
            condition: "baik",
            description: "Barang terjual.",
            specifications: { jenis: "cincin" },
            ownerName: "Budi Santoso",
            customerNumber: "NSB-SLD",
            actionKey: "terjual",
            actionLabel: "Terjual",
            actionTone: "success",
            note: "Barang tercatat terjual.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-06-03T02:00:00.000Z",
            createdAtLabel: "3 Jun 2026, 10.00 WIB"
          },
          {
            id: "hist-redeemed-tone",
            barangId: "barang-redeemed-tone",
            barangCode: "BRG-RDM",
            barangName: "Gelang Ditebus",
            category: "perhiasan",
            condition: "baik",
            description: "Barang ditebus.",
            specifications: { jenis: "gelang" },
            ownerName: "Dina Maharani",
            customerNumber: "NSB-RDM",
            actionKey: "ditebus",
            actionLabel: "Ditebus",
            actionTone: "warning",
            note: "Nasabah menebus barang.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-06-03T03:00:00.000Z",
            createdAtLabel: "3 Jun 2026, 11.00 WIB"
          },
          {
            id: "hist-failed-tone",
            barangId: "barang-failed-tone",
            barangCode: "BRG-FLD",
            barangName: "Ipad Gagal",
            category: "elektronik",
            condition: "baik",
            description: "Barang gagal.",
            specifications: { jenis: "tablet" },
            ownerName: "Siti Rahmawati",
            customerNumber: "NSB-FLD",
            actionKey: "gagal",
            actionLabel: "Gagal",
            actionTone: "danger",
            note: "Barang gagal diproses.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-06-03T04:00:00.000Z",
            createdAtLabel: "3 Jun 2026, 12.00 WIB"
          }
        ]}
      />
    );

    const getBadgeClasses = (label: string) =>
      screen
        .getAllByText(label)
        .find((element) => element.tagName.toLowerCase() === "div")
        ?.getAttribute("class") ?? "";

    expect(getBadgeClasses("Dipasarkan")).toContain("bg-[#ecfdfa]");
    expect(getBadgeClasses("Terjual")).toContain("bg-[#f0fdf4]");
    expect(getBadgeClasses("Ditebus")).toContain("bg-[#f5f3ff]");
    expect(getBadgeClasses("Gagal")).toContain("bg-[#fff1f2]");
    expect(new Set([
      getBadgeClasses("Dipasarkan"),
      getBadgeClasses("Terjual"),
      getBadgeClasses("Ditebus"),
      getBadgeClasses("Gagal")
    ]).size).toBe(4);
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
            customerNumber: "0812-3456-78901",
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
    expect(screen.getByText("Aktor Internal")).toBeInTheDocument();
    expect(screen.getByText("Operator Arsip")).toBeInTheDocument();
    expect(screen.queryByText("ADMIN UNIT")).not.toBeInTheDocument();
    expect(screen.getByText("31 Mei 2026, 09:12:33 WIB")).not.toHaveClass("font-mono");

    const headerRow = screen.getByText("Informasi Barang").closest('[class*="lg:grid-cols-"]');
    const historyRow = screen.getByText("Ipad Terbaru").closest('[class*="lg:grid-cols-"]');
    const headerLabels = Array.from(headerRow?.children ?? []).map((cell) =>
      (cell.textContent ?? "").replace(/\s+/g, " ").trim()
    );
    const rowCells = Array.from(historyRow?.children ?? []);

    expect(headerLabels).toEqual([
      "Informasi Barang",
      "Kategori",
      "Nasabah Pemilik",
      "Status",
      "Aktor Internal",
      "Waktu Proses",
      "Aksi"
    ]);
    expect(headerRow).toHaveClass("px-3.5");
    expect(headerRow?.children[0]).toHaveClass("lg:pl-2");
    expect(headerRow?.children[1]).toHaveClass("lg:-ml-1");
    expect(rowCells[0]).toHaveTextContent("Ipad Terbaru");
    expect(rowCells[1]).toHaveClass("lg:-ml-1");
    expect(rowCells[3]).toHaveTextContent("Barang Masuk");
    expect(rowCells[4]).toHaveTextContent("Operator Arsip");
    expect(headerRow?.children[2]).toHaveClass("text-center");
    expect(headerRow?.children[3]).toHaveClass("text-center");
    expect(headerRow?.children[3]).toHaveClass("place-items-center");
    expect(headerRow?.children[4]).toHaveClass("text-center");
    expect(headerRow?.children[4]).toHaveClass("place-items-center");
    expect(headerRow?.children[6]).toHaveClass("text-center");
    expect(headerRow?.children[6]).toHaveClass("place-items-center");
    expect(rowCells[2].firstElementChild).toHaveClass("lg:justify-center");
    expect(rowCells[3]).toHaveClass("lg:place-items-center");
    expect(rowCells[4]).toHaveClass("lg:place-items-center");
    expect(rowCells[4]).toHaveClass("lg:text-center");
    expect(rowCells[6]).toHaveClass("lg:place-items-center");

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
            customerNumber: "0812-3456-78901",
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
    expect(report).toHaveTextContent("Aktor Internal");

    const printHeaderLabels = Array.from(report.querySelectorAll("thead th")).map((cell) =>
      (cell.textContent ?? "").replace(/\s+/g, " ").trim()
    );
    const printCells = Array.from(report.querySelectorAll("tbody tr:first-child td"));

    expect(printHeaderLabels).toEqual([
      "#",
      "Informasi Barang",
      "Kategori",
      "Nasabah",
      "Status",
      "Aktor Internal",
      "Waktu Proses"
    ]);
    expect(printCells[1]).toHaveTextContent("Ipad Terbaru Dengan Nama Panjang");
    expect(printCells[4]).toHaveTextContent("Dipasarkan");
    expect(printCells[5]).toHaveTextContent("Admin Unit");

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
    expect(printCss).toContain(".admin-history-print-table th:nth-child(7)");
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
            ownerName: "Rizki Pratama",
            customerNumber: "0812000009018",
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
            ownerName: "Brando Mahendra",
            customerNumber: "0812000056789",
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
    expect(screen.getByRole("option", { name: "Perhiasan" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Logam Mulia" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Elektronik" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Kendaraan" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lainnya" })).toBeInTheDocument();

    fireEvent.change(categorySelect, { target: { value: "elektronik" } });

    expect(screen.getByText("Laptop Kerja")).toBeInTheDocument();
    expect(screen.queryByText("Koin Antam")).not.toBeInTheDocument();
  });

  it("shows item code under the item name without description copy controls", () => {
    render(
      <AdminInventoryHistoryWorkspace
        history={[
          {
            id: "hist-code",
            barangId: "barang-code",
            barangCode: "BRG-55291335",
            barangName: "Kalung Emas 2",
            category: "perhiasan",
            condition: "cukup",
            description: "Test 2",
            specifications: {},
            ownerName: "Andi Wijaya",
            customerNumber: "0812000020202",
            actionKey: "dipasarkan",
            actionLabel: "Dipasarkan",
            actionTone: "success",
            note: "Barang dipublikasikan ke katalog.",
            actorName: "Admin Unit",
            actorRole: "admin_unit",
            createdAt: "2026-06-23T00:00:00.000Z",
            createdAtLabel: "23 Jun 2026, 05.00 WIB"
          }
        ]}
      />
    );

    const itemName = screen.getByText("Kalung Emas 2");
    const itemInfo = itemName.closest("div.min-w-0");

    expect(itemInfo).toHaveTextContent("Kalung Emas 2");
    expect(itemInfo).toHaveTextContent("BRG-55291335");
    expect(itemInfo).not.toHaveTextContent("Test 2");
    expect(screen.queryByRole("button", { name: /salin kode/i })).not.toBeInTheDocument();
  });
});
