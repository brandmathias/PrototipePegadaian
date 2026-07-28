const PUSH_ICON_ROOT = "/brand/push-icons";
const PUSH_ICON_BY_TYPE = {
  payment_rejected: "alert.svg",
  blacklist_active: "alert.svg",
  superadmin_policy_alert: "alert.svg",
  payment_verified: "success.svg",
  vickrey_win: "success.svg",
  push_subscription_confirmed: "success.svg",
  payment_deadline: "deadline.svg",
  vickrey_loss: "auction.svg",
  admin_payment_proof_uploaded: "payment.svg",
  admin_bid_submitted: "bid.svg",
  admin_vickrey_result: "result.svg"
};

function getPushIcon(type) {
  const filename = PUSH_ICON_BY_TYPE[typeof type === "string" ? type : ""] || "info.svg";
  return `${PUSH_ICON_ROOT}/${filename}`;
}

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const href = typeof payload.href === "string" && payload.href.startsWith("/") ? payload.href : "/notifikasi";
  event.waitUntil(self.registration.showNotification(payload.title || "Ruang Agunan", {
    body: payload.body || "Ada informasi penting untuk Anda.",
    icon: getPushIcon(payload.type),
    badge: "/brand/ruang-agunan-icon.png",
    data: { href }
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.href || "/notifikasi", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url === target);
    return existing ? existing.focus() : self.clients.openWindow(target);
  }));
});
