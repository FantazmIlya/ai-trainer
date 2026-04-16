import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authGuard, roleGuard } from "../middleware/auth.js";

const router = Router();

const listUsersQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]),
});

const updateRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

router.use(authGuard, roleGuard("ADMIN"));

router.get("/users", async (req, res, next) => {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
    }

    const { search, role, status, page, limit } = parsed.data;

    const where = {
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { id: { equals: search } },
            ],
          }
        : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    };

    const [total, items, summary] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              payments: true,
              subscriptions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const statusSummary = {
      ACTIVE: summary.find((entry) => entry.status === "ACTIVE")?._count._all || 0,
      BLOCKED: summary.find((entry) => entry.status === "BLOCKED")?._count._all || 0,
    };

    return res.json({
      items,
      summary: statusSummary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:id/status", async (req, res, next) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    if (req.params.id === req.user.sub && parsed.data.status === "BLOCKED") {
      return res.status(400).json({ message: "You cannot block your own account" });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
      select: { id: true, email: true, role: true, status: true, createdAt: true },
    });

    if (parsed.data.status === "BLOCKED") {
      await prisma.refreshToken.updateMany({
        where: { userId: req.params.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    if (req.params.id === req.user.sub && parsed.data.role !== "ADMIN") {
      return res.status(400).json({ message: "You cannot revoke your own admin role" });
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: parsed.data.role },
      select: { id: true, email: true, role: true, status: true, createdAt: true },
    });

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

export default router;