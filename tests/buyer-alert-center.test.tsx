import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AlertCenter } from "@/components/ui/alert-center";
import { ToastProvider, useToast } from "@/components/ui/toast";

vi.mock("next/link", () => ({
  default: ({ children, href, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  )
}));

function ToastTrigger() {
  const { toast } = useToast();

  return (
    <button
      onClick={() =>
        toast({
          title: "Katalog berhasil ditambahkan",
          description: "Barang baru tersimpan.",
          variant: "success",
          scope: "buyer"
        })
      }
      type="button"
    >
      Buat toast
    </button>
  );
}

function renderAlertCenter() {
  return render(
    <ToastProvider>
      <ToastTrigger />
      <AlertCenter scope="buyer" />
    </ToastProvider>
  );
}

function renderSuperAdminAlertCenter() {
  return render(
    <ToastProvider>
      <AlertCenter scope="superadmin" />
    </ToastProvider>
  );
}

function renderAdminUnitAlertCenter() {
  return render(
    <ToastProvider>
      <AlertCenter scope="admin-unit" />
    </ToastProvider>
  );
}

describe("buyer alert center", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/api/user/notifikasi/read-all")) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: { updated: 1 } }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        if (init?.method === "PATCH") {
          return Promise.resolve(
            new Response(JSON.stringify({ data: { id: "notif-1", isRead: true } }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "notif-1",
                  title: "Anda memenangkan lelang Motor Racing",
                  message: "Silakan bayar langsung di UPC Ranotana.",
                  type: "vickrey_win",
                  actionHref: "/transaksi/trx-1",
                  isRead: false,
                  createdAt: "2026-05-22T01:00:00.000Z"
                }
              ]
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          )
        );
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the unread badge when opened and clears it after the notification detail is clicked", async () => {
    const user = userEvent.setup();
    renderAlertCenter();

    expect(await screen.findByText("1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /buka pusat alert/i }));

    expect(screen.getByText(/anda memenangkan lelang motor racing/i)).toBeInTheDocument();
    expect(screen.getByText(/silakan bayar langsung/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat semua/i })).toHaveAttribute("href", "/notifikasi");
    expect(screen.getByRole("button", { name: /tandai dibaca/i })).toBeInTheDocument();
    expect(screen.getByText("Jumat, 22 Mei 2026 • 08.00 WIB")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith("/api/user/notifikasi/read-all", {
      method: "POST"
    });

    await user.click(screen.getByRole("link", { name: /anda memenangkan lelang motor racing/i }));

    await waitFor(() => {
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith("/api/user/notifikasi/notif-1", {
      method: "PATCH"
    });
  });

  it("keeps routine local toast feedback out of the alert center", async () => {
    const user = userEvent.setup();
    renderAlertCenter();

    await user.click(screen.getByRole("button", { name: /buat toast/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/katalog berhasil ditambahkan/i);

    await user.click(screen.getByRole("button", { name: /buka pusat alert/i }));

    const dialog = await screen.findByRole("dialog");
    expect(await screen.findByText(/anda memenangkan lelang motor racing/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/katalog berhasil ditambahkan/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/barang baru tersimpan/i)).not.toBeInTheDocument();
  });

  it("uses blacklist occurredAt metadata for the visible notification timestamp", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "PATCH") {
          return Promise.resolve(
            new Response(JSON.stringify({ data: { id: "notif-blacklist", isRead: true } }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "notif-blacklist",
                  title: "Akun Anda dikenakan pembatasan",
                  message: "Pelanggaran saat ini: 1x. Pembatasan aktif sampai 26 Jun 2026, 04.03 WIB.",
                  type: "blacklist_active",
                  actionHref: "/pelanggaran",
                  isRead: false,
                  createdAt: "2026-06-21T00:56:00.000Z",
                  metadata: {
                    occurredAt: "2026-06-18T21:03:00.000Z"
                  }
                }
              ]
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          )
        );
      })
    );

    const user = userEvent.setup();
    renderAlertCenter();

    await user.click(await screen.findByRole("button", { name: /buka pusat alert/i }));

    expect(await screen.findByText(/akun anda dikenakan pembatasan/i)).toBeInTheDocument();
    expect(screen.getByText(/Jumat, 19 Jun 2026.*04\.03 WIB/)).toBeInTheDocument();
    expect(screen.queryByText(/Minggu, 21 Jun 2026.*07\.56 WIB/)).not.toBeInTheDocument();
  });

  it("uses the mobile-safe fixed sheet layout for the buyer alert panel", async () => {
    const user = userEvent.setup();
    renderAlertCenter();

    await user.click(await screen.findByRole("button", { name: /buka pusat alert/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveClass("fixed");
    expect(dialog).toHaveClass("inset-x-3");
    expect(dialog).toHaveClass("modal-viewport");
    expect(dialog.querySelector(".overflow-y-auto")).toHaveClass("overscroll-contain");
    expect(screen.getByRole("button", { name: /tutup pusat alert/i })).toHaveClass("fixed", "inset-0");
  });

  it("renders non-winner notifications with the dedicated buyer result action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/api/user/notifikasi/read-all")) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: { updated: 1 } }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        if (init?.method === "PATCH") {
          return Promise.resolve(
            new Response(JSON.stringify({ data: { id: "notif-loss", isRead: true } }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "notif-loss",
                  title: "Hasil lelang Kamera Full Frame sudah tersedia",
                  message: "Anda belum memenangkan sesi ini. Buka hasil lelang untuk melihat ringkasan akhir.",
                  type: "vickrey_loss",
                  actionHref: "/riwayat-bid/pmr-77/bukan-pemenang",
                  isRead: false,
                  createdAt: "2026-05-22T02:30:00.000Z"
                }
              ]
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          )
        );
      })
    );

    const user = userEvent.setup();
    renderAlertCenter();

    await user.click(await screen.findByRole("button", { name: /buka pusat alert/i }));

    const link = await screen.findByRole("link", {
      name: /hasil lelang kamera full frame sudah tersedia/i
    });

    expect(link).toHaveAttribute("href", "/riwayat-bid/pmr-77/bukan-pemenang");
    expect(screen.getByText(/anda belum memenangkan sesi ini/i)).toBeInTheDocument();
  });

  it("loads persistent admin unit operational notifications from the admin endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/api/admin/notifikasi/read-all")) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: { updated: 1 } }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        if (init?.method === "PATCH") {
          return Promise.resolve(
            new Response(JSON.stringify({ data: { id: "notif-admin-1", isRead: true } }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "notif-admin-1",
                  title: "Bukti pembayaran harga tetap Kalung Emas masuk",
                  message: "Buyer sudah mengirim bukti pembayaran harga tetap dan menunggu verifikasi unit.",
                  type: "admin_payment_proof_uploaded",
                  actionHref: "/admin/transaksi/trx-1",
                  isRead: false,
                  createdAt: "2026-06-09T02:00:00.000Z"
                }
              ]
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          )
        );
      })
    );

    const user = userEvent.setup();
    renderAdminUnitAlertCenter();

    expect(await screen.findByText("1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /buka pusat alert/i }));

    expect(screen.getByRole("link", { name: /lihat semua/i })).toHaveAttribute("href", "/admin/notifikasi");
    const link = await screen.findByRole("link", { name: /bukti pembayaran harga tetap kalung emas masuk/i });
    expect(link).toHaveAttribute("href", "/admin/transaksi/trx-1");
    expect(screen.getByText(/menunggu verifikasi unit/i)).toBeInTheDocument();

    await user.click(link);

    await waitFor(() => {
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith("/api/admin/notifikasi/notif-admin-1", {
      method: "PATCH"
    });
  });

  it("loads persistent superadmin policy alerts, not account-management toasts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/api/superadmin/notifikasi/read-all")) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: { updated: 1 } }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        if (init?.method === "PATCH") {
          return Promise.resolve(
            new Response(JSON.stringify({ data: { id: "notif-super-1", isRead: true } }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: "notif-super-1",
                  title: "Pembatasan buyer aktif",
                  message: "Sistem mencatat pelanggaran pembayaran dan mengaktifkan pembatasan buyer.",
                  type: "superadmin_policy_alert",
                  actionHref: "/superadmin/blacklist/detail/buyer-1",
                  isRead: false,
                  createdAt: "2026-06-09T02:00:00.000Z"
                }
              ]
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          )
        );
      })
    );

    const user = userEvent.setup();
    renderSuperAdminAlertCenter();

    expect(await screen.findByText("1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /buka pusat alert/i }));

    expect(screen.getByRole("link", { name: /lihat semua/i })).toHaveAttribute("href", "/superadmin/notifikasi");
    const link = await screen.findByRole("link", { name: /pembatasan buyer aktif/i });
    expect(link).toHaveAttribute("href", "/superadmin/blacklist/detail/buyer-1");
    expect(within(link).getByText(/pelanggaran pembayaran/i)).toBeInTheDocument();
    expect(screen.queryByText(/akun superadmin dibuat/i)).not.toBeInTheDocument();

    await user.click(link);

    await waitFor(() => {
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith("/api/superadmin/notifikasi/notif-super-1", {
      method: "PATCH"
    });
  });
});
