import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BuyerNotificationsPage } from "@/components/buyer/notifications-page";
import type { PersistedNotification } from "@/components/ui/use-buyer-notifications";

vi.mock("next/image", () => ({
  default: ({
    alt,
    fetchPriority,
    fill,
    priority,
    quality,
    sizes,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fetchPriority?: string;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    src: string;
  }) => (
    <img alt={alt ?? ""} src={src} {...props} />
  )
}));

vi.mock("next/link", () => ({
  default: ({ children, href, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  )
}));

const notifications: PersistedNotification[] = [
  {
    id: "notif-rejected",
    title: "Bukti pembayaran Sepasang Cincin Emas Polos perlu diperbaiki",
    message: "Admin unit menolak bukti pembayaran yang Anda unggah.",
    type: "payment_rejected",
    entityType: "transaction",
    entityId: "trx-fixed-rejected",
    actionHref: "/transaksi/trx-fixed-rejected",
    isRead: false,
    createdAt: "2026-07-13T00:26:00.000Z",
    readAt: null
  },
  {
    id: "notif-verified",
    title: "Pembayaran Sepasang Cincin Emas Polos terverifikasi",
    message: "Admin unit sudah memverifikasi pembayaran Anda. Silakan ambil barang pada unit terkait.",
    type: "payment_verified",
    entityType: "transaction",
    entityId: "trx-fixed-paid",
    actionHref: "/transaksi/trx-fixed-paid",
    isRead: true,
    createdAt: "2026-07-14T01:15:00.000Z",
    readAt: "2026-07-14T01:20:00.000Z"
  },
  {
    id: "notif-restriction",
    title: "Pembatasan akun tersimpan",
    message: "Sebagian fitur akun Anda dibatasi karena pelanggaran kebijakan.",
    type: "blacklist_active",
    entityType: "blacklist",
    entityId: "blacklist-buyer-1",
    actionHref: "/pelanggaran",
    isRead: false,
    createdAt: "2026-07-15T02:42:00.000Z",
    readAt: null,
    metadata: {
      occurredAt: "2026-07-15T02:40:00.000Z"
    }
  }
];

describe("BuyerNotificationsPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ data: { configured: true, enabled: false, publicKey: "public-vapid-key" } }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        )
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the buyer notification page with the referenced hero and real notification content", async () => {
    render(<BuyerNotificationsPage initialNotifications={notifications} />);

    expect(screen.getByRole("heading", { name: /pusat notifikasi ruang agunan/i })).toBeInTheDocument();
    expect(screen.getByTestId("buyer-notifications-hero")).toHaveClass("min-h-0", "md:min-h-[380px]");
    expect(screen.getByText(/temukan pembaruan terbaru, pengingat penting, status pembayaran/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Kategori notifikasi")).toHaveTextContent("Transaksi");
    expect(screen.getByLabelText("Kategori notifikasi")).toHaveTextContent("Pembayaran");
    expect(screen.getByLabelText("Kategori notifikasi")).toHaveTextContent("Aktivitas Akun");
    expect(screen.getByRole("searchbox", { name: /cari notifikasi, status pembayaran, atau aktivitas akun/i })).toBeInTheDocument();
    const heroImage = screen.getByRole("img", { name: /ilustrasi notifikasi pembeli/i });
    expect(heroImage).toHaveAttribute(
      "src",
      "/uploads/Background Hero Section Halaman Notifikasi Buyer.png"
    );
    expect(heroImage).toHaveClass("hidden", "md:block");

    expect(screen.getByRole("button", { name: /semua 3/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /belum dibaca 2/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lihat semua/i })).not.toBeInTheDocument();
    const mobilePushPanel = screen.getByTestId("buyer-mobile-push-panel");
    expect(mobilePushPanel).toHaveClass("sm:hidden");
    const mobilePushButton = await within(mobilePushPanel).findByRole("button", { name: /aktifkan notifikasi perangkat/i });
    expect(mobilePushButton).toHaveClass("w-full", "min-h-12");
    expect(screen.getByTestId("buyer-notifications-hero")).not.toContainElement(mobilePushPanel);
    expect(screen.getByRole("heading", { name: /semua notifikasi/i })).toBeInTheDocument();
    expect(screen.getByText("3 notifikasi")).toBeInTheDocument();

    const rejectedLink = screen.getByRole("link", {
      name: /bukti pembayaran sepasang cincin emas polos perlu diperbaiki/i
    });
    expect(rejectedLink).toHaveClass("group", "hover:-translate-y-0.5");
    expect(rejectedLink).toHaveAttribute("href", "/transaksi/trx-fixed-rejected");
    expect(within(rejectedLink).getByText(/admin unit menolak bukti pembayaran/i)).toHaveClass("text-justify");
    expect(screen.getByText(/silakan ambil barang pada unit terkait/i)).toBeInTheDocument();
  });

  it("filters unread notifications and marks all notifications as read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: { updated: 2 } }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        )
      )
    );

    const user = userEvent.setup();
    render(<BuyerNotificationsPage initialNotifications={notifications} />);

    await user.click(screen.getByRole("button", { name: /belum dibaca 2/i }));
    expect(screen.getByRole("heading", { name: /notifikasi belum dibaca/i })).toBeInTheDocument();
    expect(screen.getByText("2 notifikasi")).toBeInTheDocument();
    expect(screen.queryByText(/pembayaran sepasang cincin emas polos terverifikasi/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /tandai semua dibaca/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /belum dibaca 0/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/belum ada notifikasi belum dibaca/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/user/notifikasi/read-all", {
      method: "POST"
    });
  });
});
