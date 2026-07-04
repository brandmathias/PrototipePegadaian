export function startProductionCronScheduler({
  secret,
  port = process.env.PORT ?? "3000",
  fetchImpl = globalThis.fetch,
  setTimeoutImpl = globalThis.setTimeout,
  setIntervalImpl = globalThis.setInterval,
} = {}) {
  if (!secret) {
    throw new Error("CRON_SECRET wajib tersedia agar proses otomatis production berjalan.");
  }

  let running = false;
  const run = async () => {
    if (running) {
      return;
    }

    running = true;
    try {
      const response = await fetchImpl(
        `http://127.0.0.1:${port}/api/cron/proses-lelang`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Cron production gagal dijalankan:", error);
    } finally {
      running = false;
    }
  };

  setTimeoutImpl(run, 10_000);
  return setIntervalImpl(run, 300_000);
}
