self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const href = typeof payload.href === "string" && payload.href.startsWith("/") ? payload.href : "/notifikasi";
  event.waitUntil(self.registration.showNotification(payload.title || "Ruang Agunan", {
    actions: [{ action: "open_detail", title: "Lihat detail" }],
    body: payload.body || "Ada informasi penting untuk Anda.",
    badge: "/brand/ruang-agunan-badge.png",
    icon: "/brand/push-icon-transparent.png",
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
