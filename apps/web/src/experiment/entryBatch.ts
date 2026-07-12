export interface EntryBatchState {
  count: number;
  surveyDate: string;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseEntryBatchState(value: unknown, fallbackSurveyDate: string): EntryBatchState {
  if (!value || typeof value !== "object") {
    return { count: 0, surveyDate: fallbackSurveyDate };
  }

  const stored = value as Partial<EntryBatchState>;
  const surveyDate = typeof stored.surveyDate === "string" && isoDatePattern.test(stored.surveyDate)
    ? stored.surveyDate
    : fallbackSurveyDate;
  const count = typeof stored.count === "number" && Number.isInteger(stored.count) && stored.count >= 0
    ? stored.count
    : 0;

  return { count, surveyDate };
}

export function changeEntryBatchDate(state: EntryBatchState, surveyDate: string): EntryBatchState {
  return {
    count: surveyDate === state.surveyDate ? state.count : 0,
    surveyDate
  };
}

export function advanceEntryBatch(state: EntryBatchState): EntryBatchState {
  return { ...state, count: state.count + 1 };
}
