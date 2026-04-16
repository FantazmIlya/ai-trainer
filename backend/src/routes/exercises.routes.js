import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authGuard, roleGuard } from "../middleware/auth.js";

const router = Router();

const exerciseLevelEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

const createExerciseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  muscleGroup: z.string().trim().min(2).max(80),
  level: exerciseLevelEnum,
  description: z.string().trim().min(20).max(5000),
  imageUrl: z.string().url().max(1000).optional().nullable(),
  videoUrl: z.string().url().max(1000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional().default([]),
  isPublished: z.boolean().optional().default(true),
});

const updateExerciseSchema = createExerciseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required",
);

const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  muscleGroup: z.string().trim().max(80).optional(),
  level: exerciseLevelEnum.optional(),
  published: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const demoExercises = [
  {
    id: "demo-squat",
    title: "Приседания с собственным весом",
    muscleGroup: "Ноги и ягодицы",
    level: "BEGINNER",
    description:
      "Поставьте стопы чуть шире плеч, носки слегка в стороны. Опускайтесь до параллели бедер с полом, держите спину нейтральной и колени в направлении носков.",
    imageUrl: "/images/ex-squat.jpg",
    videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U",
    tags: ["ноги", "ягодицы", "база", "техника"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-pushup",
    title: "Отжимания от пола",
    muscleGroup: "Грудь, плечи, трицепс",
    level: "BEGINNER",
    description:
      "Ладони под плечами, корпус в прямой линии. Опускайтесь до комфортной глубины, локти под углом около 45 градусов, без провалов в пояснице.",
    imageUrl: "/images/ex-pushup.jpg",
    videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
    tags: ["верх", "грудь", "трицепс", "дом"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-plank",
    title: "Планка на предплечьях",
    muscleGroup: "Кор и стабилизаторы",
    level: "BEGINNER",
    description:
      "Локти под плечами, таз не проваливается. Держите корпус напряженным, шея в нейтрали, дыхание спокойное. Начинайте с 20-40 секунд.",
    imageUrl: "/images/ex-plank.jpg",
    videoUrl: "https://www.youtube.com/watch?v=pSHjTRCQxIw",
    tags: ["пресс", "кор", "стабилизация"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-lunge",
    title: "Выпады вперед",
    muscleGroup: "Ноги и ягодицы",
    level: "BEGINNER",
    description:
      "Сделайте длинный шаг вперед, опускайтесь до угла 90 градусов в коленях. Корпус держите ровно, вес распределен между обеими ногами.",
    imageUrl: "/images/ex-lunge.jpg",
    videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
    tags: ["ноги", "баланс", "дом"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-row",
    title: "Тяга к поясу в тренажере",
    muscleGroup: "Спина и бицепс",
    level: "INTERMEDIATE",
    description:
      "Сохраняйте нейтральную спину и тяните рукоять к корпусу, сводя лопатки в конце амплитуды. Не раскачивайтесь корпусом.",
    imageUrl: "/images/ex-row.jpg",
    videoUrl: "https://www.youtube.com/watch?v=GZbfZ033f74",
    tags: ["спина", "тяга", "зал"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-deadbug",
    title: "Dead Bug",
    muscleGroup: "Кор и поясница",
    level: "BEGINNER",
    description:
      "Прижимайте поясницу к полу и попеременно выпрямляйте противоположные руку и ногу. Двигайтесь медленно, сохраняя контроль.",
    imageUrl: "/images/ex-deadbug.jpg",
    videoUrl: "https://www.youtube.com/watch?v=g_BYB0R-4Ws",
    tags: ["кор", "осанка", "контроль"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-burpee",
    title: "Берпи",
    muscleGroup: "Функциональная выносливость",
    level: "ADVANCED",
    description:
      "Комбинация приседа, упора лежа и прыжка. Держите ритм, но не теряйте качество техники. Отлично подходит для интервальных тренировок.",
    imageUrl: "/images/ex-burpee.jpg",
    videoUrl: "https://www.youtube.com/watch?v=TU8QYVW0gDU",
    tags: ["hiit", "кардио", "взрывная сила"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-glute-bridge",
    title: "Ягодичный мост",
    muscleGroup: "Ягодицы и задняя поверхность бедра",
    level: "BEGINNER",
    description:
      "Поднимайте таз вверх за счет работы ягодиц, не прогибаясь в пояснице. В верхней точке удерживайте 1-2 секунды.",
    imageUrl: "/images/ex-squat.jpg",
    videoUrl: "https://www.youtube.com/watch?v=wPM8icPu6H8",
    tags: ["ягодицы", "дом", "стабилизация"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-shoulder-press",
    title: "Жим гантелей сидя",
    muscleGroup: "Плечи",
    level: "INTERMEDIATE",
    description:
      "Сядьте устойчиво, пресс напряжен. Выжимайте гантели вверх без рывков, опускайте контролируемо до уровня подбородка.",
    imageUrl: "/images/ex-pushup.jpg",
    videoUrl: "https://www.youtube.com/watch?v=B-aVuyhvLHU",
    tags: ["плечи", "гантели", "сила"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-mountain-climber",
    title: "Скалолаз",
    muscleGroup: "Кор и кардио",
    level: "INTERMEDIATE",
    description:
      "В упоре лежа попеременно подтягивайте колени к груди. Сохраняйте ровную линию корпуса и не поднимайте таз слишком высоко.",
    imageUrl: "/images/ex-plank.jpg",
    videoUrl: "https://www.youtube.com/watch?v=nmwgirgXLYM",
    tags: ["кардио", "кор", "интервалы"],
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
];

router.get("/", async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
    }

    const { search, muscleGroup, level, published, page, limit } = parsed.data;
    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { tags: { hasSome: [search] } },
            ],
          }
        : {}),
      ...(muscleGroup ? { muscleGroup: { equals: muscleGroup, mode: "insensitive" } } : {}),
      ...(level ? { level } : {}),
      ...(published ? { isPublished: published === "true" } : { isPublished: true }),
    };

    const [total, items] = await Promise.all([
      prisma.exercise.count({ where }),
      prisma.exercise.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const noFilters = !search && !muscleGroup && !level && !published;
    if (noFilters && total === 0) {
      return res.json({
        items: demoExercises,
        pagination: {
          page,
          limit,
          total: demoExercises.length,
          pages: 1,
        },
        source: "demo_fallback",
      });
    }

    return res.json({
      items,
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

router.get("/admin/list", authGuard, roleGuard("ADMIN"), async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
    }

    const { search, muscleGroup, level, published, page, limit } = parsed.data;
    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { tags: { hasSome: [search] } },
            ],
          }
        : {}),
      ...(muscleGroup ? { muscleGroup: { equals: muscleGroup, mode: "insensitive" } } : {}),
      ...(level ? { level } : {}),
      ...(published ? { isPublished: published === "true" } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.exercise.count({ where }),
      prisma.exercise.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.json({
      items,
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

router.get("/admin/:id", authGuard, roleGuard("ADMIN"), async (req, res, next) => {
  try {
    const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id } });
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    return res.json({ exercise });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id } });
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    if (!exercise.isPublished) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    return res.json({ exercise });
  } catch (error) {
    return next(error);
  }
});

router.post("/", authGuard, roleGuard("ADMIN"), async (req, res, next) => {
  try {
    const parsed = createExerciseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const exercise = await prisma.exercise.create({
      data: {
        ...parsed.data,
        createdById: req.user.sub,
      },
    });

    return res.status(201).json({ exercise });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", authGuard, roleGuard("ADMIN"), async (req, res, next) => {
  try {
    const parsed = updateExerciseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
    }

    const existing = await prisma.exercise.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    const exercise = await prisma.exercise.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    return res.json({ exercise });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", authGuard, roleGuard("ADMIN"), async (req, res, next) => {
  try {
    const existing = await prisma.exercise.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    await prisma.exercise.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;