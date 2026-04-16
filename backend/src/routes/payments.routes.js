import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import {
  createYooKassaPayment,
  getYooKassaPaymentById,
  mapYooAmountToKopecks,
  mapYooKassaStatus,
} from "../lib/yookassa.js";
import { authGuard, roleGuard } from "../middleware/auth.js";

const router = Router();

const createPlanSchema = z.object({
  code: z.string().trim().min(3).max(64),
  title: z.string().trim().min(2).max(120),
  amount: z.number().int().min(100),
  currency: z.string().trim().length(3).default("RUB"),
  intervalDays: z.number().int().min(1).max(365),
  isActive: z.boolean().default(true),
});

const updatePlanSchema = createPlanSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required",
);

const createPaymentSchema = z.object({
  planCode: z.string().trim().min(3).max(64),
  returnUrl: z.string().url().optional(),
});

const webhookSchema = z.object({
  event: z.string().min(2),
  object: z.object({
    id: z.string().min(6),
    status: z.string().min(3),
    paid: z.boolean().optional(),
    amount: z
      .object({
        value: z.string(),
        currency: z.string().length(3),
      })
      .optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    captured_at: z.string().datetime().optional(),
  }),
});

async function activateSubscriptionForPayment(tx, { userId, plan, providerPaymentId, paidAt }) {
  const now = new Date();
  const activeSubscription = await tx.subscription.findFirst({
    where: {
      userId,
      planId: plan.id,
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
    orderBy: { expiresAt: "desc" },
  });

  const startFrom = activeSubscription ? activeSubscription.expiresAt : now;
  const nextExpiresAt = new Date(startFrom.getTime() + plan.intervalDays * 24 * 60 * 60 * 1000);

  if (activeSubscription) {
    return tx.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        expiresAt: nextExpiresAt,
        yookassaPaymentId: providerPaymentId,
      },
    });
  }

  return tx.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: "ACTIVE",
      startedAt: now,
      expiresAt: nextExpiresAt,
      yookassaPaymentId: providerPaymentId,
    },
  });
}

router.get("/plans", async (_req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ amount: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        code: true,
        title: true,
        amount: true,
        currency: true,
        intervalDays: true,
      },
    });

    return res.json({ plans });
  } catch (error) {
    return next(error);
  }
});

router.get("/subscription/me", authGuard, async (req, res, next) => {
  try {
    const now = new Date();
    const [activeSubscription, latestPayments] = await Promise.all([
      prisma.subscription.findFirst({
        where: {
          userId: req.user.sub,
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
        include: {
          plan: {
            select: { id: true, code: true, title: true, intervalDays: true, amount: true, currency: true },
          },
        },
        orderBy: { expiresAt: "desc" },
      }),
      prisma.payment.findMany({
        where: { userId: req.user.sub },
        include: { plan: { select: { code: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return res.json({
      hasPremiumAccess: Boolean(activeSubscription),
      activeSubscription,
      latestPayments,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/yookassa/create", authGuard, async (req, res, next) => {
  try {
    if (!env.yookassaShopId || !env.yookassaSecretKey) {
      return res.status(503).json({ message: "YooKassa is not configured" });
    }

    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const plan = await prisma.plan.findFirst({
      where: { code: parsed.data.planCode, isActive: true },
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const idempotenceKey = randomUUID();
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: req.user.sub,
        planId: plan.id,
        idempotenceKey,
        amount: plan.amount,
        currency: plan.currency,
        provider: "YOOKASSA",
        status: "PENDING",
        description: `Subscription payment for ${plan.title}`,
        metadata: {
          userId: req.user.sub,
          planId: plan.id,
          planCode: plan.code,
        },
      },
    });

    try {
      const providerPayment = await createYooKassaPayment({
        idempotenceKey,
        amount: plan.amount,
        currency: plan.currency,
        description: `AI Trainer subscription: ${plan.title}`,
        returnUrl: parsed.data.returnUrl || env.yookassaReturnUrl,
        metadata: {
          paymentId: paymentRecord.id,
          userId: req.user.sub,
          planCode: plan.code,
        },
      });

      const providerStatus = mapYooKassaStatus(providerPayment.status);
      const paidAt = providerPayment.paid && providerPayment.captured_at ? new Date(providerPayment.captured_at) : null;

      const updated = await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          providerPaymentId: providerPayment.id,
          status: providerStatus,
          rawPayload: providerPayment,
          paidAt,
        },
      });

      if (providerStatus === "SUCCEEDED") {
        await prisma.$transaction(async (tx) => {
          const subscription = await activateSubscriptionForPayment(tx, {
            userId: req.user.sub,
            plan,
            providerPaymentId: providerPayment.id,
            paidAt: paidAt || new Date(),
          });

          await tx.payment.update({
            where: { id: updated.id },
            data: { subscriptionId: subscription.id, paidAt: paidAt || new Date() },
          });
        });
      }

      return res.status(201).json({
        payment: updated,
        confirmationUrl: providerPayment?.confirmation?.confirmation_url || null,
      });
    } catch (providerError) {
      await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: "CANCELED",
          rawPayload: {
            error: providerError.providerPayload || providerError.message,
            providerStatus: providerError.providerStatus || null,
          },
        },
      });

      return res.status(502).json({
        message: "Failed to create payment in YooKassa",
        providerStatus: providerError.providerStatus || null,
        providerError: providerError.providerPayload || null,
      });
    }
  } catch (error) {
    return next(error);
  }
});

router.post("/yookassa/webhook", async (req, res, next) => {
  try {
    if (!env.yookassaShopId || !env.yookassaSecretKey) {
      return res.status(503).json({ message: "YooKassa is not configured" });
    }

    const parsed = webhookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid webhook payload", errors: parsed.error.flatten() });
    }

    const providerObject = parsed.data.object;
    const remotePayment = await getYooKassaPaymentById(providerObject.id);
    const providerStatus = mapYooKassaStatus(remotePayment.status);
    const amountInKopecks = remotePayment?.amount?.value
      ? mapYooAmountToKopecks(remotePayment.amount.value)
      : null;

    const metadata = remotePayment?.metadata || {};

    await prisma.$transaction(async (tx) => {
      let payment = await tx.payment.findFirst({
        where: {
          OR: [
            { providerPaymentId: remotePayment.id },
            metadata.paymentId ? { id: metadata.paymentId } : undefined,
          ].filter(Boolean),
        },
        include: { plan: true },
      });

      if (!payment && metadata.userId) {
        const plan = metadata.planCode
          ? await tx.plan.findFirst({ where: { code: metadata.planCode } })
          : null;

        payment = await tx.payment.create({
          data: {
            userId: metadata.userId,
            planId: plan?.id || null,
            provider: "YOOKASSA",
            idempotenceKey: randomUUID(),
            providerPaymentId: remotePayment.id,
            amount: amountInKopecks || plan?.amount || 0,
            currency: remotePayment?.amount?.currency || plan?.currency || "RUB",
            status: providerStatus,
            rawPayload: remotePayment,
            metadata,
            paidAt: remotePayment.paid && remotePayment.captured_at ? new Date(remotePayment.captured_at) : null,
          },
          include: { plan: true },
        });
      }

      if (!payment) {
        return;
      }

      const nextData = {
        providerPaymentId: remotePayment.id,
        status: providerStatus,
        rawPayload: remotePayment,
        paidAt: remotePayment.paid && remotePayment.captured_at ? new Date(remotePayment.captured_at) : null,
      };

      await tx.payment.update({
        where: { id: payment.id },
        data: nextData,
      });

      if (providerStatus === "SUCCEEDED" && payment.plan) {
        const subscription = await activateSubscriptionForPayment(tx, {
          userId: payment.userId,
          plan: payment.plan,
          providerPaymentId: remotePayment.id,
          paidAt: nextData.paidAt || new Date(),
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: { subscriptionId: subscription.id, paidAt: nextData.paidAt || new Date() },
        });
      }
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/plans", authGuard, roleGuard("ADMIN"), async (req, res, next) => {
  try {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const plan = await prisma.plan.create({ data: parsed.data });
    return res.status(201).json({ plan });
  } catch (error) {
    return next(error);
  }
});

router.put("/admin/plans/:id", authGuard, roleGuard("ADMIN"), async (req, res, next) => {
  try {
    const parsed = updatePlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const plan = await prisma.plan.update({ where: { id: req.params.id }, data: parsed.data });
    return res.json({ plan });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/payments", authGuard, roleGuard("ADMIN"), async (req, res, next) => {
  try {
    const items = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, email: true } },
        plan: { select: { id: true, code: true, title: true } },
        subscription: { select: { id: true, status: true, expiresAt: true } },
      },
    });

    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

export default router;