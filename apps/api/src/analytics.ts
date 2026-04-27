import {
  ageGroupLabels,
  ageGroupValues,
  answerLabels,
  answerQuestions,
  answerQuestionIds,
  createEmptyAnswerRecord,
  genderLabels,
  genderValues,
  interestQuestionIds,
  residenceLabels,
  residenceValues,
  type AnalyticsSummary,
  type AnswerQuestionId,
  type AnswerValue,
  type CountItem,
  type SurveyResponse
} from "@snz-rodoved/shared";

export function buildAnalyticsSummary(responses: SurveyResponse[]): AnalyticsSummary {
  const byDate = new Map<string, number>();
  const genderCounts = createCountMap(genderValues);
  const ageCounts = createCountMap(ageGroupValues);
  const residenceCounts = createCountMap(residenceValues);
  const answerBreakdown = createAnswerBreakdown();
  const warDetails = new Map<string, number>();

  for (const response of responses) {
    increment(byDate, response.surveyDate);
    increment(genderCounts, response.gender);
    increment(ageCounts, response.ageGroup);
    increment(residenceCounts, response.residence);

    for (const questionId of answerQuestionIds) {
      const answer = response[questionId];
      answerBreakdown[questionId][answer] += 1;
    }

    if (response.q11 === "yes") {
      increment(warDetails, normalizeWarDetail(response.q11WarDetails));
    }
  }

  return {
    total: responses.length,
    byDate: [...byDate.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, count]) => ({ date, count })),
    byGender: toCountItems(genderCounts, genderLabels),
    byAgeGroup: toCountItems(ageCounts, ageGroupLabels),
    byResidence: toCountItems(residenceCounts, residenceLabels),
    answerBreakdown,
    interestYesCounts: interestQuestionIds.map((questionId) => ({
      questionId,
      label: answerQuestions.find((question) => question.id === questionId)?.label ?? questionId,
      count: answerBreakdown[questionId].yes
    })),
    warDetails: [...warDetails.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([label, count]) => ({ label, count }))
  };
}

function createAnswerBreakdown(): Record<AnswerQuestionId, Record<AnswerValue, number>> {
  return Object.fromEntries(
    answerQuestionIds.map((questionId) => [questionId, createEmptyAnswerRecord()])
  ) as Record<AnswerQuestionId, Record<AnswerValue, number>>;
}

function createCountMap<TValue extends string>(values: readonly TValue[]): Map<TValue, number> {
  return new Map(values.map((value) => [value, 0]));
}

function increment<TValue extends string>(map: Map<TValue, number>, value: TValue): void {
  map.set(value, (map.get(value) ?? 0) + 1);
}

function toCountItems<TValue extends string>(
  map: Map<TValue, number>,
  labels: Record<TValue, string>
): Array<CountItem<TValue>> {
  return [...map.entries()].map(([value, count]) => ({
    value,
    label: labels[value],
    count
  }));
}

function normalizeWarDetail(value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized || normalized === "—" || normalized === "-") {
    return answerLabels.unknown;
  }

  return normalized;
}
