export type SurveyBasicField = "ageGroup" | "gender" | "residence";

export interface SurveyBasicSelections {
  ageGroup: boolean;
  gender: boolean;
  residence: boolean;
}

export const surveyDraftLifetimeMs = 24 * 60 * 60 * 1000;

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

  return requiresContact && requestedStep > 3 ? 3 : requestedStep;
}

export function redactSurveyDraftContacts<
  T extends { contactName?: string; contactPhone?: string }
>(draft: T): T {
  return { ...draft, contactName: undefined, contactPhone: undefined };
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
