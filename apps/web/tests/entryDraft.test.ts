import { describe, expect, it } from "vitest";
import {
  createPaperEntryDraftState,
  paperEntryDraftLifetimeMs,
  parsePaperEntryDraftState,
  type PaperEntryDraft
} from "../src/experiment/entryDraft";

const draft: PaperEntryDraft = {
  ageGroup: "over_40",
  gender: "female",
  q4: "yes",
  q5: "no",
  q6: "unknown",
  q7: "yes",
  q8: "no",
  q9: "unknown",
  q10: "yes",
  q11: "yes",
  q11WarDetails: "Великая Отечественная война",
  q12: "no",
  q13: "yes",
  q14: "unknown",
  q15: "yes",
  q16: "yes",
  residence: "snezhinsk",
  source: "paper",
  surveyDate: "2026-07-13"
};

describe("paper entry draft safety", () => {
  it("stores only paper answers and omits extra contact/search fields", () => {
    const unsafeDraft = {
      ...draft,
      contactName: "Алёна",
      contactNextDate: "2026-07-20",
      contactPhone: "+7 900 000-00-00",
      freeText: "Личный запрос",
      researchTerritory: "Челябинская область"
    };
    const state = createPaperEntryDraftState(unsafeDraft, 13, "2026-07-13T10:00:00.000Z");
    const serialized = JSON.stringify(state);

    expect(state.draft).toEqual(draft);
    expect(serialized).not.toContain("Алёна");
    expect(serialized).not.toContain("900");
    expect(serialized).not.toContain("Личный запрос");
    expect(serialized).not.toContain("Челябинская область");
  });

  it("restores a fresh valid draft and its mobile step", () => {
    const now = Date.parse("2026-07-13T11:00:00.000Z");
    const stored = createPaperEntryDraftState(draft, 8, "2026-07-13T10:00:00.000Z");

    expect(parsePaperEntryDraftState(stored, now)).toEqual(stored);
  });

  it("falls back to the first step without rejecting valid answers", () => {
    const now = Date.parse("2026-07-13T11:00:00.000Z");
    const stored = { ...createPaperEntryDraftState(draft, 8, "2026-07-13T10:00:00.000Z"), mobileEntryStep: 99 };

    expect(parsePaperEntryDraftState(stored, now)?.mobileEntryStep).toBe(0);
  });

  it("rejects expired, future, online, and malformed drafts", () => {
    const now = Date.parse("2026-07-13T11:00:00.000Z");
    const valid = createPaperEntryDraftState(draft, 3, "2026-07-13T10:00:00.000Z");

    expect(
      parsePaperEntryDraftState(
        { ...valid, savedAt: new Date(now - paperEntryDraftLifetimeMs - 1).toISOString() },
        now
      )
    ).toBeNull();
    expect(parsePaperEntryDraftState({ ...valid, savedAt: new Date(now + 1).toISOString() }, now)).toBeNull();
    expect(parsePaperEntryDraftState({ ...valid, draft: { ...draft, source: "online" } }, now)).toBeNull();
    expect(parsePaperEntryDraftState({ ...valid, draft: { ...draft, q9: "maybe" } }, now)).toBeNull();
  });
});
