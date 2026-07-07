import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import multipart from "@fastify/multipart";
import {
  createDatabaseConnection,
  SurveyPdfFileRepository,
  SurveyRepository,
  type DatabaseConnection
} from "@snz-rodoved/db";
import {
  ageGroupValues,
  answerQuestionIds,
  answerValues,
  genderValues,
  onlineSurveyResponseInputSchema,
  partialSurveyResponseInputSchema,
  residenceValues,
  surveyResponseInputSchema,
  surveyPdfFileUploadSchema,
  warDetailQuickValues,
  type PartialSurveyResponseInput,
  type SurveyResponseInput
} from "@snz-rodoved/shared";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
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
  pdfStorageDir?: string;
  webDistDir?: string | false;
}

const maxPdfFileSizeBytes = 100 * 1024 * 1024;

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const connection = createDatabaseConnection({ databasePath: options.databasePath });
  const repository = new SurveyRepository(connection.db);
  const pdfRepository = new SurveyPdfFileRepository(connection.db);
  const pdfStorage = resolvePdfStorage(options);
  const authConfig = resolveAuthConfig(options.auth);
  const app = Fastify({ logger: options.logger ?? false });

  app.addHook("onClose", async () => {
    connection.close();
    if (pdfStorage.temporary) {
      await fs.promises.rm(pdfStorage.dir, { recursive: true, force: true });
    }
  });

  await app.register(cookie, {
    secret: authConfig.sessionSecret
  });

  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(multipart, {
    limits: {
      fileSize: maxPdfFileSizeBytes,
      files: 1,
      fields: 1,
      parts: 2
    },
    throwFileSizeLimit: true
  });

  registerApiRoutes(app, repository, pdfRepository, pdfStorage.dir, authConfig, connection);
  await registerFrontend(app, options.webDistDir);

  return app;
}

function registerApiRoutes(
  app: FastifyInstance,
  repository: SurveyRepository,
  pdfRepository: SurveyPdfFileRepository,
  pdfStorageDir: string,
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

  app.post("/api/public/survey-responses", async (request, reply) => {
    const input = onlineSurveyResponseInputSchema.parse({
      ...(request.body && typeof request.body === "object" ? request.body : {}),
      surveyDate: readSurveyDate(request.body) ?? createTodayDate()
    });
    const response = repository.create(input, { source: "online" });
    return reply.code(201).send({ response });
  });

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

  app.get("/api/pdf-files", { preHandler: requireWorkspace }, async (request) => {
    const filters = parseFiltersFromQuery(request.query);
    return { files: pdfRepository.list({ dateFrom: filters.dateFrom, dateTo: filters.dateTo }) };
  });

  app.post("/api/pdf-files", { preHandler: requireWorkspace }, async (request, reply) => {
    if (!request.isMultipart()) {
      return reply.code(400).send({ error: "bad_request", message: "Expected multipart form data" });
    }

    const upload = await receivePdfUpload(request, pdfStorageDir);
    const storedFileName = `${randomUUID()}.pdf`;
    const storedPath = path.join(pdfStorageDir, storedFileName);

    try {
      await fs.promises.rename(upload.tempPath, storedPath);
      const file = pdfRepository.create({
        displayName: upload.displayName,
        originalFileName: upload.originalFileName,
        storedFileName,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes
      });

      return reply.code(201).send({ file });
    } catch (error) {
      await fs.promises.rm(upload.tempPath, { force: true });
      await fs.promises.rm(storedPath, { force: true });

      if (isUniqueConstraintError(error)) {
        return reply.code(409).send({
          error: "duplicate_pdf_file",
          message: "PDF with this name already exists"
        });
      }

      throw error;
    }
  });

  app.get<{ Params: { id: string } }>(
    "/api/pdf-files/:id/download",
    { preHandler: requireWorkspace },
    async (request, reply) => {
      const file = pdfRepository.get(request.params.id);

      if (!file) {
        return reply.code(404).send({ error: "not_found" });
      }

      const storedPath = path.join(pdfStorageDir, file.storedFileName);

      if (!fs.existsSync(storedPath)) {
        return reply.code(404).send({ error: "file_missing" });
      }

      return reply
        .header("Content-Type", "application/pdf")
        .header("Content-Length", String(file.sizeBytes))
        .header("Content-Disposition", buildDownloadDisposition(file.displayName))
        .send(fs.createReadStream(storedPath));
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/api/pdf-files/:id",
    { preHandler: requireWorkspace },
    async (request, reply) => {
      const deleted = pdfRepository.delete(request.params.id);

      if (!deleted) {
        return reply.code(404).send({ error: "not_found" });
      }

      await fs.promises.rm(path.join(pdfStorageDir, deleted.storedFileName), { force: true });
      return reply.code(204).send();
    }
  );

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

interface PdfStorage {
  dir: string;
  temporary: boolean;
}

interface ReceivedPdfUpload {
  displayName: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  tempPath: string;
}

function resolvePdfStorage(options: BuildAppOptions): PdfStorage {
  const explicitDir = options.pdfStorageDir ?? process.env.RODOVED_PDF_DIR;

  if (explicitDir) {
    const dir = path.resolve(explicitDir);
    fs.mkdirSync(dir, { recursive: true });
    return { dir, temporary: false };
  }

  const databasePath = options.databasePath ?? process.env.DATABASE_URL;

  if (databasePath && databasePath !== ":memory:") {
    const dir = path.resolve(path.dirname(databasePath), "pdf-files");
    fs.mkdirSync(dir, { recursive: true });
    return { dir, temporary: false };
  }

  if (databasePath === ":memory:") {
    return {
      dir: fs.mkdtempSync(path.join(os.tmpdir(), "snz-rodoved-pdfs-")),
      temporary: true
    };
  }

  const dir = path.resolve(process.cwd(), "data/pdf-files");
  fs.mkdirSync(dir, { recursive: true });
  return { dir, temporary: false };
}

async function receivePdfUpload(
  request: FastifyRequest,
  pdfStorageDir: string
): Promise<ReceivedPdfUpload> {
  const tempDir = path.join(pdfStorageDir, ".tmp");
  await fs.promises.mkdir(tempDir, { recursive: true });

  let displayName: string | undefined;
  let receivedFile: Omit<ReceivedPdfUpload, "displayName"> | undefined;

  try {
    for await (const part of request.parts()) {
      if (part.type === "field") {
        if (part.fieldname === "displayName") {
          displayName = String(part.value ?? "").trim();
        }
        continue;
      }

      if (part.fieldname !== "file") {
        part.file.resume();
        continue;
      }

      if (receivedFile) {
        part.file.resume();
        throw httpError(400, "Only one PDF file can be uploaded");
      }

      if (!isPdfUpload(part.filename, part.mimetype)) {
        part.file.resume();
        throw httpError(400, "Only PDF files are supported");
      }

      const tempPath = path.join(tempDir, `${randomUUID()}.upload`);
      let sizeBytes = 0;

      part.file.on("data", (chunk: Buffer) => {
        sizeBytes += chunk.length;
      });

      await pipeline(part.file, fs.createWriteStream(tempPath));
      receivedFile = {
        originalFileName: part.filename,
        mimeType: part.mimetype || "application/pdf",
        sizeBytes,
        tempPath
      };
    }
  } catch (error) {
    if (receivedFile) {
      await fs.promises.rm(receivedFile.tempPath, { force: true });
    }
    throw error;
  }

  if (!displayName) {
    if (receivedFile) {
      await fs.promises.rm(receivedFile.tempPath, { force: true });
    }
    throw httpError(400, "PDF display name is required");
  }

  if (!receivedFile) {
    throw httpError(400, "PDF file is required");
  }

  let parsed: { displayName: string };
  try {
    parsed = surveyPdfFileUploadSchema.parse({ displayName });
  } catch (error) {
    await fs.promises.rm(receivedFile.tempPath, { force: true });
    throw error;
  }

  return {
    ...receivedFile,
    displayName: parsed.displayName
  };
}

function isPdfUpload(fileName: string, mimeType: string): boolean {
  const normalizedName = fileName.toLowerCase();
  const normalizedMimeType = mimeType.toLowerCase();
  return normalizedName.endsWith(".pdf") || normalizedMimeType.includes("pdf");
}

function buildDownloadDisposition(fileName: string): string {
  return `attachment; filename="rodoved-survey.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
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

function httpError(statusCode: number, message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes("unique");
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

function readSurveyDate(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("surveyDate" in body)) {
    return undefined;
  }

  const value = (body as { surveyDate?: unknown }).surveyDate;
  return typeof value === "string" && value ? value : undefined;
}

function createTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
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
