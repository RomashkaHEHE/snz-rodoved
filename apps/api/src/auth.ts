import { timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const sessionCookieName = "rodoved_session";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export interface AuthConfig {
  username: string;
  password: string;
  sessionSecret: string;
  secureCookie: boolean;
}

export function resolveAuthConfig(overrides: Partial<AuthConfig> = {}): AuthConfig {
  const isProduction = process.env.NODE_ENV === "production";
  const username = overrides.username ?? process.env.ADMIN_USERNAME ?? "admin";
  const password = overrides.password ?? process.env.ADMIN_PASSWORD ?? "admin";
  const sessionSecret =
    overrides.sessionSecret ?? process.env.SESSION_SECRET ?? "dev-session-secret-change-me";

  if (isProduction && (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET)) {
    throw new Error("Production must set ADMIN_PASSWORD and SESSION_SECRET");
  }

  return {
    username,
    password,
    sessionSecret,
    secureCookie: overrides.secureCookie ?? isProduction
  };
}

export function credentialsMatch(input: z.infer<typeof loginSchema>, config: AuthConfig): boolean {
  return safeEqual(input.username, config.username) && safeEqual(input.password, config.password);
}

export function setSessionCookie(reply: FastifyReply, config: AuthConfig): void {
  reply.setCookie(sessionCookieName, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: config.secureCookie,
    signed: true,
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(sessionCookieName, { path: "/" });
}

export function isAuthenticated(request: FastifyRequest): boolean {
  const cookieValue = request.cookies[sessionCookieName];
  if (!cookieValue) {
    return false;
  }

  const unsigned = request.unsignCookie(cookieValue);
  return unsigned.valid && unsigned.value === "authenticated";
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isAuthenticated(request)) {
    await reply.code(401).send({ error: "unauthorized" });
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
