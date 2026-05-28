import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AlertCenter } from "@/components/ui/alert-center";
import { ToastProvider, useToast } from "@/components/ui/toast";

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

  it("renders persisted buyer notifications with unread badge and read-all action", async () => {
    const user = userEvent.setup();
    renderAlertCenter();

    expect(await screen.findByText("1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /buka pusat alert/i }));

    expect(screen.getByText(/anda memenangkan lelang motor racing/i)).toBeInTheDocument();
    expect(screen.getByText(/silakan bayar langsung/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /tandai dibaca/i }));

    await waitFor(() => {
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith("/api/user/notifikasi/read-all", {
      method: "POST"
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
});
