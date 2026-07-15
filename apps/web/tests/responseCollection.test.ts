import { describe, expect, it } from "vitest";
import { upsertResponse } from "../src/experiment/responseCollection";

describe("workspace response collection", () => {
  it("inserts a confirmed response in repository order", () => {
    const existing = {
      createdAt: "2026-07-14T10:00:00.000Z",
      id: "older",
      surveyDate: "2026-07-14"
    };
    const saved = {
      createdAt: "2026-07-15T10:00:00.000Z",
      id: "saved",
      surveyDate: "2026-07-15"
    };

    expect(upsertResponse([existing], saved)).toEqual([saved, existing]);
  });

  it("replaces an edited row without creating a duplicate", () => {
    const original = {
      createdAt: "2026-07-15T09:00:00.000Z",
      id: "same-row",
      surveyDate: "2026-07-15",
      value: "before"
    };
    const updated = { ...original, surveyDate: "2026-07-16", value: "after" };
    const other = {
      createdAt: "2026-07-14T09:00:00.000Z",
      id: "other-row",
      surveyDate: "2026-07-14",
      value: "other"
    };

    expect(upsertResponse([original, other], updated)).toEqual([updated, other]);
  });
});
