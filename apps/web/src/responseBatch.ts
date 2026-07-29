export const responseBatchSize = 30;

export function getVisibleResponseBatch<T>(responses: T[], visibleCount: number): T[] {
  return responses.slice(0, Math.max(responseBatchSize, visibleCount));
}

export function getNextVisibleResponseCount(
  currentCount: number,
  totalCount: number
): number {
  return Math.min(totalCount, Math.max(responseBatchSize, currentCount) + responseBatchSize);
}
