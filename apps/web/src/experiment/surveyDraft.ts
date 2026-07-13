import { isValidContactPhone } from "@snz-rodoved/shared";

export type SurveyBasicField = "ageGroup" | "gender" | "residence";
export type SurveyContactValidationIssue = "name" | "phone_missing" | "phone_invalid" | null;

export interface SurveyBasicSelections {
  ageGroup: boolean;
  gender: boolean;
  residence: boolean;
}

export const surveyDraftLifetimeMs = 24 * 60 * 60 * 1000;
// Demographics use step 0, paper questions Q4-Q16 use steps 1-13, and review uses 14.
export const surveyFlowVersion = 2;
export const surveyHelpStep = 13;
export const surveyReviewStep = 14;
export const surveyStepCount = 15;

// V1 grouped experience, interests, and help into steps 1, 2, and 3.
const legacySurveyStepMap = [0, 1, 4, surveyHelpStep, surveyReviewStep] as const;

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
  requiresContact: boolean
): number {
  if (!areBasicSelectionsComplete(selections)) {
    return 0;
  }

  return requiresContact && requestedStep > surveyHelpStep ? surveyHelpStep : requestedStep;
}

export function coerceSurveyDraftStep(value: unknown, flowVersion: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return 0;
  }

  if (flowVersion === surveyFlowVersion) {
    return Math.min(surveyStepCount - 1, Math.max(0, value));
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

  return !(answer === "yes" && (questionId === "q11" || questionId === "q16"));
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
    consentToEvents?: boolean;
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
    consentToEvents: undefined,
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
