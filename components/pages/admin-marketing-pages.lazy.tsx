"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export type { MarketingSession } from "@/components/pages/admin-marketing-pages";

type AdminMarketingModule = typeof import("@/components/pages/admin-marketing-pages");
type ComponentObjectProps<T> = T extends (props: infer Props, ...args: any[]) => any
  ? Props extends object
    ? Props
    : Record<string, never>
  : T extends ComponentType<infer Props>
    ? Props extends object
      ? Props
      : Record<string, never>
    : Record<string, never>;
type AdminMarketingProps<T extends keyof AdminMarketingModule> = ComponentObjectProps<AdminMarketingModule[T]>;

function AdminMarketingFallback() {
  return <PageLoadingSkeleton />;
}

const LazyAdminMarketingUnifiedPage = dynamic<AdminMarketingProps<"AdminMarketingUnifiedPage">>(
  () => import("@/components/pages/admin-marketing-pages").then((module) => module.AdminMarketingUnifiedPage),
  { loading: AdminMarketingFallback, ssr: false }
);

const LazyAdminFixedPriceListPage = dynamic<AdminMarketingProps<"AdminFixedPriceListPage">>(
  () => import("@/components/pages/admin-marketing-pages").then((module) => module.AdminFixedPriceListPage),
  { loading: AdminMarketingFallback, ssr: false }
);

const LazyAdminVickreyAuctionListPage = dynamic<AdminMarketingProps<"AdminVickreyAuctionListPage">>(
  () => import("@/components/pages/admin-marketing-pages").then((module) => module.AdminVickreyAuctionListPage),
  { loading: AdminMarketingFallback, ssr: false }
);

const LazyAdminFixedPriceDetailPage = dynamic<AdminMarketingProps<"AdminFixedPriceDetailPage">>(
  () => import("@/components/pages/admin-marketing-pages").then((module) => module.AdminFixedPriceDetailPage),
  { loading: AdminMarketingFallback, ssr: false }
);

const LazyAdminVickreyAuctionDetailPage = dynamic<AdminMarketingProps<"AdminVickreyAuctionDetailPage">>(
  () => import("@/components/pages/admin-marketing-pages").then((module) => module.AdminVickreyAuctionDetailPage),
  { loading: AdminMarketingFallback, ssr: false }
);

export function AdminMarketingUnifiedPage(props: AdminMarketingProps<"AdminMarketingUnifiedPage">) {
  return <LazyAdminMarketingUnifiedPage {...props} />;
}

export function AdminFixedPriceListPage(props: AdminMarketingProps<"AdminFixedPriceListPage">) {
  return <LazyAdminFixedPriceListPage {...props} />;
}

export function AdminVickreyAuctionListPage(props: AdminMarketingProps<"AdminVickreyAuctionListPage">) {
  return <LazyAdminVickreyAuctionListPage {...props} />;
}

export function AdminFixedPriceDetailPage(props: AdminMarketingProps<"AdminFixedPriceDetailPage">) {
  return <LazyAdminFixedPriceDetailPage {...props} />;
}

export function AdminVickreyAuctionDetailPage(props: AdminMarketingProps<"AdminVickreyAuctionDetailPage">) {
  return <LazyAdminVickreyAuctionDetailPage {...props} />;
}
