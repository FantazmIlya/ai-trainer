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

router.post("/chat", authGuard, async (req, res, next) => {
  try {
    if (!env.grokApiKey) {
      return res.status(503).json({ message: "AI service is not configured" });
    }

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
    const requestBody = {
      model: model || env.grokModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    const response = await fetch(`${env.grokBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.grokApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(502).json({
        message: "AI provider request failed",
        providerStatus: response.status,
        providerError: payload,
      });
    }

    const reply = payload?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(502).json({ message: "AI provider returned an empty response" });
    }

    return res.json({
      reply,
      model: payload.model,
      usage: payload.usage || null,
      requestId: payload.id || null,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;