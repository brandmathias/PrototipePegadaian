import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AdminUnitNotificationsPage } from "@/components/admin/admin-notifications-page";
import { SuperAdminNotificationsPage } from "@/components/superadmin/superadmin-notifications-page";
import type { PersistedNotification } from "@/components/ui/use-buyer-notifications";

vi.mock("next/image", () => ({
  default: ({
    alt,
    fetchPriority,
    fill,
    height,
    priority,
    quality,
    sizes,
    src,
    width,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fetchPriority?: string;
    fill?: boolean;
    height?: number;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    src: string;
    width?: number;
  }) => <img alt={alt ?? ""} src={src} {...props} />
}));

vi.mock("next/link", () => ({
  default: ({ children, href, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  )
}));

const adminNotifications: PersistedNotification[] = [
  {
    id: "notif-admin-payment",
    title: "Pembayaran Masuk: Kalung Salib Emas 17K",
    message: "Pembeli telah mengunggah bukti pembayaran. Silakan lakukan verifikasi.",
    type: "admin_payment_proof_uploaded",
    entityType: "transaction",
    entityId: "trx-admin-1",
    actionHref: "/admin/transaksi/trx-admin-1",
    isRead: false,
    createdAt: "2026-07-13T06:01:00.000Z",
    readAt: null
  },
  {
    id: "notif-admin-result",
    title: "Hasil Lelang Tertutup siap diverifikasi",
    message: "Sistem sudah menghitung pemenang dan harga akhir sesi.",
    type: "admin_vickrey_result",
    entityType: "pemasaran",
    entityId: "pm-vickrey-1",
    actionHref: "/admin/pemasaran/vickrey-auction/pm-vickrey-1",
    isRead: true,
    createdAt: "2026-07-13T07:20:00.000Z",
    readAt: "2026-07-13T07:30:00.000Z"
  }
];

const superAdminNotifications: PersistedNotification[] = [
  {
    id: "notif-super-policy",
    title: "Pembatasan buyer aktif",
    message: "Sistem mencatat pelanggaran pembayaran dan mengaktifkan pembatasan buyer.",
    type: "superadmin_policy_alert",
    entityType: "blacklist",
    entityId: "buyer-1",
    actionHref: "/superadmin/blacklist/detail/buyer-1",
    isRead: false,
    createdAt: "2026-07-13T08:10:00.000Z",
    readAt: null
  }
];

describe("admin and superadmin notification pages", () => {
  it("renders admin unit notifications with the shared Kelola Barang hero treatment", () => {
    render(<AdminUnitNotificationsPage adminName="Admin Unit Ranotana" notifications={adminNotifications} />);

    const hero = screen.getByRole("heading", { name: /pusat notifikasi unit/i }).closest("section");
    expect(hero).not.toBeNull();
    expect(hero).toHaveClass("rounded-[2.35rem]");
    expect(screen.getByText("Admin Unit / Notifikasi")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pusat notifikasi unit/i })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /ilustrasi operasional notifikasi admin unit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lihat semua/i })).not.toBeInTheDocument();

    const notificationLink = screen.getByRole("link", {
      name: /pembayaran masuk: kalung salib emas 17k/i
    });
    expect(notificationLink).toHaveAttribute("href", "/admin/transaksi/trx-admin-1");
    expect(within(notificationLink).getByText(/silakan lakukan verifikasi/i)).toBeInTheDocument();
  });

  it("renders superadmin notifications with the shared Monitoring Unit hero treatment", () => {
    render(<SuperAdminNotificationsPage notifications={superAdminNotifications} />);

    expect(screen.getByText("Superadmin / Notifikasi")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pusat notifikasi operasional/i }).closest("section")).toHaveClass(
      "rounded-[2.35rem]"
    );
    expect(screen.getByRole("heading", { name: /pusat notifikasi operasional/i })).toBeInTheDocument();
    expect(screen.getByText(/risiko operasional lintas unit/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lihat semua/i })).not.toBeInTheDocument();

    const notificationLink = screen.getByRole("link", { name: /pembatasan buyer aktif/i });
    expect(notificationLink).toHaveAttribute("href", "/superadmin/blacklist/detail/buyer-1");
    expect(within(notificationLink).getByText(/pelanggaran pembayaran/i)).toBeInTheDocument();
  });

  it("marks all role notifications as read through the configured endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: { updated: 1 } }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        )
      )
    );

    const user = userEvent.setup();
    render(<AdminUnitNotificationsPage adminName="Admin Unit Ranotana" notifications={adminNotifications} />);

    await user.click(screen.getByRole("button", { name: /belum dibaca 1/i }));
    expect(screen.getByText("1 notifikasi")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /tandai semua dibaca/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /belum dibaca 0/i })).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith("/api/admin/notifikasi/read-all", {
      method: "POST"
    });

    vi.unstubAllGlobals();
  });
});
