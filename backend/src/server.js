import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import exercisesRoutes from "./routes/exercises.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import workoutsRoutes from "./routes/workouts.routes.js";
import adminUsersRoutes from "./routes/admin.users.routes.js";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ai-trainer-api", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/exercises", exercisesRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/workouts", workoutsRoutes);
app.use("/api/admin", adminUsersRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

async function bootstrap() {
  try {
    await prisma.$connect();
    app.listen(env.port, () => {
      console.log(`API started on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();