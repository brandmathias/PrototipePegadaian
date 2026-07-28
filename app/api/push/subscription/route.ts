import { NextResponse } from "next/server";

import { requireAuthenticatedApiSession } from "@/lib/auth/session";
import {
  getPushConfiguration,
  hasPushSubscription,
  normalizePushSubscription,
  removePushSubscription,
  savePushSubscription,
  sendPushNotification
} from "@/lib/services/push-notification.service";

function denied(access: { status: number; message: string }) {
  return NextResponse.json({ message: access.message }, { status: access.status });
}

export async function GET() {
  const access = await requireAuthenticatedApiSession();
  if (!access.ok) return denied(access);

  const config = getPushConfiguration();
  const enabled = config ? await hasPushSubscription(access.userId) : false;
  return NextResponse.json({ data: { configured: Boolean(config), enabled, publicKey: config?.publicKey ?? null } });
}

export async function POST(request: Request) {
  const access = await requireAuthenticatedApiSession();
  if (!access.ok) return denied(access);

  try {
    const subscription = normalizePushSubscription(await request.json());
    await savePushSubscription(access.userId, { ...subscription, userAgent: request.headers.get("user-agent") });
    await sendPushNotification(subscription, {
      title: "Notifikasi perangkat aktif",
      message: "Perangkat ini siap menerima informasi penting dari Ruang Agunan.",
      type: "push_subscription_confirmed",
      actionHref: "/notifikasi"
    });
    return NextResponse.json({ data: { enabled: true } });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Subscription push tidak valid." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const access = await requireAuthenticatedApiSession();
  if (!access.ok) return denied(access);

  try {
    const payload = await request.json();
    const endpoint = normalizePushSubscription({ endpoint: payload?.endpoint, keys: { p256dh: "delete", auth: "delete" } }).endpoint;
    await removePushSubscription(access.userId, endpoint);
    return NextResponse.json({ data: { enabled: false } });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Endpoint push tidak valid." }, { status: 400 });
  }
}
