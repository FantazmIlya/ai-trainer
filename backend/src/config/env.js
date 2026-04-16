import "dotenv/config";

const requiredVars = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  grokApiKey: process.env.GROK_API_KEY || "",
  grokBaseUrl: process.env.GROK_BASE_URL || "https://api.x.ai/v1",
  grokModel: process.env.GROK_MODEL || "grok-4.20-reasoning",
  aiRateLimitWindowSec: Number(process.env.AI_RATE_LIMIT_WINDOW_SEC || 60),
  aiRateLimitMaxRequests: Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS || 20),
  yookassaShopId: process.env.YOOKASSA_SHOP_ID || "",
  yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || "",
  yookassaApiBaseUrl: process.env.YOOKASSA_API_BASE_URL || "https://api.yookassa.ru/v3",
  yookassaReturnUrl: process.env.YOOKASSA_RETURN_URL || "http://localhost:5173/billing/success",
  workoutApiKeySalt: process.env.WORKOUT_API_KEY_SALT || process.env.JWT_ACCESS_SECRET,
};