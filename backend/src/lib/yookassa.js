import { env } from "../config/env.js";

function toBasicAuthHeader(shopId, secretKey) {
  const token = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return `Basic ${token}`;
}

export function assertYooKassaConfigured() {
  if (!env.yookassaShopId || !env.yookassaSecretKey) {
    throw new Error("YooKassa is not configured");
  }
}

function mapYooKassaStatus(status) {
  if (status === "succeeded") {
    return "SUCCEEDED";
  }
  if (status === "waiting_for_capture") {
    return "WAITING_FOR_CAPTURE";
  }
  if (status === "canceled") {
    return "CANCELED";
  }
  return "PENDING";
}

export function mapKopecksToYooAmount(amount) {
  return (amount / 100).toFixed(2);
}

export function mapYooAmountToKopecks(value) {
  return Math.round(Number(value) * 100);
}

export async function createYooKassaPayment({ idempotenceKey, amount, currency, description, returnUrl, metadata }) {
  assertYooKassaConfigured();

  const response = await fetch(`${env.yookassaApiBaseUrl}/payments`, {
    method: "POST",
    headers: {
      Authorization: toBasicAuthHeader(env.yookassaShopId, env.yookassaSecretKey),
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify({
      amount: {
        value: mapKopecksToYooAmount(amount),
        currency,
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: returnUrl,
      },
      description,
      metadata,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error("YooKassa create payment failed");
    error.providerStatus = response.status;
    error.providerPayload = payload;
    throw error;
  }

  return payload;
}

export async function getYooKassaPaymentById(paymentId) {
  assertYooKassaConfigured();

  const response = await fetch(`${env.yookassaApiBaseUrl}/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: toBasicAuthHeader(env.yookassaShopId, env.yookassaSecretKey),
      "Content-Type": "application/json",
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error("YooKassa get payment failed");
    error.providerStatus = response.status;
    error.providerPayload = payload;
    throw error;
  }

  return payload;
}

export { mapYooKassaStatus };