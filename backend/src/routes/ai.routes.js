import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { authGuard } from "../middleware/auth.js";
import { checkRateLimit } from "../lib/rate-limit.js";

const router = Router();

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().trim().min(1).max(8000),
});

const aiChatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(64).max(4000).optional().default(600),
  model: z.string().min(3).max(100).optional(),
});

function getAiMode() {
  if (env.aiForceLocal || !env.openrouterApiKey) {
    return "local";
  }
  return "openrouter";
}

function getAiStatusPayload() {
  if (env.aiForceLocal) {
    return {
      mode: "local",
      model: "local-fallback-coach",
      reasonCode: "FORCE_LOCAL",
      hint: "Выключите AI_FORCE_LOCAL в backend/.env и перезапустите PM2 с --update-env.",
      hasApiKey: Boolean(env.openrouterApiKey),
    };
  }

  if (!env.openrouterApiKey) {
    return {
      mode: "local",
      model: "local-fallback-coach",
      reasonCode: "NO_API_KEY",
      hint: "Добавьте OPENROUTER_API_KEY в backend/.env и перезапустите PM2 с --update-env.",
      hasApiKey: false,
    };
  }

  return {
    mode: "openrouter",
    model: env.openrouterModel,
    reasonCode: null,
    hint: null,
    hasApiKey: true,
  };
}

function buildFallbackReply(messages) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content?.toLowerCase() || "";

  if (lastUserMessage.includes("пит") || lastUserMessage.includes("еда") || lastUserMessage.includes("диет")) {
    return [
      "Короткий план по питанию на каждый день:",
      "1) Белок в каждом приеме пищи: яйца, рыба, мясо, творог, бобовые.",
      "2) Овощи 400-600 г в день и вода 25-35 мл на 1 кг веса.",
      "3) Простая формула тарелки: 1/2 овощи, 1/4 белок, 1/4 сложные углеводы.",
      "4) Если цель похудеть: дефицит 10-15% и контроль калорий 7-10 дней.",
      "Если хотите, составлю меню на 3 дня под ваш вес, рост и цель.",
    ].join("\n");
  }

  if (lastUserMessage.includes("техник") || lastUserMessage.includes("присед") || lastUserMessage.includes("тяга")) {
    return [
      "Базовые правила техники:",
      "1) Нейтральная спина и контроль корпуса в каждом повторении.",
      "2) Начните с легкого веса, пока не закрепите амплитуду и ритм.",
      "3) Движение без рывков, выдох на усилии, вдох в эксцентрике.",
      "4) Остановитесь при острой боли и снизьте нагрузку.",
      "Напишите конкретное упражнение, и я дам пошаговый чек-лист под него.",
    ].join("\n");
  }

  if (lastUserMessage.includes("мотива") || lastUserMessage.includes("лен") || lastUserMessage.includes("привыч")) {
    return [
      "План против срывов:",
      "1) Минимум-действие: 15 минут тренировки в любой день, даже если нет сил.",
      "2) Жесткий график: 3 фиксированных слота в неделю в календаре.",
      "3) Отслеживайте прогресс: вес, повторения, самочувствие 1 раз в неделю.",
      "4) Фокус на серии, а не идеале: цель - не пропускать 2 тренировки подряд.",
      "Если хотите, соберу персональный план привычек на 14 дней.",
    ].join("\n");
  }

  return [
    "Я на связи. Давайте начнем с понятного базового плана:",
    "1) 3 тренировки в неделю: день A (ноги+кор), день B (верх), день C (смешанная).",
    "2) На тренировку: 5-6 упражнений, 3 подхода, 8-12 повторений.",
    "3) Прогрессия: каждую неделю +1-2 повторения или +2.5-5% веса.",
    "4) Сон 7-9 часов, вода и белок ежедневно.",
    "Напишите цель (похудение, набор массы, выносливость), и я соберу персональную программу.",
  ].join("\n");
}

router.post("/chat", authGuard, async (req, res, next) => {
  try {
    const parsed = aiChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const limit = checkRateLimit(
      `ai:${req.user.sub}`,
      env.aiRateLimitMaxRequests,
      env.aiRateLimitWindowSec * 1000,
    );

    res.setHeader("X-RateLimit-Limit", String(env.aiRateLimitMaxRequests));
    res.setHeader("X-RateLimit-Remaining", String(limit.remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.floor(limit.resetAt / 1000)));

    if (!limit.allowed) {
      return res.status(429).json({
        message: "Rate limit exceeded. Please try again later",
        retryAfterSec: Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000)),
      });
    }

    const { messages, temperature, maxTokens, model } = parsed.data;

    if (getAiMode() === "local") {
      return res.json({
        reply: buildFallbackReply(messages),
        model: "local-fallback-coach",
        usage: null,
        requestId: null,
        providerStatus: "fallback",
      });
    }

    const requestBody = {
      model: model || env.openrouterModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    const response = await fetch(`${env.openrouterBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openrouterApiKey}`,
        "Content-Type": "application/json",
        ...(env.openrouterSiteUrl ? { "HTTP-Referer": env.openrouterSiteUrl } : {}),
        ...(env.openrouterSiteName ? { "X-Title": env.openrouterSiteName } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return res.json({
        reply: buildFallbackReply(messages),
        model: "local-fallback-coach",
        usage: null,
        requestId: null,
        providerStatus: response.status,
        providerError: payload || null,
      });
    }

    const reply = payload?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.json({
        reply: buildFallbackReply(messages),
        model: "local-fallback-coach",
        usage: null,
        requestId: payload?.id || null,
        providerStatus: "empty_response",
      });
    }

    return res.json({
      reply,
      model: payload.model,
      usage: payload.usage || null,
      requestId: payload.id || null,
    });
  } catch (error) {
    const fallbackMessages = aiChatSchema.safeParse(req.body);
    if (fallbackMessages.success) {
      return res.json({
        reply: buildFallbackReply(fallbackMessages.data.messages),
        model: "local-fallback-coach",
        usage: null,
        requestId: null,
        providerStatus: "exception_fallback",
      });
    }
    return next(error);
  }
});

router.get("/status", authGuard, (_req, res) => {
  return res.json(getAiStatusPayload());
});

export default router;