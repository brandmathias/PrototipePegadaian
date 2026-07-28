import { describe, expect, it } from "vitest";

import { pushDeliveries, pushSubscriptions } from "@/lib/db/schema/push-notifications";

describe("push notification schema", () => {
  it("keeps browser endpoints unique and delivery rows idempotent per notification", () => {
    expect(pushSubscriptions.endpoint.name).toBe("endpoint");
    expect(pushDeliveries.notificationId.name).toBe("notification_id");
    expect(pushDeliveries.status.name).toBe("status");
    expect(pushDeliveries.attempts.name).toBe("attempts");
  });
});
