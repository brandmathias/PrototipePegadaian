import { describe, expect, it } from "vitest";

import {
  getRoleHomePath,
  getSafeAdminNextPath,
  getSafeBuyerNextPath,
  getSafeSuperAdminNextPath
} from "@/lib/auth/guards";

describe("buyer auth guards", () => {
  it("allows only internal buyer-safe paths", () => {
    expect(getSafeBuyerNextPath("/dashboard")).toBe("/dashboard");
    expect(getSafeBuyerNextPath("/katalog/buyer-demo-fixed-pemasaran/beli")).toBe(
      "/katalog/buyer-demo-fixed-pemasaran/beli"
    );
    expect(getSafeBuyerNextPath("/transaksi/TRX-2026-0033")).toBe("/transaksi/TRX-2026-0033");
    expect(getSafeBuyerNextPath("/profil")).toBe("/profil");
  });

  it("falls back when next path is missing or external", () => {
    expect(getSafeBuyerNextPath()).toBe("/dashboard");
    expect(getSafeBuyerNextPath("http://evil.com")).toBe("/dashboard");
    expect(getSafeBuyerNextPath("//evil.com")).toBe("/dashboard");
    expect(getSafeBuyerNextPath("/admin")).toBe("/dashboard");
  });

  it("keeps admin and superadmin paths inside their own area", () => {
    expect(getSafeAdminNextPath("/admin")).toBe("/admin");
    expect(getSafeAdminNextPath("/admin/transaksi/TRX-MND-00421")).toBe(
      "/admin/transaksi/TRX-MND-00421"
    );
    expect(getSafeAdminNextPath("/superadmin")).toBe(getRoleHomePath("admin_unit"));

    expect(getSafeSuperAdminNextPath("/superadmin")).toBe("/superadmin");
    expect(getSafeSuperAdminNextPath("/superadmin/unit/unit-alpha-central")).toBe(
      "/superadmin/unit/unit-alpha-central"
    );
    expect(getSafeSuperAdminNextPath("/admin")).toBe(getRoleHomePath("super_admin"));
  });
});
