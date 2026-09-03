import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import {
  createMidtransSnapTransaction,
  getMidtransTransactionStatus,
  getMidtransGatewayConfig,
  mapMidtransTransactionStatus,
  verifyMidtransNotificationSignature
} from "@/lib/payments/midtrans";

describe("Midtrans payment contract", () => {
  it("uses redirect checkout with only the server key", () => {
    expect(getMidtransGatewayConfig({ MIDTRANS_SERVER_KEY: "SB-Mid-server-test" })).toMatchObject({
      serverKey: "SB-Mid-server-test",
      isProduction: false
    });
  });

  it("checks the current gateway status using server authentication", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ gross_amount: "12500000.00", order_id: "FP-trx-1", status_code: "200", transaction_status: "settlement" }))
    );
    const config = getMidtransGatewayConfig({
      MIDTRANS_SERVER_KEY: "SB-Mid-server-test",
      NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: "SB-Mid-client-test"
    });

    await expect(getMidtransTransactionStatus({ config, fetchImpl: fetchMock, orderId: "FP-trx-1" })).resolves.toMatchObject({
      transaction_status: "settlement"
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.sandbox.midtrans.com/v2/FP-trx-1/status",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Basic ${Buffer.from("SB-Mid-server-test:").toString("base64")}` })
      })
    );
  });

  it("creates a Snap checkout using the server-side amount and order ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          redirect_url: "https://app.sandbox.midtrans.com/snap/v2/checkout",
          token: "snap-token-1"
        }),
        { status: 201 }
      )
    );

    const result = await createMidtransSnapTransaction({
      amount: 12_500_000,
      config: getMidtransGatewayConfig({
        MIDTRANS_SERVER_KEY: "SB-Mid-server-test",
        NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: "SB-Mid-client-test"
      }),
      fetchImpl: fetchMock,
      itemName: "Cincin Emas",
      orderId: "FP-trx-1"
    });

    expect(result).toEqual({
      redirectUrl: "https://app.sandbox.midtrans.com/snap/v2/checkout",
      token: "snap-token-1"
    });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.sandbox.midtrans.com/snap/v1/transactions");
    expect(request).toMatchObject({
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from("SB-Mid-server-test:").toString("base64")}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    expect(JSON.parse(request.body)).toEqual({
      enabled_payments: ["bank_transfer", "gopay", "qris", "shopeepay"],
      expiry: { duration: 15, unit: "minute" },
      item_details: [{ id: "FP-trx-1", name: "Cincin Emas", price: 12_500_000, quantity: 1 }],
      transaction_details: { gross_amount: 12_500_000, order_id: "FP-trx-1" }
    });
  });

  it("uses Sandbox endpoints unless production is explicitly enabled", () => {
    const config = getMidtransGatewayConfig({
      MIDTRANS_SERVER_KEY: "SB-Mid-server-test",
      NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: "SB-Mid-client-test"
    });

    expect(config.isProduction).toBe(false);
    expect(config.snapApiUrl).toBe("https://app.sandbox.midtrans.com/snap/v1/transactions");
  });

  it("rejects a forged payment notification signature", () => {
    const result = verifyMidtransNotificationSignature(
      {
        grossAmount: "12500000.00",
        orderId: "FP-trx-1",
        signatureKey: "forged",
        statusCode: "200"
      },
      "SB-Mid-server-test"
    );

    expect(result).toBe(false);
  });

  it("accepts a signature that Midtrans would generate", () => {
    const signatureKey = createHash("sha512")
      .update("FP-trx-120012500000.00SB-Mid-server-test")
      .digest("hex");

    expect(
      verifyMidtransNotificationSignature(
        {
          grossAmount: "12500000.00",
          orderId: "FP-trx-1",
          signatureKey,
          statusCode: "200"
        },
        "SB-Mid-server-test"
      )
    ).toBe(true);
  });

  it.each([
    ["settlement", "lunas"],
    ["capture", "lunas"],
    ["pending", "menunggu_pembayaran"],
    ["expire", "gagal"],
    ["cancel", "gagal"],
    ["deny", "gagal"],
    ["refund", "unknown"]
  ])("maps Midtrans %s to application status %s", (gatewayStatus, expectedStatus) => {
    expect(mapMidtransTransactionStatus(gatewayStatus)).toBe(expectedStatus);
  });
});
