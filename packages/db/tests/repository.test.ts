import { afterEach, describe, expect, it } from "vitest";
import {
  createDatabaseConnection,
  SurveyPdfFileRepository,
  SurveyRepository,
  type DatabaseConnection
} from "../src/index.js";
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

  it("stores online response context and filters by source", () => {
    connection = createDatabaseConnection({ databasePath: ":memory:" });
    const repository = new SurveyRepository(connection.db);
    repository.create(baseInput);
    repository.create(
      {
        ...baseInput,
        researchTerritory: "Челябинская область",
        researchPeriodStart: 1850,
        researchPeriodEnd: 1945,
        freeText: "Дополнительный комментарий",
        contactName: "Алёна",
        contactPhone: "+7 900 000-00-00"
      },
      { source: "online" }
    );

    const onlineRows = repository.list({ source: ["online"] });
    const paperRows = repository.list({ source: ["paper"] });

    expect(onlineRows).toHaveLength(1);
    expect(onlineRows[0]?.source).toBe("online");
    expect(onlineRows[0]?.researchTerritory).toBe("Челябинская область");
    expect(onlineRows[0]?.researchPeriodStart).toBe(1850);
    expect(onlineRows[0]?.contactName).toBe("Алёна");
    expect(onlineRows[0]?.contactPhone).toBe("+7 900 000-00-00");
    expect(paperRows).toHaveLength(1);
    expect(paperRows[0]?.source).toBe("paper");
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

  it("stores and filters survey PDF files by date", () => {
    connection = createDatabaseConnection({ databasePath: ":memory:" });
    const repository = new SurveyPdfFileRepository(connection.db);

    repository.create({
      displayName: "20260427_анкеты.pdf",
      originalFileName: "scan.pdf",
      storedFileName: "first.pdf",
      mimeType: "application/pdf",
      sizeBytes: 128
    });
    repository.create({
      displayName: "20260517_анкеты.pdf",
      originalFileName: "event.pdf",
      storedFileName: "second.pdf",
      mimeType: "application/pdf",
      sizeBytes: 256
    });

    const rows = repository.list();
    expect(rows.map((row) => row.displayName)).toEqual(["20260517_анкеты.pdf", "20260427_анкеты.pdf"]);

    const filtered = repository.list({ dateFrom: "2026-05-01", dateTo: "2026-05-31" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.surveyDate).toBe("2026-05-17");
  });
});
