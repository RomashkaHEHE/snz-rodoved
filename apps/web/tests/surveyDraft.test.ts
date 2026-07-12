import { describe, expect, it } from "vitest";
import {
  areBasicSelectionsComplete,
  coerceBasicSelections,
  createEmptyBasicSelections,
  hasAnyBasicSelection,
  isSurveyDraftFresh,
  markBasicSelection,
  redactSurveyDraftContacts,
  resolveSurveyDraftStep,
  surveyDraftLifetimeMs
} from "../src/experiment/surveyDraft";

describe("online survey draft safety", () => {
  it("requires each demographic choice to be made explicitly", () => {
    const empty = createEmptyBasicSelections();
    const gender = markBasicSelection(empty, "gender");
    const age = markBasicSelection(gender, "ageGroup");
    const complete = markBasicSelection(age, "residence");

    expect(hasAnyBasicSelection(empty)).toBe(false);
    expect(areBasicSelectionsComplete(age)).toBe(false);
    expect(areBasicSelectionsComplete(complete)).toBe(true);
  });

  it("does not trust non-boolean restored selection markers", () => {
    expect(coerceBasicSelections({ ageGroup: "yes", gender: true, residence: 1 })).toEqual({
      ageGroup: false,
      gender: true,
      residence: false
    });
  });

  it("removes contact fields without changing the in-memory draft", () => {
    const draft = { contactName: "Алёна", contactPhone: "+7 900 000-00-00", q16: "yes" };
    const safeDraft = redactSurveyDraftContacts(draft);

    expect(safeDraft).toEqual({ contactName: undefined, contactPhone: undefined, q16: "yes" });
    expect(JSON.stringify(safeDraft)).not.toContain("Алёна");
    expect(JSON.stringify(safeDraft)).not.toContain("900");
    expect(draft.contactName).toBe("Алёна");
  });

  it("returns restored help requests to the contact step", () => {
    const complete = { ageGroup: true, gender: true, residence: true };

    expect(resolveSurveyDraftStep(4, complete, true)).toBe(3);
    expect(resolveSurveyDraftStep(4, complete, false)).toBe(4);
    expect(resolveSurveyDraftStep(3, createEmptyBasicSelections(), false)).toBe(0);
  });

  it("accepts only drafts saved within the configured lifetime", () => {
    const now = Date.parse("2026-07-12T10:00:00.000Z");

    expect(isSurveyDraftFresh(new Date(now - surveyDraftLifetimeMs).toISOString(), now)).toBe(true);
    expect(isSurveyDraftFresh(new Date(now - surveyDraftLifetimeMs - 1).toISOString(), now)).toBe(false);
    expect(isSurveyDraftFresh(new Date(now + 1).toISOString(), now)).toBe(false);
    expect(isSurveyDraftFresh(undefined, now)).toBe(false);
  });
});
