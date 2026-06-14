"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

type AdminPagesModule = typeof import("@/components/pages/admin-pages");
type ComponentObjectProps<T> = T extends (props: infer Props, ...args: any[]) => any
  ? Props extends object
    ? Props
    : Record<string, never>
  : T extends ComponentType<infer Props>
    ? Props extends object
      ? Props
      : Record<string, never>
    : Record<string, never>;
type AdminPageProps<T extends keyof AdminPagesModule> = ComponentObjectProps<AdminPagesModule[T]>;

function AdminPageFallback() {
  return <PageLoadingSkeleton />;
}

const LazyAdminInventoryPage = dynamic<AdminPageProps<"AdminInventoryPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminInventoryPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminInventoryHistoryPage = dynamic<AdminPageProps<"AdminInventoryHistoryPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminInventoryHistoryPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminInventoryCreatePage = dynamic<AdminPageProps<"AdminInventoryCreatePage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminInventoryCreatePage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminInventoryDetailPage = dynamic<AdminPageProps<"AdminInventoryDetailPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminInventoryDetailPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminInventoryEditPage = dynamic<AdminPageProps<"AdminInventoryEditPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminInventoryEditPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminInventoryExtendPage = dynamic<AdminPageProps<"AdminInventoryExtendPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminInventoryExtendPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminInventoryRedeemPage = dynamic<AdminPageProps<"AdminInventoryRedeemPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminInventoryRedeemPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminInventoryConvertPage = dynamic<AdminPageProps<"AdminInventoryConvertPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminInventoryConvertPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminInventoryMarketPage = dynamic<AdminPageProps<"AdminInventoryMarketPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminInventoryMarketPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminBlacklistPage = dynamic<AdminPageProps<"AdminBlacklistPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminBlacklistPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminBlacklistDetailPage = dynamic<AdminPageProps<"AdminBlacklistDetailPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminBlacklistDetailPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminBlacklistExtendPage = dynamic<AdminPageProps<"AdminBlacklistExtendPage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminBlacklistExtendPage),
  { loading: AdminPageFallback, ssr: false }
);

const LazyAdminProfilePage = dynamic<AdminPageProps<"AdminProfilePage">>(
  () => import("@/components/pages/admin-pages").then((module) => module.AdminProfilePage),
  { loading: AdminPageFallback, ssr: false }
);

export function AdminInventoryPage(props: AdminPageProps<"AdminInventoryPage">) {
  return <LazyAdminInventoryPage {...props} />;
}

export function AdminInventoryHistoryPage(props: AdminPageProps<"AdminInventoryHistoryPage">) {
  return <LazyAdminInventoryHistoryPage {...props} />;
}

export function AdminInventoryCreatePage(props: AdminPageProps<"AdminInventoryCreatePage">) {
  return <LazyAdminInventoryCreatePage {...props} />;
}

export function AdminInventoryDetailPage(props: AdminPageProps<"AdminInventoryDetailPage">) {
  return <LazyAdminInventoryDetailPage {...props} />;
}

export function AdminInventoryEditPage(props: AdminPageProps<"AdminInventoryEditPage">) {
  return <LazyAdminInventoryEditPage {...props} />;
}

export function AdminInventoryExtendPage(props: AdminPageProps<"AdminInventoryExtendPage">) {
  return <LazyAdminInventoryExtendPage {...props} />;
}

export function AdminInventoryRedeemPage(props: AdminPageProps<"AdminInventoryRedeemPage">) {
  return <LazyAdminInventoryRedeemPage {...props} />;
}

export function AdminInventoryConvertPage(props: AdminPageProps<"AdminInventoryConvertPage">) {
  return <LazyAdminInventoryConvertPage {...props} />;
}

export function AdminInventoryMarketPage(props: AdminPageProps<"AdminInventoryMarketPage">) {
  return <LazyAdminInventoryMarketPage {...props} />;
}

export function AdminBlacklistPage(props: AdminPageProps<"AdminBlacklistPage">) {
  return <LazyAdminBlacklistPage {...props} />;
}

export function AdminBlacklistDetailPage(props: AdminPageProps<"AdminBlacklistDetailPage">) {
  return <LazyAdminBlacklistDetailPage {...props} />;
}

export function AdminBlacklistExtendPage(props: AdminPageProps<"AdminBlacklistExtendPage">) {
  return <LazyAdminBlacklistExtendPage {...props} />;
}

export function AdminProfilePage(props: AdminPageProps<"AdminProfilePage">) {
  return <LazyAdminProfilePage {...props} />;
}
