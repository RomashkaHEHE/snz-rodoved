import { describe, expect, it } from "vitest";
import {
  advanceEntryBatch,
  changeEntryBatchDate,
  parseEntryBatchState,
  resolveEntryBatchEndAction
} from "../src/experiment/entryBatch";

describe("entry batch state", () => {
  it("restores a valid series from session data", () => {
    expect(
      parseEntryBatchState(
        { count: 4, lastResponseId: "response-4", surveyDate: "2026-07-10" },
        "2026-07-12"
      )
    ).toEqual({
      count: 4,
      lastResponseId: "response-4",
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
    const state = { count: 3, lastResponseId: "response-3", surveyDate: "2026-07-10" };

    expect(changeEntryBatchDate(state, "2026-07-10")).toEqual(state);
    expect(changeEntryBatchDate(state, "2026-07-11")).toEqual({
      count: 0,
      surveyDate: "2026-07-11"
    });
  });

  it("increments the series without changing its date", () => {
    expect(advanceEntryBatch({ count: 1, surveyDate: "2026-07-10" }, "response-2")).toEqual({
      count: 2,
      lastResponseId: "response-2",
      surveyDate: "2026-07-10"
    });
  });

  it("does not restore a last response from an invalid series date", () => {
    expect(
      parseEntryBatchState(
        { count: 2, lastResponseId: "stale-response", surveyDate: "10.07.2026" },
        "2026-07-12"
      )
    ).toEqual({ count: 0, surveyDate: "2026-07-12" });
  });

  it("distinguishes clearing a draft from finishing a saved series", () => {
    const emptySeries = { count: 0, surveyDate: "2026-07-12" };
    const savedSeries = { count: 2, surveyDate: "2026-07-12" };

    expect(resolveEntryBatchEndAction(emptySeries, false)).toBe("none");
    expect(resolveEntryBatchEndAction(emptySeries, true)).toBe("clear-draft");
    expect(resolveEntryBatchEndAction(savedSeries, false)).toBe("finish-series");
    expect(resolveEntryBatchEndAction(savedSeries, true)).toBe("finish-series");
  });
});
