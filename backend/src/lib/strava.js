import { env } from "../config/env.js";

async function parseProviderError(response) {
  try {
    return await response.json();
  } catch {
    return { message: "Unable to parse provider error" };
  }
}

export async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_id: env.stravaClientId,
    client_secret: env.stravaClientSecret,
    code,
    grant_type: "authorization_code",
  });

  const response = await fetch(`${env.stravaOauthBaseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const providerPayload = await parseProviderError(response);
    const error = new Error("Failed to exchange Strava authorization code");
    error.providerStatus = response.status;
    error.providerPayload = providerPayload;
    throw error;
  }

  return response.json();
}

export async function refreshStravaToken(refreshToken) {
  const body = new URLSearchParams({
    client_id: env.stravaClientId,
    client_secret: env.stravaClientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(`${env.stravaOauthBaseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const providerPayload = await parseProviderError(response);
    const error = new Error("Failed to refresh Strava token");
    error.providerStatus = response.status;
    error.providerPayload = providerPayload;
    throw error;
  }

  return response.json();
}

export async function getStravaActivities({ accessToken, page = 1, perPage = 30, after, before }) {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  if (after) {
    query.set("after", String(after));
  }

  if (before) {
    query.set("before", String(before));
  }

  const response = await fetch(`${env.stravaApiBaseUrl}/athlete/activities?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const providerPayload = await parseProviderError(response);
    const error = new Error("Failed to fetch Strava activities");
    error.providerStatus = response.status;
    error.providerPayload = providerPayload;
    throw error;
  }

  return response.json();
}