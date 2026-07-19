import type {
  ContactStatus,
  SavedFilterPreset,
  SavedFilterPresetInput,
  SurveyFilters,
  SurveyPdfFile,
  SurveyResponse,
  SurveyResponseInput
} from "@snz-rodoved/shared";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";

export interface LabSession {
  authenticated: boolean;
  role: "workspace" | "admin" | null;
}

export async function getLabSession(): Promise<LabSession> {
  return request<LabSession>("/api/auth/me");
}

export async function loginLabWorkspace(password: string): Promise<LabSession> {
  return request<LabSession>("/api/auth/workspace-login", {
    method: "POST",
    body: JSON.stringify({ password })
  });
}

export async function createLabOnlineResponse(input: SurveyResponseInput): Promise<SurveyResponse> {
  const result = await request<{ response: SurveyResponse }>("/api/public/survey-responses", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.response;
}

export async function listLabResponses(filters: SurveyFilters = {}): Promise<SurveyResponse[]> {
  const result = await request<{ responses: SurveyResponse[] }>(
    `/api/responses${buildFilterQuery(filters)}`
  );
  return result.responses;
}

export async function listLabFilterPresets(): Promise<SavedFilterPreset[]> {
  const result = await request<{ presets: SavedFilterPreset[] }>("/api/filter-presets");
  return result.presets;
}

export async function saveLabFilterPreset(
  input: SavedFilterPresetInput
): Promise<SavedFilterPreset> {
  const result = await request<{ preset: SavedFilterPreset }>("/api/filter-presets", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.preset;
}

export async function deleteLabFilterPreset(id: string): Promise<void> {
  await request<void>(`/api/filter-presets/${id}`, { method: "DELETE" });
}

export async function createLabResponse(input: SurveyResponseInput): Promise<SurveyResponse> {
  const result = await request<{ response: SurveyResponse }>("/api/responses", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.response;
}

export async function createLabFakeResponse(): Promise<SurveyResponse> {
  const result = await request<{ response: SurveyResponse }>("/api/responses/fake", {
    method: "POST"
  });
  return result.response;
}

export async function updateLabResponse(
  id: string,
  input: SurveyResponseInput
): Promise<SurveyResponse> {
  const result = await request<{ response: SurveyResponse }>(`/api/responses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return result.response;
}

export async function updateLabContactWorkflow(
  id: string,
  input: { contactNextDate?: string; contactNote?: string; contactStatus: ContactStatus }
): Promise<SurveyResponse> {
  const result = await request<{ response: SurveyResponse }>(`/api/responses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return result.response;
}

export async function deleteLabResponse(id: string): Promise<void> {
  await request<void>(`/api/responses/${id}`, { method: "DELETE" });
}

export async function deleteLabFakeResponses(): Promise<number> {
  const result = await request<{ deleted: number }>("/api/responses/fake", {
    method: "DELETE"
  });
  return result.deleted;
}

export async function listLabPdfFiles(filters: Pick<SurveyFilters, "dateFrom" | "dateTo"> = {}) {
  const result = await request<{ files: SurveyPdfFile[] }>(
    `/api/pdf-files${buildFilterQuery(filters)}`
  );
  return result.files;
}

export async function uploadLabPdfFile(input: {
  displayName: string;
  file: File;
}): Promise<SurveyPdfFile> {
  const formData = new FormData();
  formData.append("displayName", input.displayName);
  formData.append("file", input.file);

  const result = await request<{ file: SurveyPdfFile }>("/api/pdf-files", {
    method: "POST",
    body: formData
  });
  return result.file;
}

export async function deleteLabPdfFile(id: string): Promise<void> {
  await request<void>(`/api/pdf-files/${id}`, { method: "DELETE" });
}

export function getLabPdfDownloadUrl(id: string): string {
  return `${apiBase}/api/pdf-files/${id}/download`;
}

export async function exportLabResponsesCsv(filters: SurveyFilters = {}): Promise<void> {
  const response = await fetch(`${apiBase}/api/responses/export.csv${buildFilterQuery(filters)}`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "rodoved-test-responses.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: "include",
    headers
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function buildFilterQuery(filters: SurveyFilters | Pick<SurveyFilters, "dateFrom" | "dateTo">): string {
  const params = new URLSearchParams();
  const responseFilters = filters as SurveyFilters;

  setParam(params, "dateFrom", filters.dateFrom);
  setParam(params, "dateTo", filters.dateTo);

  setListParam(params, "source", responseFilters.source);
  setListParam(params, "gender", responseFilters.gender);
  setListParam(params, "ageGroup", responseFilters.ageGroup);
  setListParam(params, "residence", responseFilters.residence);
  setListParam(params, "contactStatus", responseFilters.contactStatus);
  setParam(params, "contactNextFrom", responseFilters.contactNextFrom);
  setParam(params, "contactNextTo", responseFilters.contactNextTo);
  setBooleanParam(params, "contactNextMissing", responseFilters.contactNextMissing);
  setBooleanParam(params, "contactOnly", responseFilters.contactOnly);
  setBooleanParam(params, "helpOnly", responseFilters.helpOnly);
  setParam(params, "query", responseFilters.query);

  if (responseFilters.answerFilters) {
    for (const [questionId, answers] of Object.entries(responseFilters.answerFilters)) {
      setListParam(params, questionId, answers);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function setParam(params: URLSearchParams, key: string, value: string | undefined): void {
  if (value) {
    params.set(key, value);
  }
}

function setListParam(params: URLSearchParams, key: string, value: string[] | undefined): void {
  if (value?.length) {
    params.set(key, value.join(","));
  }
}

function setBooleanParam(params: URLSearchParams, key: string, value: boolean | undefined): void {
  if (value) {
    params.set(key, "true");
  }
}
