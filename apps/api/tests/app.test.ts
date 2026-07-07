import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { SurveyResponseInput } from "@snz-rodoved/shared";

const input: SurveyResponseInput = {
  surveyDate: "2026-04-27",
  gender: "female",
  ageGroup: "over_40",
  residence: "snezhinsk",
  q4: "unknown",
  q5: "yes",
  q6: "no",
  q7: "yes",
  q8: "yes",
  q9: "no",
  q10: "unknown",
  q11: "yes",
  q11WarDetails: "ВОв",
  q12: "yes",
  q13: "no",
  q14: "unknown",
  q15: "yes",
  q16: "yes"
};

describe("api app", () => {
  let app: FastifyInstance | undefined;
  let pdfStorageDir: string | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    if (pdfStorageDir) {
      fs.rmSync(pdfStorageDir, { recursive: true, force: true });
      pdfStorageDir = undefined;
    }
  });

  it("protects responses behind login", async () => {
    app = await buildApp({
      databasePath: ":memory:",
      auth: { username: "admin", password: "secret", sessionSecret: "test-secret" },
      webDistDir: false
    });

    const unauthorized = await app.inject({ method: "GET", url: "/api/responses" });
    expect(unauthorized.statusCode).toBe(401);

    const exportUnauthorized = await app.inject({
      method: "GET",
      url: "/api/responses/export.csv"
    });
    expect(exportUnauthorized.statusCode).toBe(401);

    const fakeCreateUnauthorized = await app.inject({
      method: "POST",
      url: "/api/responses/fake"
    });
    expect(fakeCreateUnauthorized.statusCode).toBe(401);

    const fakeDeleteUnauthorized = await app.inject({
      method: "DELETE",
      url: "/api/responses/fake"
    });
    expect(fakeDeleteUnauthorized.statusCode).toBe(401);

    const pdfFilesUnauthorized = await app.inject({
      method: "GET",
      url: "/api/pdf-files"
    });
    expect(pdfFilesUnauthorized.statusCode).toBe(401);
  });

  it("logs in, creates responses, filters, and summarizes analytics", async () => {
    app = await buildApp({
      databasePath: ":memory:",
      auth: {
        username: "admin",
        password: "secret",
        workspacePassword: "workspace-secret",
        sessionSecret: "test-secret"
      },
      webDistDir: false
    });

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/workspace-login",
      payload: { password: "workspace-secret" }
    });
    const cookie = login.headers["set-cookie"];
    expect(login.statusCode).toBe(200);
    expect(login.json().role).toBe("workspace");

    const create = await app.inject({
      method: "POST",
      url: "/api/responses",
      headers: { cookie },
      payload: input
    });
    expect(create.statusCode).toBe(201);
    expect(create.json().response.isFake).toBe(false);

    await app.inject({
      method: "POST",
      url: "/api/responses",
      headers: { cookie },
      payload: { ...input, gender: "male", q7: "no", q11WarDetails: "I Мировая" }
    });

    const filtered = await app.inject({
      method: "GET",
      url: "/api/responses?q7=yes",
      headers: { cookie }
    });
    expect(filtered.json().responses).toHaveLength(1);

    const analytics = await app.inject({
      method: "GET",
      url: "/api/analytics/summary",
      headers: { cookie }
    });
    expect(analytics.json().summary.total).toBe(2);
    expect(analytics.json().summary.answerBreakdown.q7.yes).toBe(1);

    const exported = await app.inject({
      method: "GET",
      url: "/api/responses/export.csv?q7=yes",
      headers: { cookie }
    });

    expect(exported.statusCode).toBe(200);
    expect(exported.headers["content-type"]).toContain("text/csv");
    expect(exported.body).toContain("Дата опроса");
    expect(exported.body).toContain("7. Найти предков, живших в 20 в. (СССР)");
    expect(exported.body).toContain("8. Найти предков, живших в 20 в.");
    expect(exported.body).toContain("11. Если да, какая война");
    expect(exported.body).toContain("Нет ответа");
    expect(exported.body).toContain("ВОв");
    expect(exported.body).not.toContain("I Мировая");
  });

  it("generates and deletes only fake responses", async () => {
    app = await buildApp({
      databasePath: ":memory:",
      auth: {
        username: "admin",
        password: "secret",
        workspacePassword: "workspace-secret",
        sessionSecret: "test-secret"
      },
      webDistDir: false
    });

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/workspace-login",
      payload: { password: "workspace-secret" }
    });
    const cookie = login.headers["set-cookie"];

    await app.inject({
      method: "POST",
      url: "/api/responses",
      headers: { cookie },
      payload: input
    });

    const fake = await app.inject({
      method: "POST",
      url: "/api/responses/fake",
      headers: { cookie }
    });
    expect(fake.statusCode).toBe(201);
    expect(fake.json().response.isFake).toBe(true);

    const beforeDelete = await app.inject({
      method: "GET",
      url: "/api/responses",
      headers: { cookie }
    });
    expect(beforeDelete.json().responses).toHaveLength(2);

    const deleteFake = await app.inject({
      method: "DELETE",
      url: "/api/responses/fake",
      headers: { cookie }
    });
    expect(deleteFake.statusCode).toBe(200);
    expect(deleteFake.json()).toEqual({ deleted: 1 });

    const afterDelete = await app.inject({
      method: "GET",
      url: "/api/responses",
      headers: { cookie }
    });
    expect(afterDelete.json().responses).toHaveLength(1);
    expect(afterDelete.json().responses[0].isFake).toBe(false);
  });

  it("uploads, filters, downloads, and deletes survey PDF files", async () => {
    pdfStorageDir = fs.mkdtempSync(path.join(os.tmpdir(), "snz-rodoved-api-pdfs-"));
    app = await buildApp({
      databasePath: ":memory:",
      pdfStorageDir,
      auth: {
        username: "admin",
        password: "secret",
        workspacePassword: "workspace-secret",
        sessionSecret: "test-secret"
      },
      webDistDir: false
    });

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/workspace-login",
      payload: { password: "workspace-secret" }
    });
    const cookie = login.headers["set-cookie"];

    const mayPdf = createMultipartPdfBody("20260517_анкеты.pdf");
    const uploadMay = await app.inject({
      method: "POST",
      url: "/api/pdf-files",
      headers: { cookie, ...mayPdf.headers },
      payload: mayPdf.payload
    });
    expect(uploadMay.statusCode).toBe(201);
    expect(uploadMay.json().file).toMatchObject({
      surveyDate: "2026-05-17",
      displayName: "20260517_анкеты.pdf",
      originalFileName: "scan.pdf",
      sizeBytes: 15
    });

    const aprilPdf = createMultipartPdfBody("20260427_анкеты.pdf");
    await app.inject({
      method: "POST",
      url: "/api/pdf-files",
      headers: { cookie, ...aprilPdf.headers },
      payload: aprilPdf.payload
    });

    const filtered = await app.inject({
      method: "GET",
      url: "/api/pdf-files?dateFrom=2026-05-01&dateTo=2026-05-31",
      headers: { cookie }
    });
    expect(filtered.statusCode).toBe(200);
    expect(filtered.json().files).toHaveLength(1);
    expect(filtered.json().files[0].displayName).toBe("20260517_анкеты.pdf");

    const download = await app.inject({
      method: "GET",
      url: `/api/pdf-files/${uploadMay.json().file.id}/download`,
      headers: { cookie }
    });
    expect(download.statusCode).toBe(200);
    expect(download.headers["content-type"]).toContain("application/pdf");
    expect(download.headers["content-disposition"]).toContain("filename*=UTF-8");
    expect(download.body).toContain("%PDF-1.4");

    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/pdf-files/${uploadMay.json().file.id}`,
      headers: { cookie }
    });
    expect(deleted.statusCode).toBe(204);

    const afterDelete = await app.inject({
      method: "GET",
      url: "/api/pdf-files?dateFrom=2026-05-01&dateTo=2026-05-31",
      headers: { cookie }
    });
    expect(afterDelete.json().files).toHaveLength(0);
  });

  it("rejects invalid credentials", async () => {
    app = await buildApp({
      databasePath: ":memory:",
      auth: {
        username: "admin",
        password: "secret",
        workspacePassword: "workspace-secret",
        sessionSecret: "test-secret"
      },
      webDistDir: false
    });

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: "admin", password: "wrong" }
    });

    expect(login.statusCode).toBe(401);

    const workspaceLogin = await app.inject({
      method: "POST",
      url: "/api/auth/workspace-login",
      payload: { password: "wrong" }
    });

    expect(workspaceLogin.statusCode).toBe(401);
  });

  it("lets an admin update workspace and admin passwords", async () => {
    app = await buildApp({
      databasePath: ":memory:",
      auth: {
        username: "admin",
        password: "secret-password",
        workspacePassword: "workspace-secret",
        sessionSecret: "test-secret"
      },
      webDistDir: false
    });

    const adminLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: "admin", password: "secret-password" }
    });
    const cookie = adminLogin.headers["set-cookie"];

    const unauthorized = await app.inject({
      method: "PATCH",
      url: "/api/admin/passwords",
      payload: { workspacePassword: "new-workspace-secret" }
    });
    expect(unauthorized.statusCode).toBe(401);

    const updated = await app.inject({
      method: "PATCH",
      url: "/api/admin/passwords",
      headers: { cookie },
      payload: {
        adminPassword: "new-admin-secret",
        workspacePassword: "new-workspace-secret"
      }
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({ updated: true, persisted: false });

    const oldAdminLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: "admin", password: "secret-password" }
    });
    expect(oldAdminLogin.statusCode).toBe(401);

    const newAdminLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: "admin", password: "new-admin-secret" }
    });
    expect(newAdminLogin.statusCode).toBe(200);

    const newWorkspaceLogin = await app.inject({
      method: "POST",
      url: "/api/auth/workspace-login",
      payload: { password: "new-workspace-secret" }
    });
    expect(newWorkspaceLogin.statusCode).toBe(200);
  });
});

function createMultipartPdfBody(displayName: string) {
  const boundary = "----snz-rodoved-test-boundary";
  const pdfContent = Buffer.from("%PDF-1.4\nsample");
  const chunks = [
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="displayName"\r\n\r\n${displayName}\r\n`,
      "utf8"
    ),
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="scan.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
      "utf8"
    ),
    pdfContent,
    Buffer.from(`\r\n--${boundary}--\r\n`, "utf8")
  ];

  return {
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`
    },
    payload: Buffer.concat(chunks)
  };
}
