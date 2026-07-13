export const dataModes = ["contacts", "rows", "pdf", "charts"] as const;
export type DataMode = (typeof dataModes)[number];

export const defaultDataMode: DataMode = "contacts";
export const dataPageSize = 20;

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
