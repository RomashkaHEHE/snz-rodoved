import { afterEach, describe, expect, it } from "vitest";
import {
  createDatabaseConnection,
  SavedFilterPresetRepository,
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
        contactPhone: "+7 900 000-00-00",
        consentToDataProcessing: true,
        consentToEvents: true
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
    expect(onlineRows[0]?.consentToDataProcessing).toBe(true);
    expect(onlineRows[0]?.consentToEvents).toBe(true);
    expect(paperRows).toHaveLength(1);
    expect(paperRows[0]?.source).toBe("paper");
    expect(paperRows[0]?.consentToDataProcessing).toBeUndefined();
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

  it("stores contact workflow fields and resets them when help is no longer needed", () => {
    connection = createDatabaseConnection({ databasePath: ":memory:" });
    const repository = new SurveyRepository(connection.db);
    const created = repository.create({
      ...baseInput,
      contactName: "Алёна",
      contactPhone: "+7 900 000-00-00",
      consentToDataProcessing: true,
      consentToEvents: true
    });

    const withWorkflow = repository.update(created.id, {
      contactNote: "Позвонить в пятницу",
      contactNextDate: "2026-05-22",
      contactStatus: "in_progress"
    });

    expect(withWorkflow?.contactStatus).toBe("in_progress");
    expect(withWorkflow?.contactNote).toBe("Позвонить в пятницу");
    expect(withWorkflow?.contactNextDate).toBe("2026-05-22");

    const withoutHelp = repository.update(created.id, { q16: "no" });

    expect(withoutHelp?.contactStatus).toBe("new");
    expect(withoutHelp?.contactNote).toBeUndefined();
    expect(withoutHelp?.contactNextDate).toBeUndefined();
    expect(withoutHelp?.contactName).toBeUndefined();
    expect(withoutHelp?.contactPhone).toBeUndefined();
    expect(withoutHelp?.consentToDataProcessing).toBe(true);
    expect(withoutHelp?.consentToEvents).toBeUndefined();
  });

  it("filters by contact workflow and free text search", () => {
    connection = createDatabaseConnection({ databasePath: ":memory:" });
    const repository = new SurveyRepository(connection.db);
    const first = repository.create({
      ...baseInput,
      contactName: "Алёна",
      contactPhone: "+7 900 000-00-00",
      freeText: "Ивановы из деревни",
      researchTerritory: "Челябинская область"
    });
    const second = repository.create({
      ...baseInput,
      gender: "male",
      contactName: "Борис",
      freeText: "Пермская ветка"
    });
    const third = repository.create({
      ...baseInput,
      contactName: "Вера",
      contactPhone: "+7 901 111-11-11",
      residence: "other"
    });
    repository.create({ ...baseInput, q16: "no", q7: "no" });

    repository.update(first.id, { contactNextDate: "2026-05-20", contactStatus: "in_progress" });
    repository.update(second.id, { contactNextDate: "2026-05-27", contactStatus: "done" });

    expect(repository.list({ helpOnly: true })).toHaveLength(3);
    expect(repository.list({ contactOnly: true })).toHaveLength(3);
    expect(repository.list({ contactStatus: ["in_progress"] }).map((row) => row.id)).toEqual([first.id]);
    expect(repository.list({ contactStatus: ["done"] }).map((row) => row.id)).toEqual([second.id]);
    expect(repository.list({ contactNextTo: "2026-05-21" }).map((row) => row.id)).toEqual([first.id]);
    expect(repository.list({ contactNextFrom: "2026-05-21" }).map((row) => row.id)).toEqual([second.id]);
    expect(repository.list({ contactNextMissing: true }).map((row) => row.id)).toEqual([third.id]);
    expect(repository.list({ query: "Ивановы" }).map((row) => row.id)).toEqual([first.id]);
    expect(repository.list({ query: "Пермская" }).map((row) => row.id)).toEqual([second.id]);
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

  it("stores shared filter presets and updates matching names", () => {
    connection = createDatabaseConnection({ databasePath: ":memory:" });
    const repository = new SavedFilterPresetRepository(connection.db);

    const created = repository.upsert({
      name: "Обращения",
      filters: { contactStatus: ["new"], helpOnly: true }
    });
    const updated = repository.upsert({
      name: "Обращения",
      filters: { contactStatus: ["in_progress"], helpOnly: true }
    });

    expect(updated.id).toBe(created.id);
    expect(repository.list()).toHaveLength(1);
    expect(repository.list()[0]?.filters.contactStatus).toEqual(["in_progress"]);
    expect(repository.delete(created.id)).toBe(true);
    expect(repository.delete(created.id)).toBe(false);
    expect(repository.list()).toHaveLength(0);
  });
});
