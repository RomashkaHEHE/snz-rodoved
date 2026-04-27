import fs from "node:fs";
import path from "node:path";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { createDatabaseConnection, SurveyRepository, type DatabaseConnection } from "@snz-rodoved/db";
import {
  ageGroupValues,
  answerQuestionIds,
  answerValues,
  genderValues,
  partialSurveyResponseInputSchema,
  residenceValues,
  surveyResponseInputSchema,
  warDetailQuickValues,
  type PartialSurveyResponseInput,
  type SurveyResponseInput
} from "@snz-rodoved/shared";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { buildAnalyticsSummary } from "./analytics.js";
import {
  applyPasswordUpdate,
  clearSessionCookie,
  credentialsMatch,
  getSessionRole,
  loginSchema,
  passwordUpdateSchema,
  requireAdmin,
  requireWorkspace,
  resolveAuthConfig,
  setSessionCookie,
  workspaceLoginSchema,
  workspacePasswordMatches,
  type AuthConfig
} from "./auth.js";
import { buildResponsesCsv } from "./csv.js";
import { parseFiltersFromQuery } from "./filters.js";

export interface BuildAppOptions {
  databasePath?: string;
  auth?: Partial<AuthConfig>;
  logger?: boolean;
  webDistDir?: string | false;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const connection = createDatabaseConnection({ databasePath: options.databasePath });
  const repository = new SurveyRepository(connection.db);
  const authConfig = resolveAuthConfig(options.auth);
  const app = Fastify({ logger: options.logger ?? false });

  app.addHook("onClose", async () => {
    connection.close();
  });

  await app.register(cookie, {
    secret: authConfig.sessionSecret
  });

  await app.register(cors, {
    origin: true,
    credentials: true
  });

  registerApiRoutes(app, repository, authConfig, connection);
  await registerFrontend(app, options.webDistDir);

  return app;
}

function registerApiRoutes(
  app: FastifyInstance,
  repository: SurveyRepository,
  authConfig: AuthConfig,
  connection: DatabaseConnection
): void {
  app.setErrorHandler(async (error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: "validation_error", issues: error.issues });
    }

    const statusCode = getHttpStatusCode(error);
    if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500) {
      return reply.code(statusCode).send({ error: "bad_request", message: getErrorMessage(error) });
    }

    app.log.error(error);
    return reply.code(500).send({ error: "internal_error" });
  });

  app.get("/api/health", async () => ({ ok: true }));

  app.post("/api/auth/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);

    if (!credentialsMatch(input, authConfig)) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    setSessionCookie(reply, authConfig, "admin");
    return { authenticated: true, role: "admin" };
  });

  app.post("/api/auth/workspace-login", async (request, reply) => {
    const input = workspaceLoginSchema.parse(request.body);

    if (!workspacePasswordMatches(input, authConfig)) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    setSessionCookie(reply, authConfig, "workspace");
    return { authenticated: true, role: "workspace" };
  });

  app.post("/api/auth/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    return { authenticated: false, role: null };
  });

  app.get("/api/auth/me", async (request) => {
    const role = getSessionRole(request);
    return {
      authenticated: role !== null,
      role
    };
  });

  app.get("/api/responses", { preHandler: requireWorkspace }, async (request) => {
    const filters = parseFiltersFromQuery(request.query);
    return { responses: repository.list(filters) };
  });

  app.get("/api/responses/export.csv", { preHandler: requireWorkspace }, async (request, reply) => {
    const filters = parseFiltersFromQuery(request.query);
    const csv = buildResponsesCsv(repository.list(filters));

    return reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", 'attachment; filename="rodoved-responses.csv"')
      .send(csv);
  });

  app.post("/api/responses", { preHandler: requireWorkspace }, async (request, reply) => {
    const input = surveyResponseInputSchema.parse(request.body);
    const response = repository.create(input);
    return reply.code(201).send({ response });
  });

  app.post("/api/responses/fake", { preHandler: requireWorkspace }, async (_request, reply) => {
    const response = repository.create(createFakeResponseInput(), { isFake: true });
    return reply.code(201).send({ response });
  });

  app.patch<{
    Params: { id: string };
    Body: PartialSurveyResponseInput;
  }>("/api/responses/:id", { preHandler: requireWorkspace }, async (request, reply) => {
    const input = partialSurveyResponseInputSchema.parse(request.body);
    const response = repository.update(request.params.id, input);

    if (!response) {
      return reply.code(404).send({ error: "not_found" });
    }

    return { response };
  });

  app.delete("/api/responses/fake", { preHandler: requireWorkspace }, async () => {
    const deleted = repository.deleteFake();
    return { deleted };
  });

  app.delete<{ Params: { id: string } }>(
    "/api/responses/:id",
    { preHandler: requireWorkspace },
    async (request, reply) => {
      const deleted = repository.delete(request.params.id);

      if (!deleted) {
        return reply.code(404).send({ error: "not_found" });
      }

      return reply.code(204).send();
    }
  );

  app.get("/api/analytics/summary", { preHandler: requireWorkspace }, async (request) => {
    const filters = parseFiltersFromQuery(request.query);
    const responses = repository.list(filters);
    return { summary: buildAnalyticsSummary(responses) };
  });

  app.get("/api/debug/db", { preHandler: requireAdmin }, async () => ({
    open: connection.sqlite.open,
    readonly: connection.sqlite.readonly
  }));

  app.patch("/api/admin/passwords", { preHandler: requireAdmin }, async (request) => {
    const input = passwordUpdateSchema.parse(request.body);
    const persisted = persistPasswordUpdate(input);

    applyPasswordUpdate(authConfig, input);

    return {
      updated: true,
      persisted
    };
  });
}

async function registerFrontend(app: FastifyInstance, configuredDir: string | false | undefined) {
  if (configuredDir === false) {
    return;
  }

  const webDistDir = configuredDir ?? resolveWebDistDir();

  if (!fs.existsSync(webDistDir)) {
    return;
  }

  await app.register(fastifyStatic, {
    root: webDistDir,
    prefix: "/"
  });

  app.setNotFoundHandler(async (request, reply) => {
    if (request.method === "GET" && !request.url.startsWith("/api/")) {
      return reply.sendFile("index.html");
    }

    return reply.code(404).send({ error: "not_found" });
  });
}

function resolveWebDistDir(): string {
  const candidates = [
    process.env.RODOVED_WEB_DIST_DIR,
    process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD, "apps/web/dist") : undefined,
    path.resolve(process.cwd(), "apps/web/dist"),
    path.resolve(process.cwd(), "../web/dist")
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

function persistPasswordUpdate(input: { adminPassword?: string; workspacePassword?: string }): boolean {
  const envFile = resolveWritableEnvFile();

  if (!envFile) {
    return false;
  }

  let content = fs.readFileSync(envFile, "utf8");

  if (input.adminPassword) {
    content = upsertEnvValue(content, "ADMIN_PASSWORD", input.adminPassword);
  }

  if (input.workspacePassword) {
    content = upsertEnvValue(content, "WORKSPACE_PASSWORD", input.workspacePassword);
  }

  fs.writeFileSync(envFile, content, "utf8");
  return true;
}

function resolveWritableEnvFile(): string | null {
  if (process.env.NODE_ENV !== "production" && !process.env.RODOVED_ENV_FILE) {
    return null;
  }

  const candidates = [
    process.env.RODOVED_ENV_FILE,
    process.env.DATABASE_URL && process.env.DATABASE_URL !== ":memory:"
      ? path.resolve(path.dirname(process.env.DATABASE_URL), "..", ".env")
      : undefined,
    process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD, ".env") : undefined,
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env")
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function upsertEnvValue(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const separator = content.endsWith("\n") ? "" : "\n";
  return `${content}${separator}${line}\n`;
}

function getHttpStatusCode(error: unknown): number {
  if (error && typeof error === "object" && "statusCode" in error) {
    return Number(error.statusCode);
  }

  return 500;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Bad request";
}

function createFakeResponseInput(): SurveyResponseInput {
  const input: SurveyResponseInput = {
    surveyDate: randomRecentDate(),
    gender: randomItem(genderValues),
    ageGroup: randomItem(ageGroupValues),
    residence: randomItem(residenceValues),
    q11WarDetails: "—",
    q4: "unknown",
    q5: "unknown",
    q6: "unknown",
    q7: "unknown",
    q8: "unknown",
    q9: "unknown",
    q10: "unknown",
    q11: "unknown",
    q12: "unknown",
    q13: "unknown",
    q14: "unknown",
    q15: "unknown",
    q16: "unknown"
  };

  for (const questionId of answerQuestionIds) {
    input[questionId] = randomItem(answerValues);
  }

  if (input.q11 === "yes") {
    input.q11WarDetails = randomItem(warDetailQuickValues);
  }

  return input;
}

function randomRecentDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, 45));
  return date.toISOString().slice(0, 10);
}

function randomItem<TValue>(values: readonly TValue[]): TValue {
  return values[randomInt(0, values.length - 1)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
