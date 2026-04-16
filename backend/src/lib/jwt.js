import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { env } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, status: user.status },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpires },
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, typ: "refresh" }, env.jwtRefreshSecret, {
    expiresIn: `${env.jwtRefreshExpiresDays}d`,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}