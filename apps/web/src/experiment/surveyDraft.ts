import { isValidContactPhone } from "@snz-rodoved/shared";

export type SurveyBasicField = "ageGroup" | "gender" | "residence";
export type SurveyContactValidationIssue = "name" | "phone_missing" | "phone_invalid" | null;

export interface SurveyBasicSelections {
  ageGroup: boolean;
  gender: boolean;
  residence: boolean;
}

export const surveyDraftLifetimeMs = 24 * 60 * 60 * 1000;
// Demographics and Q4-Q16 stay fixed; the help branch adds contacts and search context.
export const surveyFlowVersion = 3;
export const surveyHelpStep = 13;
export const surveyContactStep = 14;
export const surveySearchStep = 15;
export const surveyReviewStep = 16;
export const surveyStepCount = 17;

// V1 grouped experience, interests, and help into steps 1, 2, and 3.
const legacySurveyStepMap = [0, 1, 4, surveyHelpStep, surveyReviewStep] as const;
const previousSurveyFlowVersion = 2;
const previousSurveyReviewStep = 14;

export function createEmptyBasicSelections(): SurveyBasicSelections {
  return { ageGroup: false, gender: false, residence: false };
}

export function coerceBasicSelections(value: unknown): SurveyBasicSelections {
  if (!value || typeof value !== "object") {
    return createEmptyBasicSelections();
  }

  const stored = value as Partial<SurveyBasicSelections>;
  return {
    ageGroup: stored.ageGroup === true,
    gender: stored.gender === true,
    residence: stored.residence === true
  };
}

export function markBasicSelection(
  selections: SurveyBasicSelections,
  field: SurveyBasicField
): SurveyBasicSelections {
  return { ...selections, [field]: true };
}

export function hasAnyBasicSelection(selections: SurveyBasicSelections): boolean {
  return selections.ageGroup || selections.gender || selections.residence;
}

export function areBasicSelectionsComplete(selections: SurveyBasicSelections): boolean {
  return selections.ageGroup && selections.gender && selections.residence;
}

export function resolveSurveyDraftStep(
  requestedStep: number,
  selections: SurveyBasicSelections,
  hasHelpRequest: boolean
): number {
  if (!areBasicSelectionsComplete(selections)) {
    return 0;
  }

  if (hasHelpRequest) {
    // Name and phone are intentionally redacted from browser drafts.
    return requestedStep > surveyContactStep ? surveyContactStep : requestedStep;
  }

  return requestedStep === surveyContactStep || requestedStep === surveySearchStep
    ? surveyReviewStep
    : requestedStep;
}

export function coerceSurveyDraftStep(value: unknown, flowVersion: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return 0;
  }

  if (flowVersion === surveyFlowVersion) {
    return Math.min(surveyStepCount - 1, Math.max(0, value));
  }

  if (flowVersion === previousSurveyFlowVersion) {
    if (value >= 0 && value <= surveyHelpStep) {
      return value;
    }

    return value === previousSurveyReviewStep ? surveyReviewStep : 0;
  }

  if (flowVersion === undefined && value >= 0 && value < legacySurveyStepMap.length) {
    return legacySurveyStepMap[value];
  }

  return 0;
}

export function shouldAutoAdvanceSurveyQuestion(
  questionId: string,
  answer: "yes" | "no" | "unknown"
): boolean {
  if (answer === "unknown") {
    return false;
  }

  return !(answer === "yes" && questionId === "q11");
}

export function getNextSurveyStep(currentStep: number, hasHelpRequest: boolean): number {
  if (currentStep < surveyHelpStep) {
    return Math.min(surveyHelpStep, currentStep + 1);
  }

  if (currentStep === surveyHelpStep) {
    return hasHelpRequest ? surveyContactStep : surveyReviewStep;
  }

  if (currentStep === surveyContactStep) {
    return surveySearchStep;
  }

  return surveyReviewStep;
}

export function getPreviousSurveyStep(currentStep: number, hasHelpRequest: boolean): number {
  if (currentStep === surveyReviewStep) {
    return hasHelpRequest ? surveySearchStep : surveyHelpStep;
  }

  if (currentStep === surveySearchStep) {
    return surveyContactStep;
  }

  if (currentStep === surveyContactStep) {
    return surveyHelpStep;
  }

  return Math.max(0, currentStep - 1);
}

export function getSurveyContactValidationIssue(draft: {
  contactName?: string;
  contactPhone?: string;
  q16: "yes" | "no" | "unknown";
}): SurveyContactValidationIssue {
  if (draft.q16 !== "yes") {
    return null;
  }

  if (!draft.contactName?.trim()) {
    return "name";
  }

  if (!draft.contactPhone?.trim()) {
    return "phone_missing";
  }

  return isValidContactPhone(draft.contactPhone) ? null : "phone_invalid";
}

export function redactSurveyDraftContacts<
  T extends { contactName?: string; contactPhone?: string }
>(draft: T): T {
  return { ...draft, contactName: undefined, contactPhone: undefined };
}

export function clearSurveyHelpDetails<
  T extends {
    contactName?: string;
    contactNextDate?: string;
    contactPhone?: string;
    freeText?: string;
    researchPeriodEnd?: number;
    researchPeriodStart?: number;
    researchTerritory?: string;
  }
>(draft: T): T {
  return {
    ...draft,
    contactName: undefined,
    contactNextDate: undefined,
    contactPhone: undefined,
    freeText: undefined,
    researchPeriodEnd: undefined,
    researchPeriodStart: undefined,
    researchTerritory: undefined
  };
}

export function isSurveyDraftFresh(
  savedAt: unknown,
  nowMs: number,
  lifetimeMs = surveyDraftLifetimeMs
): savedAt is string {
  if (typeof savedAt !== "string") {
    return false;
  }

  const savedAtMs = Date.parse(savedAt);
  const ageMs = nowMs - savedAtMs;
  return Number.isFinite(savedAtMs) && ageMs >= 0 && ageMs <= lifetimeMs;
}
