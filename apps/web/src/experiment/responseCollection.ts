interface StoredResponseIdentity {
  createdAt: string;
  id: string;
  surveyDate: string;
}

export function upsertResponse<TResponse extends StoredResponseIdentity>(
  responses: TResponse[],
  savedResponse: TResponse
): TResponse[] {
  return [
    savedResponse,
    ...responses.filter((response) => response.id !== savedResponse.id)
  ].sort((left, right) => {
    const bySurveyDate = right.surveyDate.localeCompare(left.surveyDate);
    return bySurveyDate !== 0
      ? bySurveyDate
      : right.createdAt.localeCompare(left.createdAt);
  });
}
