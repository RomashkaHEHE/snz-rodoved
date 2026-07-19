import {
  areBasicSelectionsComplete,
  coerceBasicSelections,
  createEmptyBasicSelections,
  type SurveyBasicSelections
} from "./surveyDraft";

export type PaperEntryAnswer = "yes" | "no" | "unknown";
export type PaperEntryGender = "female" | "male";
export type PaperEntryAgeGroup = "under_18" | "18_40" | "over_40";
export type PaperEntryResidence = "snezhinsk" | "other";

export interface PaperEntryDraft {
  source: "paper";
  surveyDate: string;
  gender: PaperEntryGender;
  ageGroup: PaperEntryAgeGroup;
  residence: PaperEntryResidence;
  q4: PaperEntryAnswer;
  q5: PaperEntryAnswer;
  q6: PaperEntryAnswer;
  q7: PaperEntryAnswer;
  q8: PaperEntryAnswer;
  q9: PaperEntryAnswer;
  q10: PaperEntryAnswer;
  q11: PaperEntryAnswer;
  q11WarDetails?: string;
  q12: PaperEntryAnswer;
  q13: PaperEntryAnswer;
  q14: PaperEntryAnswer;
  q15: PaperEntryAnswer;
  q16: PaperEntryAnswer;
  consentToDataProcessing?: boolean;
  consentToEvents?: boolean;
}

export interface PaperEntryDraftState {
  basicSelections: SurveyBasicSelections;
  draft: PaperEntryDraft;
  mobileEntryStep: number;
  savedAt: string;
}

export const paperEntryDraftLifetimeMs = 24 * 60 * 60 * 1000;

const answerKeys = [
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
  "q15",
  "q16"
] as const;
const finalPaperMobileStep = answerKeys.length + 1;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function createPaperEntryDraftState(
  draft: PaperEntryDraft,
  mobileEntryStep: number,
  basicSelections = createEmptyBasicSelections(),
  savedAt = new Date().toISOString()
): PaperEntryDraftState {
  return {
    basicSelections: coerceBasicSelections(basicSelections),
    draft: pickSafePaperDraft(draft),
    mobileEntryStep: normalizeMobileStep(mobileEntryStep),
    savedAt
  };
}

export function parsePaperEntryDraftState(
  value: unknown,
  nowMs = Date.now()
): PaperEntryDraftState | null {
  if (!isRecord(value) || !isFreshTimestamp(value.savedAt, nowMs) || !isRecord(value.draft)) {
    return null;
  }

  const draft = value.draft;
  if (
    draft.source !== "paper" ||
    typeof draft.surveyDate !== "string" ||
    !isoDatePattern.test(draft.surveyDate) ||
    !isGender(draft.gender) ||
    !isAgeGroup(draft.ageGroup) ||
    !isResidence(draft.residence) ||
    !answerKeys.every((key) => isAnswer(draft[key]))
  ) {
    return null;
  }

  const basicSelections = coerceBasicSelections(value.basicSelections);

  return {
    basicSelections,
    draft: pickSafePaperDraft(draft as unknown as PaperEntryDraft),
    mobileEntryStep: areBasicSelectionsComplete(basicSelections)
      ? normalizeMobileStep(value.mobileEntryStep)
      : 0,
    savedAt: value.savedAt as string
  };
}

function pickSafePaperDraft(draft: PaperEntryDraft): PaperEntryDraft {
  return {
    ageGroup: draft.ageGroup,
    consentToDataProcessing: readOptionalBoolean(draft.consentToDataProcessing),
    consentToEvents: readOptionalBoolean(draft.consentToEvents),
    gender: draft.gender,
    q4: draft.q4,
    q5: draft.q5,
    q6: draft.q6,
    q7: draft.q7,
    q8: draft.q8,
    q9: draft.q9,
    q10: draft.q10,
    q11: draft.q11,
    q11WarDetails: cleanWarDetails(draft.q11WarDetails),
    q12: draft.q12,
    q13: draft.q13,
    q14: draft.q14,
    q15: draft.q15,
    q16: draft.q16,
    residence: draft.residence,
    source: "paper",
    surveyDate: draft.surveyDate
  };
}

function cleanWarDetails(value: unknown): string | undefined {
  return typeof value === "string" && value.length <= 200 ? value : undefined;
}

function readOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeMobileStep(value: unknown): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= finalPaperMobileStep
    ? value
    : 0;
}

function isFreshTimestamp(value: unknown, nowMs: number): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const savedAtMs = Date.parse(value);
  const ageMs = nowMs - savedAtMs;
  return Number.isFinite(savedAtMs) && ageMs >= 0 && ageMs <= paperEntryDraftLifetimeMs;
}

function isAnswer(value: unknown): value is PaperEntryAnswer {
  return value === "yes" || value === "no" || value === "unknown";
}

function isGender(value: unknown): value is PaperEntryGender {
  return value === "female" || value === "male";
}

function isAgeGroup(value: unknown): value is PaperEntryAgeGroup {
  return value === "under_18" || value === "18_40" || value === "over_40";
}

function isResidence(value: unknown): value is PaperEntryResidence {
  return value === "snezhinsk" || value === "other";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
