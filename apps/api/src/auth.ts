import { timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const sessionCookieName = "rodoved_session";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const workspaceLoginSchema = z.object({
  password: z.string().min(1)
});

const managedPasswordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};:,.?/~]+$/);

export const passwordUpdateSchema = z
  .object({
    adminPassword: managedPasswordSchema.optional(),
    workspacePassword: managedPasswordSchema.optional()
  })
  .refine((value) => value.adminPassword || value.workspacePassword, {
    message: "At least one password must be provided"
  });

export type SessionRole = "workspace" | "admin";

export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;

export interface AuthConfig {
  username: string;
  password: string;
  workspacePassword: string;
  sessionSecret: string;
  secureCookie: boolean;
}

export function resolveAuthConfig(overrides: Partial<AuthConfig> = {}): AuthConfig {
  const isProduction = process.env.NODE_ENV === "production";
  const username = overrides.username ?? process.env.ADMIN_USERNAME ?? "admin";
  const password = overrides.password ?? process.env.ADMIN_PASSWORD ?? "admin";
  const workspacePassword =
    overrides.workspacePassword ?? process.env.WORKSPACE_PASSWORD ?? password;
  const sessionSecret =
    overrides.sessionSecret ?? process.env.SESSION_SECRET ?? "dev-session-secret-change-me";

  if (
    isProduction &&
    (!process.env.ADMIN_PASSWORD || !process.env.WORKSPACE_PASSWORD || !process.env.SESSION_SECRET)
  ) {
    throw new Error("Production must set ADMIN_PASSWORD, WORKSPACE_PASSWORD and SESSION_SECRET");
  }

  return {
    username,
    password,
    workspacePassword,
    sessionSecret,
    secureCookie: overrides.secureCookie ?? isProduction
  };
}

export function credentialsMatch(input: z.infer<typeof loginSchema>, config: AuthConfig): boolean {
  return safeEqual(input.username, config.username) && safeEqual(input.password, config.password);
}

export function workspacePasswordMatches(
  input: z.infer<typeof workspaceLoginSchema>,
  config: AuthConfig
): boolean {
  return safeEqual(input.password, config.workspacePassword);
}

export function applyPasswordUpdate(config: AuthConfig, input: PasswordUpdateInput): void {
  if (input.adminPassword) {
    config.password = input.adminPassword;
  }

  if (input.workspacePassword) {
    config.workspacePassword = input.workspacePassword;
  }
}

export function setSessionCookie(
  reply: FastifyReply,
  config: AuthConfig,
  role: SessionRole
): void {
  reply.setCookie(sessionCookieName, role, {
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
  return getSessionRole(request) !== null;
}

export function isAdminAuthenticated(request: FastifyRequest): boolean {
  return getSessionRole(request) === "admin";
}

export function getSessionRole(request: FastifyRequest): SessionRole | null {
  const cookieValue = request.cookies[sessionCookieName];
  if (!cookieValue) {
    return null;
  }

  const unsigned = request.unsignCookie(cookieValue);
  if (!unsigned.valid) {
    return null;
  }

  if (unsigned.value === "workspace" || unsigned.value === "admin") {
    return unsigned.value;
  }

  return null;
}

export async function requireWorkspace(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isAuthenticated(request)) {
    await reply.code(401).send({ error: "unauthorized" });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isAdminAuthenticated(request)) {
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
