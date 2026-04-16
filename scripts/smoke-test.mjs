#!/usr/bin/env node

/**
 * Production smoke test for AI Trainer.
 *
 * Usage:
 *   APP_BASE_URL=https://your-domain.com node scripts/smoke-test.mjs
 *
 * Optional authenticated checks:
 *   TEST_USER_EMAIL=user@example.com TEST_USER_PASSWORD=secret APP_BASE_URL=... node scripts/smoke-test.mjs
 */

const baseUrl = (process.env.APP_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

async function check(name, path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== expectedStatus) {
    throw new Error(`${name} failed: expected ${expectedStatus}, got ${response.status}`);
  }
  console.log(`[ok] ${name} -> ${response.status}`);
  return response;
}

async function run() {
  console.log(`Running smoke tests against ${baseUrl}`);

  await check("API health", "/api/health", 200);
  await check("Exercise catalog", "/api/exercises", 200);
  await check("Plans endpoint", "/api/payments/plans", 200);

  if (!email || !password) {
    console.log("[skip] Authenticated checks skipped. Set TEST_USER_EMAIL and TEST_USER_PASSWORD to enable them.");
    return;
  }

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (loginRes.status !== 200) {
    throw new Error(`Auth login failed: expected 200, got ${loginRes.status}`);
  }

  const loginData = await loginRes.json();
  const accessToken = loginData?.accessToken;
  if (!accessToken) {
    throw new Error("Auth login failed: no accessToken in response");
  }
  console.log("[ok] Auth login -> 200");

  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (meRes.status !== 200) {
    throw new Error(`Auth me failed: expected 200, got ${meRes.status}`);
  }
  console.log("[ok] Auth me -> 200");

  const stravaRes = await fetch(`${baseUrl}/api/strava/connection/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (stravaRes.status !== 200) {
    throw new Error(`Strava connection status failed: expected 200, got ${stravaRes.status}`);
  }
  console.log("[ok] Strava connection status -> 200");
}

run()
  .then(() => {
    console.log("Smoke test finished successfully.");
  })
  .catch((error) => {
    console.error("Smoke test failed:", error.message);
    process.exit(1);
  });