import { describe, expect, it } from "vitest";
import {
  advanceEntryBatch,
  changeEntryBatchDate,
  parseEntryBatchState
} from "../src/experiment/entryBatch";

describe("entry batch state", () => {
  it("restores a valid series from session data", () => {
    expect(parseEntryBatchState({ count: 4, surveyDate: "2026-07-10" }, "2026-07-12")).toEqual({
      count: 4,
      surveyDate: "2026-07-10"
    });
  });

  it("falls back instead of accepting an invalid date or count", () => {
    expect(parseEntryBatchState({ count: -2, surveyDate: "10.07.2026" }, "2026-07-12")).toEqual({
      count: 0,
      surveyDate: "2026-07-12"
    });
  });

  it("keeps the count for the same date and resets it for a new date", () => {
    const state = { count: 3, surveyDate: "2026-07-10" };

    expect(changeEntryBatchDate(state, "2026-07-10")).toEqual(state);
    expect(changeEntryBatchDate(state, "2026-07-11")).toEqual({
      count: 0,
      surveyDate: "2026-07-11"
    });
  });

  it("increments the series without changing its date", () => {
    expect(advanceEntryBatch({ count: 1, surveyDate: "2026-07-10" })).toEqual({
      count: 2,
      surveyDate: "2026-07-10"
    });
  });
});
