import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { env } from "../config/env.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(72),
});

router.post("/register", async (req, res, next) => {
  try {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password) },
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const refreshHash = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: new Date(Date.now() + env.jwtRefreshExpiresDays * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "BLOCKED") {
      return res.status(403).json({ message: "Account is blocked" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const refreshHash = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: new Date(Date.now() + env.jwtRefreshExpiresDays * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({ message: "refreshToken is required" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const refreshHash = hashToken(refreshToken);
    const savedToken = await prisma.refreshToken.findUnique({ where: { tokenHash: refreshHash } });

    if (!savedToken || savedToken.revokedAt || savedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh token is not active" });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === "BLOCKED") {
      return res.status(401).json({ message: "User is not active" });
    }

    const newAccessToken = signAccessToken(user);
    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({ message: "refreshToken is required" });
    }

    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authGuard, async (req, res, next) => {
  try {
    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        subscriptions: {
          where: {
            status: "ACTIVE",
            expiresAt: { gt: now },
          },
          orderBy: { expiresAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            startedAt: true,
            expiresAt: true,
            plan: {
              select: {
                id: true,
                code: true,
                title: true,
                amount: true,
                currency: true,
                intervalDays: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        activeSubscription: user.subscriptions[0] || null,
        hasPremiumAccess: Boolean(user.subscriptions[0]),
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;