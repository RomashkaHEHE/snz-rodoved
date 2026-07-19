export interface EntryBatchState {
  count: number;
  lastResponseId?: string;
  surveyDate: string;
}

export type EntryBatchEndAction = "none" | "clear-draft" | "finish-series";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseEntryBatchState(value: unknown, fallbackSurveyDate: string): EntryBatchState {
  if (!value || typeof value !== "object") {
    return { count: 0, surveyDate: fallbackSurveyDate };
  }

  const stored = value as Partial<EntryBatchState>;
  const hasValidSurveyDate =
    typeof stored.surveyDate === "string" && isoDatePattern.test(stored.surveyDate);
  const surveyDate = hasValidSurveyDate ? stored.surveyDate! : fallbackSurveyDate;
  const count =
    hasValidSurveyDate &&
    typeof stored.count === "number" &&
    Number.isInteger(stored.count) &&
    stored.count >= 0
      ? stored.count
      : 0;
  const lastResponseId =
    hasValidSurveyDate && typeof stored.lastResponseId === "string" && stored.lastResponseId.trim()
      ? stored.lastResponseId
      : undefined;

  return lastResponseId ? { count, lastResponseId, surveyDate } : { count, surveyDate };
}

export function changeEntryBatchDate(state: EntryBatchState, surveyDate: string): EntryBatchState {
  return surveyDate === state.surveyDate ? state : { count: 0, surveyDate };
}

export function advanceEntryBatch(
  state: EntryBatchState,
  lastResponseId?: string
): EntryBatchState {
  return {
    ...state,
    count: state.count + 1,
    ...(lastResponseId ? { lastResponseId } : {})
  };
}

export function resolveEntryBatchEndAction(
  state: EntryBatchState,
  hasUnsavedDraft: boolean
): EntryBatchEndAction {
  if (state.count > 0) {
    return "finish-series";
  }

  return hasUnsavedDraft ? "clear-draft" : "none";
}
