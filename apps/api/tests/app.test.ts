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

  afterEach(async () => {
    await app?.close();
    app = undefined;
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
  });

  it("logs in, creates responses, filters, and summarizes analytics", async () => {
    app = await buildApp({
      databasePath: ":memory:",
      auth: { username: "admin", password: "secret", sessionSecret: "test-secret" },
      webDistDir: false
    });

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: "admin", password: "secret" }
    });
    const cookie = login.headers["set-cookie"];
    expect(login.statusCode).toBe(200);

    const create = await app.inject({
      method: "POST",
      url: "/api/responses",
      headers: { cookie },
      payload: input
    });
    expect(create.statusCode).toBe(201);

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

  it("rejects invalid credentials", async () => {
    app = await buildApp({
      databasePath: ":memory:",
      auth: { username: "admin", password: "secret", sessionSecret: "test-secret" },
      webDistDir: false
    });

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: "admin", password: "wrong" }
    });

    expect(login.statusCode).toBe(401);
  });
});
