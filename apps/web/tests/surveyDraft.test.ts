import { describe, expect, it } from "vitest";
import {
  areBasicSelectionsComplete,
  clearSurveyHelpDetails,
  coerceBasicSelections,
  coerceSurveyDraftStep,
  createEmptyBasicSelections,
  getNextSurveyStep,
  getPreviousSurveyStep,
  getSurveyContactValidationIssue,
  hasAnyBasicSelection,
  isSurveyDraftFresh,
  markBasicSelection,
  redactSurveyDraftContacts,
  resolveSurveyDraftStep,
  shouldAutoAdvanceSurveyQuestion,
  surveyDraftLifetimeMs,
  surveyContactStep,
  surveyFlowVersion,
  surveyHelpStep,
  surveyReviewStep,
  surveySearchStep
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

  it("clears help details without changing the separate invitation choice", () => {
    const draft = {
      contactName: "Алёна",
      contactNextDate: "2026-07-20",
      contactPhone: "+7 900 000-00-00",
      consentToEvents: true,
      freeText: "Нужны метрические книги",
      q16: "no",
      researchPeriodEnd: 1917,
      researchPeriodStart: 1850,
      researchTerritory: "Челябинская область"
    };

    expect(clearSurveyHelpDetails(draft)).toEqual({
      contactName: undefined,
      contactNextDate: undefined,
      contactPhone: undefined,
      consentToEvents: true,
      freeText: undefined,
      q16: "no",
      researchPeriodEnd: undefined,
      researchPeriodStart: undefined,
      researchTerritory: undefined
    });
    expect(draft.researchTerritory).toBe("Челябинская область");
  });

  it("distinguishes missing and invalid help contacts", () => {
    expect(getSurveyContactValidationIssue({ q16: "no" })).toBeNull();
    expect(getSurveyContactValidationIssue({ q16: "yes" })).toBe("name");
    expect(getSurveyContactValidationIssue({ contactName: "Анна", q16: "yes" })).toBe("phone_missing");
    expect(
      getSurveyContactValidationIssue({ contactName: "Анна", contactPhone: "123", q16: "yes" })
    ).toBe("phone_invalid");
    expect(
      getSurveyContactValidationIssue({
        contactName: "Анна",
        contactPhone: "+7 900 000-00-00",
        q16: "yes"
      })
    ).toBeNull();
  });

  it("returns restored help requests to the contact step", () => {
    const complete = { ageGroup: true, gender: true, residence: true };

    expect(resolveSurveyDraftStep(surveyHelpStep, complete, true)).toBe(surveyContactStep);
    expect(resolveSurveyDraftStep(surveyReviewStep, complete, true)).toBe(surveyContactStep);
    expect(resolveSurveyDraftStep(surveySearchStep, complete, true)).toBe(surveyContactStep);
    expect(resolveSurveyDraftStep(surveyReviewStep, complete, false)).toBe(surveyReviewStep);
    expect(resolveSurveyDraftStep(surveyContactStep, complete, false)).toBe(surveyReviewStep);
    expect(resolveSurveyDraftStep(8, createEmptyBasicSelections(), false)).toBe(0);
  });

  it("migrates five-step drafts and preserves current-flow positions", () => {
    expect([0, 1, 2, 3, 4].map((step) => coerceSurveyDraftStep(step, undefined))).toEqual([
      0,
      1,
      4,
      surveyHelpStep,
      surveyReviewStep
    ]);
    expect(coerceSurveyDraftStep(8, surveyFlowVersion)).toBe(8);
    expect(coerceSurveyDraftStep(99, surveyFlowVersion)).toBe(surveyReviewStep);
    expect(coerceSurveyDraftStep(13, 2)).toBe(surveyHelpStep);
    expect(coerceSurveyDraftStep(14, 2)).toBe(surveyReviewStep);
    expect(coerceSurveyDraftStep(2, 99)).toBe(0);
  });

  it("routes the optional help branch without changing the paper-question order", () => {
    expect(getNextSurveyStep(12, false)).toBe(surveyHelpStep);
    expect(getNextSurveyStep(surveyHelpStep, false)).toBe(surveyReviewStep);
    expect(getPreviousSurveyStep(surveyReviewStep, false)).toBe(surveyHelpStep);

    expect(getNextSurveyStep(surveyHelpStep, true)).toBe(surveyContactStep);
    expect(getNextSurveyStep(surveyContactStep, true)).toBe(surveySearchStep);
    expect(getNextSurveyStep(surveySearchStep, true)).toBe(surveyReviewStep);
    expect(getPreviousSurveyStep(surveyReviewStep, true)).toBe(surveySearchStep);
    expect(getPreviousSurveyStep(surveySearchStep, true)).toBe(surveyContactStep);
    expect(getPreviousSurveyStep(surveyContactStep, true)).toBe(surveyHelpStep);
  });

  it("auto-advances deliberate answers unless follow-up fields are opening", () => {
    expect(shouldAutoAdvanceSurveyQuestion("q4", "yes")).toBe(true);
    expect(shouldAutoAdvanceSurveyQuestion("q10", "no")).toBe(true);
    expect(shouldAutoAdvanceSurveyQuestion("q11", "yes")).toBe(false);
    expect(shouldAutoAdvanceSurveyQuestion("q16", "yes")).toBe(true);
    expect(shouldAutoAdvanceSurveyQuestion("q16", "no")).toBe(true);
    expect(shouldAutoAdvanceSurveyQuestion("q8", "unknown")).toBe(false);
  });

  it("accepts only drafts saved within the configured lifetime", () => {
    const now = Date.parse("2026-07-12T10:00:00.000Z");

    expect(isSurveyDraftFresh(new Date(now - surveyDraftLifetimeMs).toISOString(), now)).toBe(true);
    expect(isSurveyDraftFresh(new Date(now - surveyDraftLifetimeMs - 1).toISOString(), now)).toBe(false);
    expect(isSurveyDraftFresh(new Date(now + 1).toISOString(), now)).toBe(false);
    expect(isSurveyDraftFresh(undefined, now)).toBe(false);
  });
});
