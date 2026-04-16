import "dotenv/config";

function toBool(value, fallback = false) {
  if (value == null || value === "") {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

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
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  openrouterModel: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free",
  openrouterSiteUrl: process.env.OPENROUTER_SITE_URL || "",
  openrouterSiteName: process.env.OPENROUTER_SITE_NAME || "",
  aiForceLocal: toBool(process.env.AI_FORCE_LOCAL, false),
  aiRateLimitWindowSec: Number(process.env.AI_RATE_LIMIT_WINDOW_SEC || 60),
  aiRateLimitMaxRequests: Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS || 20),
  yookassaShopId: process.env.YOOKASSA_SHOP_ID || "",
  yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || "",
  yookassaApiBaseUrl: process.env.YOOKASSA_API_BASE_URL || "https://api.yookassa.ru/v3",
  yookassaReturnUrl: process.env.YOOKASSA_RETURN_URL || "http://localhost:5173/billing/success",
  workoutApiKeySalt: process.env.WORKOUT_API_KEY_SALT || process.env.JWT_ACCESS_SECRET,
};