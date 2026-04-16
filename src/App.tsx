import { AnimatePresence, motion } from "framer-motion";
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";

type Role = "USER" | "ADMIN";

type User = {
  id: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "BLOCKED";
  hasPremiumAccess?: boolean;
  activeSubscription?: {
    id: string;
    expiresAt: string;
    plan?: {
      title: string;
      code: string;
    };
  } | null;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

type Exercise = {
  id: string;
  title: string;
  muscleGroup: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  description: string;
  imageUrl: string | null;
  videoUrl: string | null;
  tags: string[];
  isPublished: boolean;
};

type Plan = {
  id: string;
  code: string;
  title: string;
  amount: number;
  currency: string;
  intervalDays: number;
  isActive?: boolean;
};

type PaymentItem = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  user?: { email: string };
  plan?: { code: string; title: string } | null;
};

type AdminUserItem = {
  id: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "BLOCKED";
  createdAt: string;
  _count?: {
    payments: number;
    subscriptions: number;
  };
};

type Workout = {
  id: string;
  source: "MANUAL" | "FILE_IMPORT" | "API";
  title: string;
  type: string;
  startedAt: string;
  distanceKm: number | null;
  durationMin: number | null;
  calories: number | null;
  notes: string | null;
};

type WorkoutIntegrationMeta = {
  id: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
};

type WorkoutProvider = {
  id: string;
  name: string;
  mode: "FILE_EXPORT" | "API_PUSH";
  summary: string;
  formats: string[];
  imageUrl?: string;
};

type ApiError = {
  message: string;
};

type AiStatus = {
  mode: "openrouter" | "local";
  model: string;
  reasonCode?: "FORCE_LOCAL" | "NO_API_KEY" | null;
  hint?: string | null;
  hasApiKey?: boolean;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const STORAGE_KEY = "ai_trainer_session_v1";
const FALLBACK_EXERCISES: Exercise[] = [
  {
    id: "local-squat",
    title: "Приседания с собственным весом",
    muscleGroup: "Ноги и ягодицы",
    level: "BEGINNER",
    description:
      "Стопы чуть шире плеч, корпус ровный. Опускайтесь до параллели бедер с полом, колени направлены в сторону носков. 3 подхода по 12-15 повторений.",
    imageUrl: "/images/ex-squat.jpg",
    videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U",
    tags: ["ноги", "ягодицы", "база"],
    isPublished: true,
  },
  {
    id: "local-pushup",
    title: "Отжимания от пола",
    muscleGroup: "Грудь, плечи, трицепс",
    level: "BEGINNER",
    description:
      "Ладони под плечами, тело в одной линии. Опускайтесь контролируемо, выдыхайте на усилии. Начните с 3 подходов по 8-12 повторений.",
    imageUrl: "/images/ex-pushup.jpg",
    videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
    tags: ["верх тела", "дом"],
    isPublished: true,
  },
  {
    id: "local-plank",
    title: "Планка на предплечьях",
    muscleGroup: "Кор и стабилизаторы",
    level: "BEGINNER",
    description:
      "Локти под плечами, пресс напряжен, поясница нейтральная. Начните с 20-40 секунд, 3 подхода, постепенно увеличивая время.",
    imageUrl: "/images/ex-plank.jpg",
    videoUrl: "https://www.youtube.com/watch?v=pSHjTRCQxIw",
    tags: ["кор", "пресс", "стабилизация"],
    isPublished: true,
  },
  {
    id: "local-lunge",
    title: "Выпады вперед",
    muscleGroup: "Ноги и ягодицы",
    level: "BEGINNER",
    description:
      "Держите корпус ровным, шагайте вперед и опускайтесь, пока оба колена не будут около 90 градусов. 3 подхода по 10-12 повторений на каждую ногу.",
    imageUrl: "/images/ex-lunge.jpg",
    videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
    tags: ["ноги", "баланс", "дом"],
    isPublished: true,
  },
  {
    id: "local-row",
    title: "Тяга к поясу в тренажере",
    muscleGroup: "Спина и бицепс",
    level: "INTERMEDIATE",
    description:
      "Сохраняйте нейтральную спину, тяните рукоять к нижним ребрам и контролируйте негативную фазу. 3-4 подхода по 8-12 повторений.",
    imageUrl: "/images/ex-row.jpg",
    videoUrl: "https://www.youtube.com/watch?v=GZbfZ033f74",
    tags: ["спина", "тяга", "зал"],
    isPublished: true,
  },
  {
    id: "local-deadbug",
    title: "Dead Bug",
    muscleGroup: "Кор и поясница",
    level: "BEGINNER",
    description:
      "Лежа на спине, прижмите поясницу к полу. Попеременно выпрямляйте противоположные руку и ногу, не теряя контроль корпуса.",
    imageUrl: "/images/ex-deadbug.jpg",
    videoUrl: "https://www.youtube.com/watch?v=g_BYB0R-4Ws",
    tags: ["кор", "осанка", "реабилитация"],
    isPublished: true,
  },
  {
    id: "local-burpee",
    title: "Берпи",
    muscleGroup: "Функциональная выносливость",
    level: "ADVANCED",
    description:
      "Из стойки опуститесь в упор лежа, сделайте отжимание по желанию и вернитесь прыжком вверх. Начните с 3 раундов по 8-10 повторений.",
    imageUrl: "/images/ex-burpee.jpg",
    videoUrl: "https://www.youtube.com/watch?v=TU8QYVW0gDU",
    tags: ["hiit", "кардио", "взрывная сила"],
    isPublished: true,
  },
  {
    id: "local-glute-bridge",
    title: "Ягодичный мост",
    muscleGroup: "Ягодицы и задняя поверхность бедра",
    level: "BEGINNER",
    description:
      "Лягте на спину, стопы ближе к тазу. Поднимайте таз, сжимая ягодицы, и удерживайте верхнюю точку 1-2 секунды.",
    imageUrl: "/images/ex-squat.jpg",
    videoUrl: "https://www.youtube.com/watch?v=wPM8icPu6H8",
    tags: ["ягодицы", "дом", "стабилизация"],
    isPublished: true,
  },
  {
    id: "local-shoulder-press",
    title: "Жим гантелей сидя",
    muscleGroup: "Плечи",
    level: "INTERMEDIATE",
    description:
      "Сидя на скамье держите корпус стабильным, выжимайте гантели вверх без прогиба в пояснице. 3 подхода по 8-10 повторений.",
    imageUrl: "/images/ex-pushup.jpg",
    videoUrl: "https://www.youtube.com/watch?v=B-aVuyhvLHU",
    tags: ["плечи", "гантели", "сила"],
    isPublished: true,
  },
  {
    id: "local-mountain-climber",
    title: "Скалолаз",
    muscleGroup: "Кор и кардио",
    level: "INTERMEDIATE",
    description:
      "В упоре лежа подтягивайте колени к груди в умеренном темпе, сохраняя ровную линию корпуса. 4 интервала по 30-45 секунд.",
    imageUrl: "/images/ex-plank.jpg",
    videoUrl: "https://www.youtube.com/watch?v=nmwgirgXLYM",
    tags: ["кардио", "кор", "интервалы"],
    isPublished: true,
  },
];

const FALLBACK_WORKOUTS: Workout[] = [
  {
    id: "demo-workout-1",
    source: "MANUAL",
    title: "Легкий бег",
    type: "Бег",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    distanceKm: 4.2,
    durationMin: 31,
    calories: 320,
    notes: "Ровный темп без ускорений",
  },
  {
    id: "demo-workout-2",
    source: "FILE_IMPORT",
    title: "Домашняя силовая",
    type: "Силовая",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    distanceKm: null,
    durationMin: 42,
    calories: 280,
    notes: "Присед, отжимания, планка",
  },
  {
    id: "demo-workout-3",
    source: "MANUAL",
    title: "Интервальный велотренажер",
    type: "Вело",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    distanceKm: 11.4,
    durationMin: 36,
    calories: 350,
    notes: "6 интервалов 2/2, пульс 75-85% от max",
  },
  {
    id: "demo-workout-4",
    source: "API",
    title: "Ходьба на улице",
    type: "Ходьба",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    distanceKm: 5.8,
    durationMin: 59,
    calories: 260,
    notes: "Импортировано с носимого устройства",
  },
  {
    id: "demo-workout-5",
    source: "MANUAL",
    title: "Силовая верх тела",
    type: "Силовая",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    distanceKm: null,
    durationMin: 48,
    calories: 300,
    notes: "Тяга, жим, плечи, кор",
  },
  {
    id: "demo-workout-6",
    source: "FILE_IMPORT",
    title: "Легкий кросс",
    type: "Бег",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
    distanceKm: 6.1,
    durationMin: 43,
    calories: 410,
    notes: "Ровный пульс, разговорный темп",
  },
];

const FALLBACK_WEARABLE_PROVIDERS: WorkoutProvider[] = [
  {
    id: "garmin",
    name: "Garmin Connect",
    mode: "FILE_EXPORT",
    summary: "Экспортируйте тренировку в GPX/TCX и загружайте в кабинет.",
    formats: ["gpx", "tcx"],
    imageUrl: "/images/wearable-garmin.jpg",
  },
  {
    id: "polar",
    name: "Polar Flow",
    mode: "FILE_EXPORT",
    summary: "Поддерживается экспорт GPX/CSV и импорт через форму файла.",
    formats: ["gpx", "csv"],
    imageUrl: "/images/wearable-polar.jpg",
  },
  {
    id: "suunto",
    name: "Suunto",
    mode: "FILE_EXPORT",
    summary: "Выгружайте активности из приложения в GPX и загружайте в кабинет.",
    formats: ["gpx"],
    imageUrl: "/images/wearable-suunto.svg",
  },
  {
    id: "apple_health",
    name: "Apple Watch / Health",
    mode: "FILE_EXPORT",
    summary: "Экспортируйте активности из Apple Health в CSV/JSON и импортируйте их в кабинет.",
    formats: ["csv", "json"],
    imageUrl: "/images/wearable-apple.svg",
  },
  {
    id: "huawei_health",
    name: "Huawei Health",
    mode: "FILE_EXPORT",
    summary: "Экспортируйте тренировки из Huawei Health в CSV/GPX и загружайте через импорт.",
    formats: ["csv", "gpx"],
    imageUrl: "/images/wearable-huawei.svg",
  },
  {
    id: "xiaomi_mi_fitness",
    name: "Xiaomi Mi Fitness",
    mode: "FILE_EXPORT",
    summary: "Поддерживается импорт тренировок из Xiaomi Mi Fitness в CSV/GPX формате.",
    formats: ["csv", "gpx"],
    imageUrl: "/images/wearable-xiaomi.svg",
  },
  {
    id: "universal_api",
    name: "Универсальный API",
    mode: "API_PUSH",
    summary: "Любое устройство или приложение может отправлять данные напрямую через API-ключ.",
    formats: ["json"],
    imageUrl: "/images/wearable-api.svg",
  },
];

const POPULAR_WEARABLES = [
  { name: "Garmin", imageUrl: "/images/wearable-garmin.jpg" },
  { name: "Polar", imageUrl: "/images/wearable-polar.jpg" },
  { name: "Apple Watch", imageUrl: "/images/wearable-apple.svg" },
  { name: "Huawei", imageUrl: "/images/wearable-huawei.svg" },
  { name: "Xiaomi", imageUrl: "/images/wearable-xiaomi.svg" },
  { name: "Suunto", imageUrl: "/images/wearable-suunto.svg" },
];

function formatMoney(kopecks: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(kopecks / 100);
}

function formatDistance(km: number | null) {
  if (!km) {
    return "-";
  }
  return `${km.toFixed(2)} км`;
}

function formatDuration(minutes: number | null) {
  if (!minutes) {
    return "-";
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) {
    return `${h} ч ${m} мин`;
  }
  return `${m} мин`;
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  return JSON.parse(text);
}

function loadSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function isSameUser(a: User, b: User) {
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.role === b.role &&
    a.status === b.status &&
    a.hasPremiumAccess === b.hasPremiumAccess &&
    JSON.stringify(a.activeSubscription || null) === JSON.stringify(b.activeSubscription || null)
  );
}

function AppShell() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const accessToken = session?.accessToken || null;
  const refreshToken = session?.refreshToken || null;

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignored on purpose: local logout must work even if backend is unavailable.
      }
    }
    setSession(null);
    saveSession(null);
    navigate("/auth", { replace: true });
  }, [navigate, refreshToken]);

  const apiFetch = useCallback(
    async <T,>(path: string, init?: RequestInit, auth = false): Promise<T> => {
      const headers = new Headers(init?.headers || {});
      if (!headers.has("Content-Type") && init?.body) {
        headers.set("Content-Type", "application/json");
      }

      const execute = async (token: string | null) => {
        const requestHeaders = new Headers(headers);
        if (auth && token) {
          requestHeaders.set("Authorization", `Bearer ${token}`);
        }

        return fetch(`${API_BASE}${path}`, {
          ...init,
          headers: requestHeaders,
        });
      };

      let response = await execute(accessToken);

      if (response.status === 401 && auth && refreshToken) {
        const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshPayload = (await parseResponse(refreshResponse)) as { accessToken: string };
          setSession((prev) => {
            if (!prev) {
              return prev;
            }
            const nextSession = { ...prev, accessToken: refreshPayload.accessToken };
            saveSession(nextSession);
            return nextSession;
          });
          response = await execute(refreshPayload.accessToken);
        } else {
          setSession(null);
          saveSession(null);
          throw new Error("Сессия истекла. Войдите снова.");
        }
      }

      const payload = await parseResponse(response);
      if (!response.ok) {
        const errorPayload = payload as ApiError | null;
        throw new Error(errorPayload?.message || "Request failed");
      }
      return payload as T;
    },
    [accessToken, refreshToken],
  );

  const refreshCurrentUser = useCallback(async () => {
    if (!accessToken) {
      setAuthLoading(false);
      return;
    }

    try {
      const payload = await apiFetch<{ user: User }>("/api/auth/me", undefined, true);
      setSession((prev) => {
        if (!prev) {
          return prev;
        }
        if (isSameUser(prev.user, payload.user)) {
          return prev;
        }
        const nextSession = { ...prev, user: payload.user };
        saveSession(nextSession);
        return nextSession;
      });
    } catch {
      setSession(null);
      saveSession(null);
    } finally {
      setAuthLoading(false);
    }
  }, [accessToken, apiFetch]);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const authApi = useMemo(
    () => ({
      async login(email: string, password: string) {
        const payload = await apiFetch<Session>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email, password }),
          },
          false,
        );
        setSession(payload);
        saveSession(payload);
        return payload;
      },
      async register(email: string, password: string) {
        const payload = await apiFetch<Session>(
          "/api/auth/register",
          {
            method: "POST",
            body: JSON.stringify({ email, password }),
          },
          false,
        );
        setSession(payload);
        saveSession(payload);
        return payload;
      },
      logout,
    }),
    [apiFetch, logout],
  );

  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.16),rgba(9,9,11,0.92)_38%,rgba(9,9,11,1)_75%)] text-zinc-100">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm tracking-[0.16em] uppercase">
          Проверяем сессию...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.14),rgba(9,9,11,0.93)_40%,rgba(9,9,11,1)_75%)] text-zinc-100">
      <header className="sticky top-0 z-20 px-4 py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-3xl border border-white/12 bg-zinc-950/55 px-6 py-4 shadow-[0_10px_36px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <Link to="/" className="text-lg font-semibold tracking-wide text-cyan-300">
            AI Персональный Тренер
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/exercises"
              className={({ isActive }) =>
                isActive
                  ? "rounded-2xl bg-white/12 px-3 py-2 text-white ring-1 ring-white/20"
                  : "rounded-2xl px-3 py-2 text-zinc-400 hover:bg-white/6 hover:text-zinc-200"
              }
            >
              Библиотека
            </NavLink>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                isActive
                  ? "rounded-2xl bg-white/12 px-3 py-2 text-white ring-1 ring-white/20"
                  : "rounded-2xl px-3 py-2 text-zinc-400 hover:bg-white/6 hover:text-zinc-200"
              }
            >
              AI-чат
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive
                  ? "rounded-2xl bg-white/12 px-3 py-2 text-white ring-1 ring-white/20"
                  : "rounded-2xl px-3 py-2 text-zinc-400 hover:bg-white/6 hover:text-zinc-200"
              }
            >
              Кабинет
            </NavLink>
            <NavLink
              to="/billing"
              className={({ isActive }) =>
                isActive
                  ? "rounded-2xl bg-white/12 px-3 py-2 text-white ring-1 ring-white/20"
                  : "rounded-2xl px-3 py-2 text-zinc-400 hover:bg-white/6 hover:text-zinc-200"
              }
            >
              Подписка
            </NavLink>
            {session?.user.role === "ADMIN" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive
                    ? "rounded-2xl bg-white/12 px-3 py-2 text-white ring-1 ring-white/20"
                    : "rounded-2xl px-3 py-2 text-zinc-400 hover:bg-white/6 hover:text-zinc-200"
                }
              >
                Админ
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {session ? (
              <>
                <span className="text-zinc-300">{session.user.email}</span>
                <button
                  onClick={() => void logout()}
                  className="ui-btn ui-btn-ghost ui-btn-compact"
                >
                  Выйти
                </button>
              </>
            ) : (
              <Link to="/auth" className="ui-btn ui-btn-soft ui-btn-compact">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      <AnimatedRoutes
        apiFetch={apiFetch}
        authApi={authApi}
        session={session}
        refreshCurrentUser={refreshCurrentUser}
      />
    </div>
  );
}

function AnimatedRoutes({
  apiFetch,
  authApi,
  session,
  refreshCurrentUser,
}: {
  apiFetch: <T>(path: string, init?: RequestInit, auth?: boolean) => Promise<T>;
  authApi: {
    login: (email: string, password: string) => Promise<Session>;
    register: (email: string, password: string) => Promise<Session>;
    logout: () => Promise<void>;
  };
  session: Session | null;
  refreshCurrentUser: () => Promise<void>;
}) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage session={session} />} />
          <Route path="/auth" element={<AuthPage session={session} authApi={authApi} />} />
          <Route path="/exercises" element={<ExercisesPage apiFetch={apiFetch} />} />
          <Route
            path="/chat"
            element={
              <RequireAuth session={session}>
                <ChatPage apiFetch={apiFetch} />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth session={session}>
                <ProfilePage apiFetch={apiFetch} refreshCurrentUser={refreshCurrentUser} />
              </RequireAuth>
            }
          />
          <Route
            path="/billing"
            element={
              <RequireAuth session={session}>
                <BillingPage apiFetch={apiFetch} />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin session={session}>
                <AdminPage apiFetch={apiFetch} />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function RequireAuth({ session, children }: { session: Session | null; children: ReactNode }) {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function RequireAdmin({ session, children }: { session: Session | null; children: ReactNode }) {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  if (session.user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return children;
}

function Page({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <h1 className="text-3xl font-semibold leading-tight tracking-[-0.015em] text-white md:text-[2.6rem]">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-300/90 md:text-lg">{subtitle}</p>
      <div className="mt-10">{children}</div>
    </main>
  );
}

function HomePage({ session }: { session: Session | null }) {
  return (
    <main className="min-h-[calc(100vh-73px)] w-full overflow-hidden">
      <section className="relative border-b border-white/5 px-6 py-24 md:py-32">
        <img
          src="/images/hero-fitness.jpg"
          alt="Тренировка в современном фитнес-зале"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(5,8,12,0.88)_28%,rgba(5,8,12,0.5)_60%,rgba(5,8,12,0.72)_100%)]" />
        <div className="relative mx-auto w-full max-w-6xl">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm uppercase tracking-[0.2em] text-cyan-300"
          >
            AI Персональный Тренер
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl"
          >
            Тренировки, техника, питание и мотивация в одном интерфейсе
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg text-zinc-100"
          >
            Ведите журнал тренировок, общайтесь с AI-ассистентом, изучайте библиотеку упражнений и
            управляйте подпиской через YooKassa.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link to={session ? "/chat" : "/auth"} className="rounded-2xl bg-cyan-400 px-6 py-3 font-medium text-zinc-950 shadow-[0_10px_26px_rgba(6,182,212,0.24)]">
              {session ? "Перейти в AI-чат" : "Создать аккаунт"}
            </Link>
            <Link to="/exercises" className="rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3 font-medium text-zinc-100">
              Смотреть упражнения
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-300">01</p>
          <h2 className="mt-2 text-xl font-semibold">AI-консультации</h2>
          <p className="mt-2 text-zinc-300">Получайте персональные ответы по тренировкам и питанию в реальном времени.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-300">02</p>
          <h2 className="mt-2 text-xl font-semibold">Библиотека техники</h2>
          <p className="mt-2 text-zinc-300">Изучайте упражнения по группам мышц с описаниями и видео.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-300">03</p>
          <h2 className="mt-2 text-xl font-semibold">Интеграции</h2>
          <p className="mt-2 text-zinc-300">YooKassa для монетизации и универсальный API-импорт тренировочной активности.</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-18">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Популярные носимые устройства</h2>
            <p className="mt-2 text-zinc-300">Подключайте трекеры через импорт файла или API-ключ прямо в кабинете.</p>
          </div>
          <Link to={session ? "/profile" : "/auth"} className="ui-btn ui-btn-ghost">
            {session ? "Открыть подключения" : "Войти для подключения"}
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_WEARABLES.map((device) => (
            <div key={device.name} className="grid grid-cols-[84px_1fr] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <img src={device.imageUrl} alt={device.name} className="h-16 w-full rounded-xl object-cover" loading="lazy" />
              <p className="text-sm font-medium text-zinc-200">{device.name}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function AuthPage({
  session,
  authApi,
}: {
  session: Session | null;
  authApi: {
    login: (email: string, password: string) => Promise<Session>;
    register: (email: string, password: string) => Promise<Session>;
  };
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      navigate("/profile", { replace: true });
    }
  }, [navigate, session]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await authApi.login(email, password);
      } else {
        await authApi.register(email, password);
      }
      navigate("/profile", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="Регистрация и вход"
      subtitle="Создайте аккаунт по email/паролю. После входа откроется личный кабинет и интеграции."
    >
      <section className="max-w-xl rounded-3xl border border-white/12 bg-white/[0.04] p-7 backdrop-blur-sm">
        <div className="mb-5 flex gap-2">
          <button
            onClick={() => setMode("login")}
            className={`ui-tab ${mode === "login" ? "ui-tab-active" : "ui-tab-idle"}`}
          >
            Вход
          </button>
          <button
            onClick={() => setMode("register")}
            className={`ui-tab ${mode === "register" ? "ui-tab-active" : "ui-tab-idle"}`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="ui-input"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-300">Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="ui-input"
              placeholder="Минимум 8 символов"
            />
          </label>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="ui-btn ui-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Отправляем..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>
      </section>
    </Page>
  );
}

function ExercisesPage({ apiFetch }: { apiFetch: <T>(path: string, init?: RequestInit, auth?: boolean) => Promise<T> }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Exercise[]>([]);
  const [isDemoContent, setIsDemoContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("search", query.trim());
      }

      const payload = await apiFetch<{ items: Exercise[] }>(`/api/exercises?${params.toString()}`);
      if (!payload.items.length && !query.trim()) {
        setItems(FALLBACK_EXERCISES);
        setIsDemoContent(true);
      } else {
        setItems(payload.items);
        setIsDemoContent(false);
      }
    } catch (loadError) {
      setItems(FALLBACK_EXERCISES);
      setIsDemoContent(true);
      setError(loadError instanceof Error ? `${loadError.message}. Показан демонстрационный каталог.` : "Не удалось загрузить упражнения");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Page
      title="Библиотека упражнений"
      subtitle="Каталог техники выполнения с описаниями, изображениями и видео."
    >
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
          className="flex flex-wrap gap-3.5"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="ui-input min-w-[280px] flex-1"
            placeholder="Поиск по названию, описанию или тегу"
          />
          <button className="ui-btn ui-btn-soft">Найти</button>
        </form>
      </section>

      {loading && <p className="py-8 text-zinc-300">Загрузка упражнений...</p>}
      {error && <p className="py-8 text-rose-300">{error}</p>}
      {isDemoContent && !error && (
        <p className="mt-5 text-sm text-cyan-200">Сейчас отображается демонстрационный набор упражнений. Добавьте свои упражнения в админ-панели.</p>
      )}

      <div className="mt-6 divide-y divide-white/10">
        <AnimatePresence>
          {items.map((exercise) => (
            <motion.article
              key={exercise.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid gap-5 py-7 md:grid-cols-[1.2fr_1fr]"
            >
              <div>
                <h3 className="text-xl font-semibold text-white">{exercise.title}</h3>
                <p className="mt-1 text-sm text-cyan-300">
                  {exercise.muscleGroup} | {exercise.level}
                </p>
                <p className="mt-3 text-zinc-300">{exercise.description}</p>
                <p className="mt-3 text-sm text-zinc-400">Теги: {exercise.tags.join(", ") || "нет"}</p>
              </div>
              <div className="space-y-3">
                {exercise.imageUrl ? (
                  <img src={exercise.imageUrl} alt={exercise.title} className="h-44 w-full rounded-2xl object-cover" />
                ) : (
                  <div className="grid h-44 place-items-center rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-zinc-500">Нет изображения</div>
                )}
                {exercise.videoUrl && (
                  <a href={exercise.videoUrl} target="_blank" rel="noreferrer" className="inline-block text-sm text-cyan-300 underline">
                    Смотреть видео
                  </a>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </Page>
  );
}

function ChatPage({ apiFetch }: { apiFetch: <T>(path: string, init?: RequestInit, auth?: boolean) => Promise<T> }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AiStatus>({ mode: "local", model: "local-fallback-coach", reasonCode: "NO_API_KEY" });
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        "Привет. Я AI-тренер. Спроси про программу тренировок, технику, питание или мотивацию. Если есть травмы, скажи о них заранее.",
    },
  ]);

  const buildOfflineReply = useCallback((userText: string) => {
    const normalized = userText.toLowerCase();
    if (normalized.includes("пит") || normalized.includes("еда")) {
      return "Быстрый план питания: белок в каждом приеме пищи, 400-600 г овощей в день, контроль воды, и дефицит 10-15% при похудении.";
    }
    if (normalized.includes("техник") || normalized.includes("присед") || normalized.includes("тяга")) {
      return "По технике: нейтральная спина, контроль амплитуды, выдох на усилии, без рывков. Напишите упражнение, и я дам пошаговый чек-лист.";
    }
    return "Сделаем базовый старт: 3 тренировки в неделю, 5-6 упражнений на сессию, 3 подхода по 8-12 повторений и постепенная прогрессия нагрузки каждую неделю.";
  }, []);

  const setupHint = useMemo(() => {
    if (status.mode === "openrouter") {
      return null;
    }
    if (status.reasonCode === "FORCE_LOCAL") {
      return "Сейчас включен принудительный локальный режим. Поставьте AI_FORCE_LOCAL=false и перезапустите backend.";
    }
    if (status.reasonCode === "NO_API_KEY") {
      return "Не найден OPENROUTER_API_KEY в backend/.env. Добавьте ключ и перезапустите backend через PM2.";
    }
    return "Сейчас ответы идут через встроенного тренера. Это рабочий резервный режим.";
  }, [status.mode, status.reasonCode]);

  useEffect(() => {
    let canceled = false;

    const loadStatus = async () => {
      try {
        const payload = await apiFetch<AiStatus>("/api/ai/status", undefined, true);
        if (!canceled) {
          setStatus(payload);
        }
      } catch {
        if (!canceled) {
          setStatus({ mode: "local", model: "local-fallback-coach" });
        }
      }
    };

    void loadStatus();
    return () => {
      canceled = true;
    };
  }, [apiFetch]);

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const userMessage = { role: "user" as const, content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const payload = await apiFetch<{ reply: string; providerStatus?: string; model?: string }>(
        "/api/ai/chat",
        {
          method: "POST",
          body: JSON.stringify({
            messages: nextMessages.map((item) => ({ role: item.role, content: item.content })),
            temperature: 0.6,
            maxTokens: 500,
          }),
        },
        true,
      );

      setMessages((previous) => [...previous, { role: "assistant", content: payload.reply }]);
      if (payload.model?.includes("local-fallback") || payload.providerStatus) {
        setStatus((previous) => ({ ...previous, mode: "local", model: "local-fallback-coach" }));
      }
    } catch (_sendError) {
      setError("Сейчас отвечаю в режиме встроенного тренера. Можно продолжать диалог.");
      setStatus({ mode: "local", model: "local-fallback-coach" });
      setMessages((previous) => [...previous, { role: "assistant", content: buildOfflineReply(userMessage.content) }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Page title="AI-чат" subtitle="Диалог с ассистентом через OpenRouter (бесплатные модели) и безопасный backend-прокси.">
      <section className="rounded-3xl border border-white/12 bg-white/[0.04] p-5 md:p-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300">
          <span className={`h-2 w-2 rounded-full ${status.mode === "openrouter" ? "bg-emerald-300" : "bg-amber-300"}`} />
          {status.mode === "openrouter" ? "AI режим: OpenRouter" : "AI режим: встроенный тренер"}
        </div>

        {setupHint && (
          <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
            <p>{setupHint}</p>
            <p className="mt-1 text-xs text-amber-100/80">Модель: {status.model}</p>
          </div>
        )}

        <div className="max-h-[50vh] space-y-3 overflow-y-auto border-b border-white/10 pb-5">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={`${message.role}-${index}`}
                initial={{ opacity: 0, x: message.role === "user" ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto bg-cyan-400/20 text-cyan-100"
                    : "mr-auto bg-white/10 text-zinc-100"
                }`}
              >
                {message.content}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <form onSubmit={send} className="mt-4 flex gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="ui-input flex-1"
            placeholder="Например: составь план тренировок на 3 дня для новичка"
          />
          <button disabled={sending} className="ui-btn ui-btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            {sending ? "Отправка..." : "Отправить"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>
    </Page>
  );
}

function ProfilePage({
  apiFetch,
  refreshCurrentUser,
}: {
  apiFetch: <T>(path: string, init?: RequestInit, auth?: boolean) => Promise<T>;
  refreshCurrentUser: () => Promise<void>;
}) {
  const [manualForm, setManualForm] = useState({
    title: "",
    type: "Бег",
    startedAt: new Date().toISOString().slice(0, 16),
    distanceKm: "",
    durationMin: "",
    calories: "",
    notes: "",
  });
  const [profile, setProfile] = useState<User | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [integration, setIntegration] = useState<{ endpoint: string; apiKey: WorkoutIntegrationMeta | null } | null>(null);
  const [providers, setProviders] = useState<WorkoutProvider[]>(FALLBACK_WEARABLE_PROVIDERS);
  const [isDemoWorkouts, setIsDemoWorkouts] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("base-3x");
  const [liveWorkout, setLiveWorkout] = useState<{ templateId: string; startedAtMs: number; stepIndex: number } | null>(null);
  const [liveNow, setLiveNow] = useState(Date.now());

  const workoutTemplates = useMemo(
    () => [
      {
        id: "base-3x",
        title: "Базовая Full Body",
        type: "Силовая",
        targetDuration: 45,
        imageUrl: "/images/ex-pushup.jpg",
        steps: ["Разминка 7 минут", "Присед 3x12", "Отжимания 3x10", "Тяга 3x12", "Планка 3x40 сек", "Заминка 5 минут"],
      },
      {
        id: "fat-loss-hiit",
        title: "HIIT для жиросжигания",
        type: "HIIT",
        targetDuration: 26,
        imageUrl: "/images/ex-burpee.jpg",
        steps: ["Разминка 5 минут", "Берпи 30/30 x 6", "Скалолаз 30/30 x 6", "Выпады 12/12 x 3", "Планка 3x30 сек", "Заминка 4 минуты"],
      },
      {
        id: "run-endurance",
        title: "Выносливость бег",
        type: "Бег",
        targetDuration: 40,
        imageUrl: "/images/ex-plank.jpg",
        steps: ["Суставная разминка 5 минут", "Легкий бег 10 минут", "Темповой отрезок 20 минут", "Ходьба 5 минут", "Мобилизация 3 минуты"],
      },
    ],
    [],
  );

  const selectedTemplate = workoutTemplates.find((template) => template.id === selectedTemplateId) || workoutTemplates[0];
  const activeTemplate = liveWorkout
    ? workoutTemplates.find((template) => template.id === liveWorkout.templateId) || workoutTemplates[0]
    : null;
  const elapsedMin = liveWorkout ? Math.max(1, Math.round((liveNow - liveWorkout.startedAtMs) / 60000)) : 0;
  const workoutsInWeek = useMemo(
    () => workouts.filter((item) => Date.now() - new Date(item.startedAt).getTime() <= 1000 * 60 * 60 * 24 * 7).length,
    [workouts],
  );
  const weekDuration = useMemo(() => workouts.reduce((sum, item) => sum + (item.durationMin || 0), 0), [workouts]);
  const weekDistance = useMemo(() => workouts.reduce((sum, item) => sum + (item.distanceKm || 0), 0), [workouts]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const [me, workoutsPayload, integrationPayload, providersPayload] = await Promise.all([
        apiFetch<{ user: User }>("/api/auth/me", undefined, true),
        apiFetch<{ items: Workout[] }>("/api/workouts", undefined, true),
        apiFetch<{ endpoint: string; apiKey: WorkoutIntegrationMeta | null }>("/api/workouts/integration/me", undefined, true),
        apiFetch<{ providers: WorkoutProvider[] }>("/api/workouts/integration/providers", undefined, true),
      ]);
      setProfile(me.user);
      if (workoutsPayload.items.length) {
        setWorkouts(workoutsPayload.items);
        setIsDemoWorkouts(false);
      } else {
        setWorkouts(FALLBACK_WORKOUTS);
        setIsDemoWorkouts(true);
      }
      setIntegration(integrationPayload);
      setProviders(providersPayload.providers.length ? providersPayload.providers : FALLBACK_WEARABLE_PROVIDERS);
      await refreshCurrentUser();
    } catch (loadError) {
      setWorkouts(FALLBACK_WORKOUTS);
      setIsDemoWorkouts(true);
      setProviders(FALLBACK_WEARABLE_PROVIDERS);
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить кабинет");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, refreshCurrentUser]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!liveWorkout) {
      return undefined;
    }
    const timer = window.setInterval(() => setLiveNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, [liveWorkout]);

  const createManualWorkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(
        "/api/workouts/manual",
        {
          method: "POST",
          body: JSON.stringify({
            title: manualForm.title,
            type: manualForm.type,
            startedAt: new Date(manualForm.startedAt).toISOString(),
            distanceKm: manualForm.distanceKm ? Number(manualForm.distanceKm) : undefined,
            durationMin: manualForm.durationMin ? Number(manualForm.durationMin) : undefined,
            calories: manualForm.calories ? Number(manualForm.calories) : undefined,
            notes: manualForm.notes || undefined,
          }),
        },
        true,
      );

      setManualForm((previous) => ({
        ...previous,
        title: "",
        distanceKm: "",
        durationMin: "",
        calories: "",
        notes: "",
      }));
      setSuccess("Тренировка добавлена.");
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось добавить тренировку");
    }
  };

  const importWorkoutFile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData(event.currentTarget);
      const file = form.get("file");
      if (!(file instanceof File)) {
        setError("Выберите файл CSV, GPX или TCX");
        return;
      }

      const content = await file.text();
      const payload = await apiFetch<{ importedCount: number }>(
        "/api/workouts/import",
        {
          method: "POST",
          body: JSON.stringify({ fileName: file.name, content }),
        },
        true,
      );

      event.currentTarget.reset();
      setSuccess(`Импортировано тренировок: ${payload.importedCount}`);
      await load();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Не удалось импортировать файл");
    }
  };

  const regenerateApiKey = async () => {
    setError(null);
    setSuccess(null);
    try {
      const payload = await apiFetch<{ apiKey: string }>(
        "/api/workouts/integration/regenerate-key",
        { method: "POST" },
        true,
      );

      setNewApiKey(payload.apiKey);
      setSuccess("Новый API-ключ сгенерирован. Сохраните его сейчас.");
      await load();
    } catch (keyError) {
      setError(keyError instanceof Error ? keyError.message : "Не удалось сгенерировать ключ");
    }
  };

  const startWorkout = () => {
    setError(null);
    setSuccess(null);
    setLiveNow(Date.now());
    setLiveWorkout({ templateId: selectedTemplate.id, startedAtMs: Date.now(), stepIndex: 0 });
  };

  const nextWorkoutStep = () => {
    if (!liveWorkout || !activeTemplate) {
      return;
    }
    const next = Math.min(activeTemplate.steps.length - 1, liveWorkout.stepIndex + 1);
    setLiveWorkout({ ...liveWorkout, stepIndex: next });
  };

  const finishWorkoutAndSave = async () => {
    if (!liveWorkout || !activeTemplate) {
      return;
    }

    try {
      await apiFetch(
        "/api/workouts/manual",
        {
          method: "POST",
          body: JSON.stringify({
            title: `${activeTemplate.title} (выполнено)`,
            type: activeTemplate.type,
            startedAt: new Date(liveWorkout.startedAtMs).toISOString(),
            durationMin: Math.max(activeTemplate.targetDuration, elapsedMin),
            notes: `Завершено по шаблону. Шагов: ${activeTemplate.steps.length}`,
          }),
        },
        true,
      );

      setLiveWorkout(null);
      setSuccess("Тренировка завершена и записана в журнал.");
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось сохранить тренировку");
    }
  };

  const stopWorkoutWithoutSaving = () => {
    setLiveWorkout(null);
    setSuccess("Сессия остановлена. Можно начать заново в любой момент.");
  };

  return (
    <Page title="Личный кабинет" subtitle="Планируйте тренировку, выполняйте по шагам и фиксируйте результат без перегруженного интерфейса.">
      {loading && <p className="text-zinc-300">Загрузка данных...</p>}
      {error && <p className="mb-5 text-rose-300">{error}</p>}
      {success && <p className="mb-5 text-emerald-300">{success}</p>}

      {profile && (
        <section className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Профиль</p>
              <p className="mt-2 text-sm text-zinc-200">{profile.email}</p>
              <p className="mt-1 text-xs text-zinc-400">Премиум: {profile.hasPremiumAccess ? "Активен" : "Не активен"}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Тренировок за 7 дней</p>
              <p className="mt-2 text-2xl font-semibold text-white">{workoutsInWeek}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Общее время</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatDuration(weekDuration)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Общая дистанция</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatDistance(weekDistance)}</p>
            </div>
          </div>

          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Шаг 1. Выполнение тренировки</p>
              <h2 className="mt-2 text-xl font-semibold">План на сегодня</h2>
              <p className="mt-2 text-sm text-zinc-400">Выберите шаблон, нажмите старт и ведите тренировку по шагам.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
                <img src={selectedTemplate.imageUrl} alt={selectedTemplate.title} className="h-36 w-full rounded-2xl object-cover" />
                <div>
                  <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} className="ui-select">
                    {workoutTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.title} ({template.targetDuration} мин)
                      </option>
                    ))}
                  </select>
                  <ol className="mt-3 space-y-1.5 text-sm text-zinc-300">
                    {selectedTemplate.steps.map((step, index) => (
                      <li key={step} className="rounded-xl bg-white/[0.03] px-3 py-2">
                        {index + 1}. {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              {!liveWorkout && (
                <button onClick={startWorkout} className="ui-btn ui-btn-primary mt-4">
                  Начать тренировку
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Текущая сессия</p>
              {!liveWorkout || !activeTemplate ? (
                <p className="mt-2 text-sm text-zinc-200">Сессия не запущена. После старта здесь появится текущий шаг и таймер.</p>
              ) : (
                <>
                  <h3 className="mt-2 text-lg font-semibold text-white">{activeTemplate.title}</h3>
                  <p className="mt-1 text-sm text-cyan-100">Прошло: {formatDuration(elapsedMin)}</p>
                  <p className="mt-4 text-sm text-zinc-200">
                    Шаг {liveWorkout.stepIndex + 1} из {activeTemplate.steps.length}: {activeTemplate.steps[liveWorkout.stepIndex]}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={nextWorkoutStep} className="ui-btn ui-btn-soft" disabled={liveWorkout.stepIndex >= activeTemplate.steps.length - 1}>
                      Следующий шаг
                    </button>
                    <button onClick={() => void finishWorkoutAndSave()} className="ui-btn ui-btn-primary">
                      Завершить и сохранить
                    </button>
                    <button onClick={stopWorkoutWithoutSaving} className="ui-btn ui-btn-ghost">
                      Остановить
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Шаг 2. Фиксация результата</p>
            <h2 className="mt-2 text-xl font-semibold">Добавление тренировок</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setShowQuickAdd((value) => !value)} className={`ui-btn ${showQuickAdd ? "ui-btn-soft" : "ui-btn-ghost"}`}>
                Быстро добавить вручную
              </button>
              <button onClick={() => setShowImport((value) => !value)} className={`ui-btn ${showImport ? "ui-btn-soft" : "ui-btn-ghost"}`}>
                Импорт файла
              </button>
              <button onClick={() => setShowDevices((value) => !value)} className={`ui-btn ${showDevices ? "ui-btn-soft" : "ui-btn-ghost"}`}>
                Подключить устройство
              </button>
            </div>

            {showQuickAdd && (
              <form onSubmit={createManualWorkout} className="mt-5 grid gap-3 md:grid-cols-2">
                <input className="ui-input" placeholder="Название" value={manualForm.title} onChange={(event) => setManualForm((previous) => ({ ...previous, title: event.target.value }))} required />
                <input className="ui-input" placeholder="Тип (бег, вело, силовая)" value={manualForm.type} onChange={(event) => setManualForm((previous) => ({ ...previous, type: event.target.value }))} required />
                <input className="ui-input" type="datetime-local" value={manualForm.startedAt} onChange={(event) => setManualForm((previous) => ({ ...previous, startedAt: event.target.value }))} required />
                <input className="ui-input" type="number" min="0" step="1" placeholder="Длительность, мин" value={manualForm.durationMin} onChange={(event) => setManualForm((previous) => ({ ...previous, durationMin: event.target.value }))} />
                <input className="ui-input" type="number" min="0" step="0.01" placeholder="Дистанция, км" value={manualForm.distanceKm} onChange={(event) => setManualForm((previous) => ({ ...previous, distanceKm: event.target.value }))} />
                <input className="ui-input" type="number" min="0" step="1" placeholder="Калории" value={manualForm.calories} onChange={(event) => setManualForm((previous) => ({ ...previous, calories: event.target.value }))} />
                <textarea className="ui-textarea md:col-span-2" rows={3} placeholder="Комментарий" value={manualForm.notes} onChange={(event) => setManualForm((previous) => ({ ...previous, notes: event.target.value }))} />
                <button className="ui-btn ui-btn-primary md:col-span-2">Сохранить тренировку</button>
              </form>
            )}

            {showImport && (
              <form onSubmit={importWorkoutFile} className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm text-zinc-300">Поддерживаются форматы CSV, GPX и TCX.</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <input name="file" type="file" accept=".csv,.gpx,.tcx" className="ui-input max-w-xs" required />
                  <button className="ui-btn ui-btn-soft">Импортировать файл</button>
                </div>
              </form>
            )}

            {showDevices && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm text-zinc-300">Выберите устройство и используйте один из способов: импорт файла или API-ключ.</p>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {providers.map((provider) => (
                    <div key={provider.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[88px_1fr] sm:items-center">
                      <img src={provider.imageUrl || "/images/hero-fitness.jpg"} alt={provider.name} className="h-20 w-full rounded-xl object-cover" loading="lazy" />
                      <div>
                        <p className="font-medium text-zinc-100">{provider.name}</p>
                        <p className="mt-1 text-xs text-zinc-400">{provider.summary}</p>
                        <p className="mt-1 text-xs text-cyan-300">{provider.mode === "API_PUSH" ? "API push" : `Файлы: ${provider.formats.join(", ")}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-zinc-400">Endpoint: <span className="text-zinc-200">{API_BASE}{integration?.endpoint || "/api/workouts/integration/push/{API_KEY}"}</span></p>
                <p className="mt-1 text-sm text-zinc-400">Активный ключ: <span className="text-zinc-200">{integration?.apiKey?.keyPreview || "не создан"}</span></p>
                {integration?.apiKey?.lastUsedAt && (
                  <p className="mt-1 text-xs text-zinc-500">Последнее использование: {new Date(integration.apiKey.lastUsedAt).toLocaleString("ru-RU")}</p>
                )}
                <button onClick={() => void regenerateApiKey()} className="ui-btn ui-btn-ghost mt-3">Сгенерировать новый API-ключ</button>
                {newApiKey && (
                  <div className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                    Сохраните ключ сейчас: <span className="font-mono">{newApiKey}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Шаг 3. Прогресс</p>
            <h2 className="mt-2 text-xl font-semibold">История тренировок</h2>
            {isDemoWorkouts && <p className="mt-2 text-sm text-cyan-200">Пока у вас нет собственных тренировок, поэтому показаны демонстрационные примеры.</p>}
            <div className="mt-4 hidden grid-cols-5 border-b border-white/10 pb-2 text-xs uppercase tracking-[0.12em] text-zinc-500 md:grid">
              <p>Название</p>
              <p>Тип</p>
              <p>Дистанция</p>
              <p>Длительность</p>
              <p>Дата / источник</p>
            </div>
            <div className="divide-y divide-white/10">
              {workouts.map((workout) => (
                <div key={workout.id} className="grid gap-2 py-3 text-sm md:grid-cols-5">
                  <p className="text-zinc-100">{workout.title}</p>
                  <p className="text-zinc-300">{workout.type}</p>
                  <p className="text-zinc-300">{formatDistance(workout.distanceKm)}</p>
                  <p className="text-zinc-300">{formatDuration(workout.durationMin)}</p>
                  <p className="text-zinc-500">{new Date(workout.startedAt).toLocaleDateString("ru-RU")} | {workout.source}</p>
                </div>
              ))}
              {!workouts.length && <p className="py-4 text-sm text-zinc-500">Пока нет тренировок. Добавьте первую вручную или импортом.</p>}
            </div>
          </div>
        </section>
      )}
    </Page>
  );
}

function BillingPage({ apiFetch }: { apiFetch: <T>(path: string, init?: RequestInit, auth?: boolean) => Promise<T> }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<{
    hasPremiumAccess: boolean;
    activeSubscription: { expiresAt: string; plan: { title: string } } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [plansPayload, subPayload] = await Promise.all([
        apiFetch<{ plans: Plan[] }>("/api/payments/plans"),
        apiFetch<{
          hasPremiumAccess: boolean;
          activeSubscription: { expiresAt: string; plan: { title: string } } | null;
        }>("/api/payments/subscription/me", undefined, true),
      ]);

      setPlans(plansPayload.plans);
      setSubscription(subPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить подписку");
    }
  }, [apiFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const pay = async (planCode: string) => {
    setError(null);
    try {
      const payload = await apiFetch<{ confirmationUrl: string | null }>(
        "/api/payments/yookassa/create",
        {
          method: "POST",
          body: JSON.stringify({ planCode }),
        },
        true,
      );

      if (payload.confirmationUrl) {
        window.open(payload.confirmationUrl, "_blank", "noopener,noreferrer");
      }
      await load();
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Не удалось создать платеж");
    }
  };

  return (
    <Page title="Подписка и платежи" subtitle="Оплата премиум-функций через YooKassa.">
      {error && <p className="mb-4 text-rose-300">{error}</p>}

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold">Текущая подписка</h2>
        {!subscription?.hasPremiumAccess ? (
          <p className="mt-2 text-zinc-300">Активной подписки нет.</p>
        ) : (
          <p className="mt-2 text-zinc-300">
            {subscription.activeSubscription?.plan.title} до {new Date(subscription.activeSubscription?.expiresAt || "").toLocaleDateString("ru-RU")}
          </p>
        )}
      </section>

      <section className="mt-6 divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/[0.03] px-5">
        {plans.map((plan) => (
          <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-lg font-semibold text-zinc-100">{plan.title}</p>
              <p className="text-sm text-zinc-400">
                {formatMoney(plan.amount, plan.currency)} / {plan.intervalDays} дней
              </p>
            </div>
            <button onClick={() => void pay(plan.code)} className="ui-btn ui-btn-soft">
              Оплатить
            </button>
          </div>
        ))}
      </section>
    </Page>
  );
}

function AdminPage({ apiFetch }: { apiFetch: <T>(path: string, init?: RequestInit, auth?: boolean) => Promise<T> }) {
  const [tab, setTab] = useState<"exercises" | "plans" | "payments" | "users">("exercises");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersSummary, setUsersSummary] = useState({ ACTIVE: 0, BLOCKED: 0 });
  const [usersFilter, setUsersFilter] = useState<{ search: string; role: "" | Role; status: "" | "ACTIVE" | "BLOCKED" }>({
    search: "",
    role: "",
    status: "",
  });
  const [error, setError] = useState<string | null>(null);

  const [exerciseForm, setExerciseForm] = useState({
    title: "",
    muscleGroup: "",
    level: "BEGINNER",
    description: "",
    imageUrl: "",
    videoUrl: "",
    tags: "",
  });

  const [planForm, setPlanForm] = useState({
    code: "",
    title: "",
    amount: "99000",
    currency: "RUB",
    intervalDays: "30",
  });

  const load = useCallback(async () => {
    setError(null);
    try {
      const usersQuery = new URLSearchParams();
      if (usersFilter.search.trim()) {
        usersQuery.set("search", usersFilter.search.trim());
      }
      if (usersFilter.role) {
        usersQuery.set("role", usersFilter.role);
      }
      if (usersFilter.status) {
        usersQuery.set("status", usersFilter.status);
      }

      const [exercisePayload, plansPayload, paymentsPayload, usersPayload] = await Promise.all([
        apiFetch<{ items: Exercise[] }>("/api/exercises/admin/list", undefined, true),
        apiFetch<{ plans: Plan[] }>("/api/payments/plans"),
        apiFetch<{ items: PaymentItem[] }>("/api/payments/admin/payments", undefined, true),
        apiFetch<{ items: AdminUserItem[]; summary: { ACTIVE: number; BLOCKED: number } }>(
          `/api/admin/users${usersQuery.toString() ? `?${usersQuery.toString()}` : ""}`,
          undefined,
          true,
        ),
      ]);

      setExercises(exercisePayload.items);
      setPlans(plansPayload.plans);
      setPayments(paymentsPayload.items);
      setUsers(usersPayload.items);
      setUsersSummary(usersPayload.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки админ-панели");
    }
  }, [apiFetch, usersFilter.role, usersFilter.search, usersFilter.status]);

  useEffect(() => {
    void load();
  }, [load]);

  const createExercise = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch(
        "/api/exercises",
        {
          method: "POST",
          body: JSON.stringify({
            ...exerciseForm,
            level: exerciseForm.level,
            tags: exerciseForm.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            imageUrl: exerciseForm.imageUrl || null,
            videoUrl: exerciseForm.videoUrl || null,
            isPublished: true,
          }),
        },
        true,
      );

      setExerciseForm({
        title: "",
        muscleGroup: "",
        level: "BEGINNER",
        description: "",
        imageUrl: "",
        videoUrl: "",
        tags: "",
      });
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось создать упражнение");
    }
  };

  const deleteExercise = async (id: string) => {
    setError(null);
    try {
      await apiFetch(`/api/exercises/${id}`, { method: "DELETE" }, true);
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить упражнение");
    }
  };

  const createPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch(
        "/api/payments/admin/plans",
        {
          method: "POST",
          body: JSON.stringify({
            code: planForm.code,
            title: planForm.title,
            amount: Number(planForm.amount),
            currency: planForm.currency,
            intervalDays: Number(planForm.intervalDays),
            isActive: true,
          }),
        },
        true,
      );
      setPlanForm({ code: "", title: "", amount: "99000", currency: "RUB", intervalDays: "30" });
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось создать тариф");
    }
  };

  const updateUserStatus = async (userId: string, status: "ACTIVE" | "BLOCKED") => {
    setError(null);
    try {
      await apiFetch(
        `/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        true,
      );
      await load();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Не удалось обновить статус пользователя");
    }
  };

  const updateUserRole = async (userId: string, role: Role) => {
    setError(null);
    try {
      await apiFetch(
        `/api/admin/users/${userId}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role }),
        },
        true,
      );
      await load();
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "Не удалось обновить роль пользователя");
    }
  };

  return (
    <Page title="Админ-панель" subtitle="Управление пользователями, упражнениями, тарифами и платежами.">
      {error && <p className="mb-5 text-rose-300">{error}</p>}

      <div className="mb-8 flex flex-wrap gap-2 rounded-3xl border border-white/8 bg-white/[0.02] p-2.5">
        <button
          onClick={() => setTab("exercises")}
          className={`ui-tab ${tab === "exercises" ? "ui-tab-active" : "ui-tab-idle"}`}
        >
          Упражнения
        </button>
        <button
          onClick={() => setTab("plans")}
          className={`ui-tab ${tab === "plans" ? "ui-tab-active" : "ui-tab-idle"}`}
        >
          Тарифы
        </button>
        <button
          onClick={() => setTab("payments")}
          className={`ui-tab ${tab === "payments" ? "ui-tab-active" : "ui-tab-idle"}`}
        >
          Платежи
        </button>
        <button
          onClick={() => setTab("users")}
          className={`ui-tab ${tab === "users" ? "ui-tab-active" : "ui-tab-idle"}`}
        >
          Пользователи
        </button>
      </div>

      {tab === "exercises" && (
        <section className="space-y-8">
          <form onSubmit={createExercise} className="grid gap-4 rounded-3xl border border-white/8 bg-white/[0.02] p-6 md:grid-cols-2">
            <input
              value={exerciseForm.title}
              onChange={(event) => setExerciseForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Название"
              className="ui-input"
              required
            />
            <input
              value={exerciseForm.muscleGroup}
              onChange={(event) => setExerciseForm((previous) => ({ ...previous, muscleGroup: event.target.value }))}
              placeholder="Группа мышц"
              className="ui-input"
              required
            />
            <select
              value={exerciseForm.level}
              onChange={(event) => setExerciseForm((previous) => ({ ...previous, level: event.target.value }))}
              className="ui-select"
            >
              <option value="BEGINNER">BEGINNER</option>
              <option value="INTERMEDIATE">INTERMEDIATE</option>
              <option value="ADVANCED">ADVANCED</option>
            </select>
            <input
              value={exerciseForm.tags}
              onChange={(event) => setExerciseForm((previous) => ({ ...previous, tags: event.target.value }))}
              placeholder="Теги через запятую"
              className="ui-input"
            />
            <input
              value={exerciseForm.imageUrl}
              onChange={(event) => setExerciseForm((previous) => ({ ...previous, imageUrl: event.target.value }))}
              placeholder="URL изображения"
              className="ui-input"
            />
            <input
              value={exerciseForm.videoUrl}
              onChange={(event) => setExerciseForm((previous) => ({ ...previous, videoUrl: event.target.value }))}
              placeholder="URL видео"
              className="ui-input"
            />
            <textarea
              value={exerciseForm.description}
              onChange={(event) => setExerciseForm((previous) => ({ ...previous, description: event.target.value }))}
              className="ui-textarea md:col-span-2"
              placeholder="Описание техники выполнения (минимум 20 символов)"
              rows={4}
              required
            />
            <button className="ui-btn ui-btn-soft md:col-span-2">Создать упражнение</button>
          </form>

          <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02]">
            <div className="hidden grid-cols-[2fr_1fr_auto] gap-4 border-b border-white/8 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:grid">
              <span>Упражнение</span>
              <span>Группа мышц</span>
              <span className="text-right">Действия</span>
            </div>
            {exercises.map((exercise) => (
              <div key={exercise.id} className="grid gap-3 border-t border-white/6 px-5 py-4 first:border-t-0 md:grid-cols-[2fr_1fr_auto] md:items-center">
                <div className="space-y-1">
                  <p className="font-medium text-zinc-100">{exercise.title}</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{exercise.level}</p>
                </div>
                <p className="text-sm text-zinc-300">{exercise.muscleGroup}</p>
                <button onClick={() => void deleteExercise(exercise.id)} className="ui-btn ui-btn-ghost ui-btn-compact justify-self-start md:justify-self-end">
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "plans" && (
        <section className="space-y-6">
          <form onSubmit={createPlan} className="grid gap-4 rounded-3xl border border-white/8 bg-white/[0.02] p-6 md:grid-cols-2">
            <input
              value={planForm.code}
              onChange={(event) => setPlanForm((previous) => ({ ...previous, code: event.target.value }))}
              placeholder="Код тарифа (monthly_pro)"
              className="ui-input"
              required
            />
            <input
              value={planForm.title}
              onChange={(event) => setPlanForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Название"
              className="ui-input"
              required
            />
            <input
              value={planForm.amount}
              onChange={(event) => setPlanForm((previous) => ({ ...previous, amount: event.target.value }))}
              placeholder="Цена в копейках"
              className="ui-input"
              required
            />
            <input
              value={planForm.intervalDays}
              onChange={(event) => setPlanForm((previous) => ({ ...previous, intervalDays: event.target.value }))}
              placeholder="Период в днях"
              className="ui-input"
              required
            />
            <button className="ui-btn ui-btn-soft md:col-span-2">Создать тариф</button>
          </form>

          <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02]">
            <div className="hidden grid-cols-[2fr_2fr] gap-4 border-b border-white/8 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:grid">
              <span>Тариф</span>
              <span>Параметры</span>
            </div>
            {plans.map((plan) => (
              <div key={plan.id} className="grid gap-1 border-t border-white/6 px-5 py-4 first:border-t-0 md:grid-cols-[2fr_2fr] md:items-center">
                <p className="font-medium text-zinc-100">{plan.title}</p>
                <p className="text-sm text-zinc-400">
                  {plan.code} | {formatMoney(plan.amount, plan.currency)} / {plan.intervalDays} дней
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "payments" && (
        <section className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02]">
          <div className="hidden grid-cols-5 gap-4 border-b border-white/8 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:grid">
            <span>Пользователь</span>
            <span>Тариф</span>
            <span>Сумма</span>
            <span>Статус</span>
            <span>Дата</span>
          </div>
          {payments.map((payment) => (
            <div key={payment.id} className="grid gap-2 border-t border-white/6 px-5 py-4 text-sm first:border-t-0 md:grid-cols-5">
              <p className="text-zinc-100">{payment.user?.email || "unknown"}</p>
              <p className="text-zinc-300">{payment.plan?.title || "-"}</p>
              <p className="text-zinc-300">{formatMoney(payment.amount, payment.currency)}</p>
              <p className="text-zinc-300">{payment.status}</p>
              <p className="text-zinc-500">{new Date(payment.createdAt).toLocaleString("ru-RU")}</p>
            </div>
          ))}
        </section>
      )}

      {tab === "users" && (
        <section className="space-y-5">
          <div className="grid gap-4 rounded-3xl border border-white/8 bg-white/[0.02] p-6 md:grid-cols-4">
            <input
              value={usersFilter.search}
              onChange={(event) => setUsersFilter((previous) => ({ ...previous, search: event.target.value }))}
              placeholder="Поиск по email или ID"
              className="ui-input md:col-span-2"
            />
            <select
              value={usersFilter.role}
              onChange={(event) => setUsersFilter((previous) => ({ ...previous, role: event.target.value as "" | Role }))}
              className="ui-select"
            >
              <option value="">Все роли</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              value={usersFilter.status}
              onChange={(event) =>
                setUsersFilter((previous) => ({ ...previous, status: event.target.value as "" | "ACTIVE" | "BLOCKED" }))
              }
              className="ui-select"
            >
              <option value="">Все статусы</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>

          <p className="text-sm text-zinc-400">
            Всего активных: {usersSummary.ACTIVE}, заблокированных: {usersSummary.BLOCKED}
          </p>

          <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02]">
            <div className="hidden grid-cols-[2.2fr_1fr_1fr_1fr_1.4fr_1.8fr] gap-4 border-b border-white/8 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500 md:grid">
              <span>Пользователь</span>
              <span>Регистрация</span>
              <span>Роль</span>
              <span>Статус</span>
              <span>Активность</span>
              <span className="text-right">Управление</span>
            </div>
            {users.map((user) => (
              <div key={user.id} className="grid gap-3 border-t border-white/6 px-5 py-4 first:border-t-0 md:grid-cols-[2.2fr_1fr_1fr_1fr_1.4fr_1.8fr] md:items-center">
                <div className="md:col-span-3">
                  <p className="font-medium text-zinc-100">{user.email}</p>
                  <p className="text-xs text-zinc-500">{user.id}</p>
                </div>
                <p className="text-sm text-zinc-300 md:col-span-1">{new Date(user.createdAt).toLocaleDateString("ru-RU")}</p>
                <p className="text-sm text-zinc-300 md:col-span-1">{user.role}</p>
                <p className="text-sm text-zinc-300 md:col-span-1">{user.status}</p>
                <p className="text-sm text-zinc-500 md:col-span-1">
                  Платежи: {user._count?.payments || 0}, подписки: {user._count?.subscriptions || 0}
                </p>
                <div className="flex flex-wrap gap-2 md:justify-end md:col-span-1">
                  <button
                    onClick={() => void updateUserRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                    className="ui-btn ui-btn-ghost ui-btn-compact"
                  >
                    {user.role === "ADMIN" ? "Сделать USER" : "Сделать ADMIN"}
                  </button>
                  <button
                    onClick={() => void updateUserStatus(user.id, user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED")}
                    className="ui-btn ui-btn-ghost ui-btn-compact"
                  >
                    {user.status === "BLOCKED" ? "Разблокировать" : "Блокировать"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}