import fs from "node:fs";
import path from "node:path";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { createDatabaseConnection, SurveyRepository, type DatabaseConnection } from "@snz-rodoved/db";
import {
  partialSurveyResponseInputSchema,
  surveyResponseInputSchema,
  type PartialSurveyResponseInput
} from "@snz-rodoved/shared";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { buildAnalyticsSummary } from "./analytics.js";
import {
  clearSessionCookie,
  credentialsMatch,
  getSessionRole,
  loginSchema,
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
}

async function registerFrontend(app: FastifyInstance, configuredDir: string | false | undefined) {
  if (configuredDir === false) {
    return;
  }

  const webDistDir = configuredDir ?? path.resolve(process.cwd(), "apps/web/dist");

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
