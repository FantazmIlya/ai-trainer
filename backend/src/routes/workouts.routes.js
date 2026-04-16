import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

const manualWorkoutSchema = z.object({
  title: z.string().trim().min(3).max(140),
  type: z.string().trim().min(2).max(80),
  startedAt: z.coerce.date(),
  distanceKm: z.coerce.number().min(0).max(1000).optional(),
  durationMin: z.coerce.number().min(0).max(10000).optional(),
  calories: z.coerce.number().int().min(0).max(25000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const importSchema = z.object({
  fileName: z.string().trim().min(3).max(200),
  content: z.string().min(1),
});

const pushSchema = z.object({
  title: z.string().trim().min(3).max(140),
  type: z.string().trim().min(2).max(80),
  startedAt: z.coerce.date(),
  distanceKm: z.coerce.number().min(0).max(1000).optional(),
  durationMin: z.coerce.number().min(0).max(10000).optional(),
  calories: z.coerce.number().int().min(0).max(25000).optional(),
  notes: z.string().trim().max(2000).optional(),
  externalId: z.string().trim().max(160).optional(),
});

const wearableProviders = [
  {
    id: "garmin",
    name: "Garmin Connect",
    mode: "FILE_EXPORT",
    summary: "Экспорт тренировки из Garmin Connect в GPX/TCX и импорт в кабинет.",
    formats: ["gpx", "tcx"],
  },
  {
    id: "polar",
    name: "Polar Flow",
    mode: "FILE_EXPORT",
    summary: "Экспорт тренировок в GPX/CSV и загрузка в один клик через импорт файла.",
    formats: ["gpx", "csv"],
  },
  {
    id: "suunto",
    name: "Suunto",
    mode: "FILE_EXPORT",
    summary: "Выгрузка тренировок из Suunto App в GPX с последующим импортом.",
    formats: ["gpx"],
  },
  {
    id: "universal_api",
    name: "Универсальный API",
    mode: "API_PUSH",
    summary: "Подключение через персональный API-ключ для любого трекера с webhook или автоматизацией.",
    formats: ["json"],
  },
];

function hashApiKey(value) {
  return createHash("sha256").update(`${env.workoutApiKeySalt}:${value}`).digest("hex");
}

function fileExt(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) {
    return "";
  }
  return fileName.slice(dotIndex + 1).toLowerCase();
}

function parseCsvRows(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const header = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const index = {
    title: header.indexOf("title"),
    type: header.indexOf("type"),
    startedAt: header.indexOf("started_at"),
    distanceKm: header.indexOf("distance_km"),
    durationMin: header.indexOf("duration_min"),
    calories: header.indexOf("calories"),
    notes: header.indexOf("notes"),
  };

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((item) => item.trim());
    return {
      title: index.title >= 0 ? values[index.title] : "Imported workout",
      type: index.type >= 0 ? values[index.type] : "Workout",
      startedAt: index.startedAt >= 0 ? values[index.startedAt] : new Date().toISOString(),
      distanceKm: index.distanceKm >= 0 ? Number(values[index.distanceKm]) : null,
      durationMin: index.durationMin >= 0 ? Number(values[index.durationMin]) : null,
      calories: index.calories >= 0 ? Number(values[index.calories]) : null,
      notes: index.notes >= 0 ? values[index.notes] : null,
    };
  });
}

function parseGpx(text, name) {
  const title = /<name>([^<]+)<\/name>/i.exec(text)?.[1]?.trim() || name.replace(/\.[^.]+$/, "");
  const startedAt = /<time>([^<]+)<\/time>/i.exec(text)?.[1] || new Date().toISOString();

  return [
    {
      title,
      type: "Run",
      startedAt,
      distanceKm: null,
      durationMin: null,
      calories: null,
      notes: "Импортировано из GPX файла",
    },
  ];
}

function parseTcx(text, name) {
  const title = /<Id>([^<]+)<\/Id>/i.exec(text)?.[1]?.trim() || name.replace(/\.[^.]+$/, "");
  const startedAt = /<Id>([^<]+)<\/Id>/i.exec(text)?.[1] || new Date().toISOString();
  const distanceMeters = Number(/<DistanceMeters>([^<]+)<\/DistanceMeters>/i.exec(text)?.[1] || "NaN");
  const totalTimeSec = Number(/<TotalTimeSeconds>([^<]+)<\/TotalTimeSeconds>/i.exec(text)?.[1] || "NaN");
  const calories = Number(/<Calories>([^<]+)<\/Calories>/i.exec(text)?.[1] || "NaN");

  return [
    {
      title,
      type: "Workout",
      startedAt,
      distanceKm: Number.isFinite(distanceMeters) ? distanceMeters / 1000 : null,
      durationMin: Number.isFinite(totalTimeSec) ? totalTimeSec / 60 : null,
      calories: Number.isFinite(calories) ? Math.round(calories) : null,
      notes: "Импортировано из TCX файла",
    },
  ];
}

function parseImportedWorkouts(fileName, content) {
  const ext = fileExt(fileName);
  if (ext === "csv") {
    return parseCsvRows(content);
  }
  if (ext === "gpx") {
    return parseGpx(content, fileName);
  }
  if (ext === "tcx") {
    return parseTcx(content, fileName);
  }
  throw new Error("Поддерживаются только CSV, GPX и TCX файлы");
}

router.get("/", authGuard, async (req, res, next) => {
  try {
    const items = await prisma.workout.findMany({
      where: { userId: req.user.sub },
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
    });
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

router.post("/manual", authGuard, async (req, res, next) => {
  try {
    const parsed = manualWorkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const workout = await prisma.workout.create({
      data: {
        userId: req.user.sub,
        source: "MANUAL",
        title: parsed.data.title,
        type: parsed.data.type,
        startedAt: parsed.data.startedAt,
        distanceKm: parsed.data.distanceKm ?? null,
        durationMin: parsed.data.durationMin ?? null,
        calories: parsed.data.calories ?? null,
        notes: parsed.data.notes ?? null,
      },
    });

    return res.status(201).json({ workout });
  } catch (error) {
    return next(error);
  }
});

router.post("/import", authGuard, async (req, res, next) => {
  try {
    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const rows = parseImportedWorkouts(parsed.data.fileName, parsed.data.content).slice(0, 500);
    if (!rows.length) {
      return res.status(400).json({ message: "Файл не содержит тренировок для импорта" });
    }

    await prisma.$transaction(
      rows.map((row) =>
        prisma.workout.create({
          data: {
            userId: req.user.sub,
            source: "FILE_IMPORT",
            title: row.title,
            type: row.type,
            startedAt: new Date(row.startedAt),
            distanceKm: Number.isFinite(row.distanceKm) ? row.distanceKm : null,
            durationMin: Number.isFinite(row.durationMin) ? row.durationMin : null,
            calories: Number.isFinite(row.calories) ? Math.round(row.calories) : null,
            notes: row.notes,
            rawPayload: { fileName: parsed.data.fileName },
          },
        }),
      ),
    );

    return res.json({ importedCount: rows.length, fileName: parsed.data.fileName });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Поддерживаются")) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

router.get("/integration/me", authGuard, async (req, res, next) => {
  try {
    const apiKey = await prisma.workoutApiKey.findFirst({
      where: { userId: req.user.sub, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        keyPreview: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return res.json({
      endpoint: "/api/workouts/integration/push/{API_KEY}",
      apiKey,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/integration/providers", authGuard, (_req, res) => {
  return res.json({ providers: wearableProviders });
});

router.post("/integration/regenerate-key", authGuard, async (req, res, next) => {
  try {
    await prisma.workoutApiKey.updateMany({ where: { userId: req.user.sub, revokedAt: null }, data: { revokedAt: new Date() } });

    const rawKey = `wk_${randomBytes(24).toString("hex")}`;
    const created = await prisma.workoutApiKey.create({
      data: {
        userId: req.user.sub,
        keyHash: hashApiKey(rawKey),
        keyPreview: `${rawKey.slice(0, 8)}...${rawKey.slice(-6)}`,
      },
      select: {
        id: true,
        keyPreview: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ apiKey: rawKey, keyMeta: created });
  } catch (error) {
    return next(error);
  }
});

router.post("/integration/push/:apiKey", async (req, res, next) => {
  try {
    const apiKey = String(req.params.apiKey || "");
    if (apiKey.length < 20) {
      return res.status(401).json({ message: "Invalid API key" });
    }

    const keyHash = hashApiKey(apiKey);
    const connection = await prisma.workoutApiKey.findUnique({
      where: { keyHash },
      select: { id: true, userId: true, revokedAt: true },
    });

    if (!connection || connection.revokedAt) {
      return res.status(401).json({ message: "Invalid API key" });
    }

    const parsed = pushSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const workout = await prisma.workout.create({
      data: {
        userId: connection.userId,
        source: "API",
        title: parsed.data.title,
        type: parsed.data.type,
        startedAt: parsed.data.startedAt,
        distanceKm: parsed.data.distanceKm ?? null,
        durationMin: parsed.data.durationMin ?? null,
        calories: parsed.data.calories ?? null,
        notes: parsed.data.notes ?? null,
        externalId: parsed.data.externalId ?? null,
        rawPayload: parsed.data,
      },
      select: { id: true, title: true, startedAt: true },
    });

    await prisma.workoutApiKey.update({ where: { keyHash }, data: { lastUsedAt: new Date() } });

    return res.status(201).json({ workout });
  } catch (error) {
    return next(error);
  }
});

export default router;