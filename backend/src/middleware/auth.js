import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

export async function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      return res.status(401).json({ message: "User is not active" });
    }

    if (user.status === "BLOCKED") {
      return res.status(403).json({ message: "Account is blocked" });
    }

    req.user = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}