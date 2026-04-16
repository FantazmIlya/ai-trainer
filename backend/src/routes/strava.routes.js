import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { exchangeCodeForToken, getStravaActivities, refreshStravaToken } from "../lib/strava.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

const connectSchema = z.object({
  scope: z.string().trim().min(4).max(200).optional(),
});

const importSchema = z.object({
  page: z.coerce.number().int().min(1).max(20).optional(),
  perPage: z.coerce.number().int().min(1).max(200).optional(),
  after: z.coerce.number().int().positive().optional(),
  before: z.coerce.number().int().positive().optional(),
});

function stravaConfigured() {
  return Boolean(env.stravaClientId && env.stravaClientSecret && env.stravaRedirectUri);
}

function signState(userId) {
  return jwt.sign({ sub: userId, type: "strava_connect", nonce: randomUUID() }, env.stravaStateSecret, {
    expiresIn: "10m",
  });
}

function verifyState(state) {
  return jwt.verify(state, env.stravaStateSecret);
}

async function ensureValidAccessToken(connection) {
  const nowWithSkew = Date.now() + 60 * 1000;
  if (connection.expiresAt.getTime() > nowWithSkew) {
    return connection;
  }

  const refreshed = await refreshStravaToken(connection.refreshToken);
  return prisma.stravaConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      tokenType: refreshed.token_type || "Bearer",
      scope: refreshed.scope || connection.scope,
      expiresAt: new Date((refreshed.expires_at || 0) * 1000),
      athleteId: String(refreshed.athlete?.id || connection.athleteId),
      athleteUsername: refreshed.athlete?.username || connection.athleteUsername,
      athleteFirstName: refreshed.athlete?.firstname || connection.athleteFirstName,
      athleteLastName: refreshed.athlete?.lastname || connection.athleteLastName,
    },
  });
}

router.get("/connect-url", authGuard, async (req, res, next) => {
  try {
    if (!stravaConfigured()) {
      return res.status(503).json({ message: "Strava is not configured" });
    }

    const parsed = connectSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
    }

    const scope = parsed.data.scope || "read,activity:read_all";
    const state = signState(req.user.sub);

    const authUrl = new URL(`${env.stravaOauthBaseUrl}/authorize`);
    authUrl.searchParams.set("client_id", env.stravaClientId);
    authUrl.searchParams.set("redirect_uri", env.stravaRedirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("approval_prompt", "auto");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", state);

    return res.json({ authUrl: authUrl.toString() });
  } catch (error) {
    return next(error);
  }
});

router.get("/callback", async (req, res, next) => {
  try {
    if (!stravaConfigured()) {
      return res.status(503).json({ message: "Strava is not configured" });
    }

    const { code, state, error: providerError } = req.query;

    if (providerError) {
      const errorUrl = new URL(env.stravaFrontendErrorUrl);
      errorUrl.searchParams.set("reason", String(providerError));
      return res.redirect(errorUrl.toString());
    }

    if (!code || typeof code !== "string" || !state || typeof state !== "string") {
      return res.status(400).json({ message: "Missing code or state" });
    }

    let statePayload;
    try {
      statePayload = verifyState(state);
    } catch {
      return res.status(400).json({ message: "Invalid or expired state" });
    }

    if (!statePayload?.sub || statePayload.type !== "strava_connect") {
      return res.status(400).json({ message: "Invalid state payload" });
    }

    const tokenResponse = await exchangeCodeForToken(code);

    await prisma.stravaConnection.upsert({
      where: { userId: statePayload.sub },
      update: {
        athleteId: String(tokenResponse.athlete?.id || ""),
        athleteUsername: tokenResponse.athlete?.username || null,
        athleteFirstName: tokenResponse.athlete?.firstname || null,
        athleteLastName: tokenResponse.athlete?.lastname || null,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenType: tokenResponse.token_type || "Bearer",
        scope: tokenResponse.scope || null,
        expiresAt: new Date((tokenResponse.expires_at || 0) * 1000),
      },
      create: {
        userId: statePayload.sub,
        athleteId: String(tokenResponse.athlete?.id || ""),
        athleteUsername: tokenResponse.athlete?.username || null,
        athleteFirstName: tokenResponse.athlete?.firstname || null,
        athleteLastName: tokenResponse.athlete?.lastname || null,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenType: tokenResponse.token_type || "Bearer",
        scope: tokenResponse.scope || null,
        expiresAt: new Date((tokenResponse.expires_at || 0) * 1000),
      },
    });

    const successUrl = new URL(env.stravaFrontendSuccessUrl);
    successUrl.searchParams.set("athleteId", String(tokenResponse.athlete?.id || ""));
    return res.redirect(successUrl.toString());
  } catch (error) {
    return next(error);
  }
});

router.get("/connection/me", authGuard, async (req, res, next) => {
  try {
    const connection = await prisma.stravaConnection.findUnique({
      where: { userId: req.user.sub },
      include: {
        activities: {
          orderBy: { startDate: "desc" },
          take: 20,
          select: {
            id: true,
            externalId: true,
            name: true,
            sportType: true,
            distance: true,
            movingTime: true,
            elapsedTime: true,
            startDate: true,
            createdAt: true,
          },
        },
      },
    });

    if (!connection) {
      return res.json({ connected: false, connection: null, activities: [] });
    }

    return res.json({
      connected: true,
      connection: {
        id: connection.id,
        athleteId: connection.athleteId,
        athleteUsername: connection.athleteUsername,
        athleteFirstName: connection.athleteFirstName,
        athleteLastName: connection.athleteLastName,
        scope: connection.scope,
        expiresAt: connection.expiresAt,
        lastSyncedAt: connection.lastSyncedAt,
        createdAt: connection.createdAt,
      },
      activities: connection.activities,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/import", authGuard, async (req, res, next) => {
  try {
    if (!stravaConfigured()) {
      return res.status(503).json({ message: "Strava is not configured" });
    }

    const parsed = importSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const connection = await prisma.stravaConnection.findUnique({ where: { userId: req.user.sub } });
    if (!connection) {
      return res.status(404).json({ message: "Strava account is not connected" });
    }

    const activeConnection = await ensureValidAccessToken(connection);
    const page = parsed.data.page || 1;
    const perPage = parsed.data.perPage || 30;

    const activities = await getStravaActivities({
      accessToken: activeConnection.accessToken,
      page,
      perPage,
      after: parsed.data.after,
      before: parsed.data.before,
    });

    let created = 0;
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const activity of activities) {
        const externalId = String(activity.id);
        const existing = await tx.stravaActivity.findUnique({
          where: {
            userId_externalId: {
              userId: req.user.sub,
              externalId,
            },
          },
          select: { id: true },
        });

        if (existing) {
          updated += 1;
          await tx.stravaActivity.update({
            where: { id: existing.id },
            data: {
              connectionId: activeConnection.id,
              name: activity.name || null,
              sportType: activity.sport_type || activity.type || null,
              distance: typeof activity.distance === "number" ? activity.distance : null,
              movingTime: typeof activity.moving_time === "number" ? activity.moving_time : null,
              elapsedTime: typeof activity.elapsed_time === "number" ? activity.elapsed_time : null,
              startDate: activity.start_date ? new Date(activity.start_date) : null,
              rawPayload: activity,
            },
          });
          continue;
        }

        created += 1;
        await tx.stravaActivity.create({
          data: {
            connectionId: activeConnection.id,
            userId: req.user.sub,
            externalId,
            name: activity.name || null,
            sportType: activity.sport_type || activity.type || null,
            distance: typeof activity.distance === "number" ? activity.distance : null,
            movingTime: typeof activity.moving_time === "number" ? activity.moving_time : null,
            elapsedTime: typeof activity.elapsed_time === "number" ? activity.elapsed_time : null,
            startDate: activity.start_date ? new Date(activity.start_date) : null,
            rawPayload: activity,
          },
        });
      }

      await tx.stravaConnection.update({
        where: { id: activeConnection.id },
        data: { lastSyncedAt: new Date() },
      });
    });

    return res.json({
      importedCount: activities.length,
      created,
      updated,
      page,
      perPage,
    });
  } catch (error) {
    if (error.providerStatus) {
      return res.status(502).json({
        message: "Strava request failed",
        providerStatus: error.providerStatus,
        providerError: error.providerPayload || null,
      });
    }

    return next(error);
  }
});

router.delete("/connection", authGuard, async (req, res, next) => {
  try {
    await prisma.stravaConnection.deleteMany({ where: { userId: req.user.sub } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;