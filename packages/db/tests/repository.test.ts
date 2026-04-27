import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseConnection, SurveyRepository, type DatabaseConnection } from "../src/index.js";
import type { SurveyResponseInput } from "@snz-rodoved/shared";

const baseInput: SurveyResponseInput = {
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

describe("SurveyRepository", () => {
  let connection: DatabaseConnection | undefined;

  afterEach(() => {
    connection?.close();
    connection = undefined;
  });

  it("creates and lists responses", () => {
    connection = createDatabaseConnection({ databasePath: ":memory:" });
    const repository = new SurveyRepository(connection.db);

    const created = repository.create(baseInput);
    const rows = repository.list();

    expect(created.id).toBeTruthy();
    expect(created.isFake).toBe(false);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.q11WarDetails).toBe("ВОв");
  });

  it("filters by answer values", () => {
    connection = createDatabaseConnection({ databasePath: ":memory:" });
    const repository = new SurveyRepository(connection.db);
    repository.create(baseInput);
    repository.create({ ...baseInput, gender: "male", q7: "no" });

    const yesRows = repository.list({ answerFilters: { q7: ["yes"] } });
    const noRows = repository.list({ answerFilters: { q7: ["no"] } });

    expect(yesRows).toHaveLength(1);
    expect(noRows).toHaveLength(1);
    expect(noRows[0]?.gender).toBe("male");
  });

  it("updates and deletes responses", () => {
    connection = createDatabaseConnection({ databasePath: ":memory:" });
    const repository = new SurveyRepository(connection.db);
    const created = repository.create(baseInput);

    const updated = repository.update(created.id, { q16: "no", q11WarDetails: "I Мировая" });
    expect(updated?.q16).toBe("no");
    expect(updated?.q11WarDetails).toBe("I Мировая");

    expect(repository.delete(created.id)).toBe(true);
    expect(repository.list()).toHaveLength(0);
  });

  it("deletes only fake responses in bulk", () => {
    connection = createDatabaseConnection({ databasePath: ":memory:" });
    const repository = new SurveyRepository(connection.db);
    repository.create(baseInput);
    repository.create({ ...baseInput, gender: "male" }, { isFake: true });

    expect(repository.deleteFake()).toBe(1);

    const rows = repository.list();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isFake).toBe(false);
  });
});
