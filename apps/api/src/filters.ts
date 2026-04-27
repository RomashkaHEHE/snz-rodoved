import {
  answerQuestionIds,
  surveyFiltersSchema,
  type AnswerQuestionId,
  type AnswerValue,
  type SurveyFilters
} from "@snz-rodoved/shared";

type QueryValue = string | string[] | undefined;
type QueryRecord = Record<string, QueryValue>;

export function parseFiltersFromQuery(query: unknown): SurveyFilters {
  const source = query && typeof query === "object" ? (query as QueryRecord) : {};
  const answerFilters: SurveyFilters["answerFilters"] = {};

  for (const questionId of answerQuestionIds) {
    const values = parseMultiValue(source[questionId]);
    if (values.length > 0) {
      answerFilters[questionId as AnswerQuestionId] = values as AnswerValue[];
    }
  }

  const parsed = surveyFiltersSchema.parse({
    dateFrom: parseSingleValue(source.dateFrom),
    dateTo: parseSingleValue(source.dateTo),
    gender: parseOptionalMultiValue(source.gender),
    ageGroup: parseOptionalMultiValue(source.ageGroup),
    residence: parseOptionalMultiValue(source.residence),
    answerFilters: Object.keys(answerFilters).length > 0 ? answerFilters : undefined
  });

  return parsed;
}

function parseSingleValue(value: QueryValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value || undefined;
}

function parseOptionalMultiValue(value: QueryValue): string[] | undefined {
  const parsed = parseMultiValue(value);
  return parsed.length > 0 ? parsed : undefined;
}

function parseMultiValue(value: QueryValue): string[] {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}
