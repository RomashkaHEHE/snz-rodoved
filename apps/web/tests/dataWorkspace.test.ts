import { describe, expect, it } from "vitest";
import {
  advanceVisibleCount,
  buildSurveyDateSeries,
  dataPageSize,
  getContactDateState,
  readDataMode,
  resolveInitialContactSelection,
  selectRecentSurveyDates,
  setDataModeSearchParam
} from "../src/experiment/dataWorkspace";

describe("data workspace navigation", () => {
  it("reads supported modes and falls back to contacts", () => {
    expect(readDataMode("?view=rows&source=online")).toBe("rows");
    expect(readDataMode("?view=pdf")).toBe("pdf");
    expect(readDataMode("?view=unknown")).toBe("contacts");
    expect(readDataMode("")).toBe("contacts");
  });

  it("keeps filter parameters while changing the mode", () => {
    const params = new URLSearchParams("source=paper&query=Снежинск");

    setDataModeSearchParam(params, "charts");
    expect(params.get("source")).toBe("paper");
    expect(params.get("query")).toBe("Снежинск");
    expect(params.get("view")).toBe("charts");

    setDataModeSearchParam(params, "contacts");
    expect(params.has("view")).toBe(false);
  });
});

describe("incremental data lists", () => {
  it("advances one page without exceeding the available rows", () => {
    expect(advanceVisibleCount(dataPageSize, 67)).toBe(40);
    expect(advanceVisibleCount(60, 67)).toBe(67);
    expect(advanceVisibleCount(20, 20)).toBe(20);
  });
});

describe("contact planning", () => {
  it("classifies the next contact date relative to today", () => {
    const today = "2026-07-16";

    expect(getContactDateState(undefined, today)).toBe("missing");
    expect(getContactDateState("2026-07-15", today)).toBe("due");
    expect(getContactDateState(today, today)).toBe("today");
    expect(getContactDateState("2026-07-17", today)).toBe("future");
  });

  it("selects the first desktop contact only once for a queue slice", () => {
    const base = {
      currentKey: "contacts:contact-1:3",
      dataMode: "contacts" as const,
      firstContactId: "contact-1",
      isMobile: false,
      selectedId: null
    };

    expect(resolveInitialContactSelection({ ...base, previousKey: "" })).toBe("contact-1");
    expect(resolveInitialContactSelection({ ...base, previousKey: base.currentKey })).toBeNull();
    expect(resolveInitialContactSelection({ ...base, previousKey: "", selectedId: "contact-2" })).toBeNull();
    expect(resolveInitialContactSelection({ ...base, previousKey: "", isMobile: true })).toBeNull();
    expect(
      resolveInitialContactSelection({ ...base, dataMode: "rows", previousKey: "" })
    ).toBeNull();
  });
});

describe("survey date analytics", () => {
  it("groups paper and online responses by date in chronological order", () => {
    expect(
      buildSurveyDateSeries([
        { source: "online", surveyDate: "2026-07-12" },
        { source: "paper", surveyDate: "2026-06-03" },
        { source: "paper", surveyDate: "2026-07-12" },
        { source: "paper", surveyDate: "2026-07-12" }
      ])
    ).toEqual([
      { date: "2026-06-03", online: 0, paper: 1, total: 1 },
      { date: "2026-07-12", online: 1, paper: 2, total: 3 }
    ]);
  });

  it("keeps the most recent dates without changing their chronological order", () => {
    const series = buildSurveyDateSeries([
      { source: "paper", surveyDate: "2026-05-01" },
      { source: "paper", surveyDate: "2026-06-01" },
      { source: "online", surveyDate: "2026-07-01" }
    ]);

    expect(selectRecentSurveyDates(series, 2).map((point) => point.date)).toEqual([
      "2026-06-01",
      "2026-07-01"
    ]);
    expect(selectRecentSurveyDates(series, 0)).toEqual([]);
  });
});
