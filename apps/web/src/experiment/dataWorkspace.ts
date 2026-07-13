export const dataModes = ["contacts", "rows", "pdf", "charts"] as const;
export type DataMode = (typeof dataModes)[number];

export const defaultDataMode: DataMode = "contacts";
export const dataPageSize = 20;
export const surveyDateDisplayLimit = 8;

export interface SurveyDatePoint {
  date: string;
  online: number;
  paper: number;
  total: number;
}

interface SurveyDateResponse {
  source: "online" | "paper";
  surveyDate: string;
}

export function readDataMode(search: string): DataMode {
  const value = new URLSearchParams(search).get("view");
  return dataModes.includes(value as DataMode) ? (value as DataMode) : defaultDataMode;
}

export function setDataModeSearchParam(params: URLSearchParams, mode: DataMode): void {
  if (mode === defaultDataMode) {
    params.delete("view");
    return;
  }

  params.set("view", mode);
}

export function advanceVisibleCount(current: number, total: number, pageSize = dataPageSize): number {
  return Math.min(total, current + pageSize);
}

export function buildSurveyDateSeries(responses: SurveyDateResponse[]): SurveyDatePoint[] {
  const grouped = new Map<string, SurveyDatePoint>();

  responses.forEach((response) => {
    const point = grouped.get(response.surveyDate) ?? {
      date: response.surveyDate,
      online: 0,
      paper: 0,
      total: 0
    };

    point[response.source] += 1;
    point.total += 1;
    grouped.set(response.surveyDate, point);
  });

  return [...grouped.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function selectRecentSurveyDates(
  series: SurveyDatePoint[],
  limit = surveyDateDisplayLimit
): SurveyDatePoint[] {
  if (limit <= 0) {
    return [];
  }

  return series.slice(-limit);
}
