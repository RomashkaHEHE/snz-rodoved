import type {
  AnalyticsSummary,
  AnswerQuestionId,
  AnswerValue,
  SurveyFilters,
  SurveyPdfFile,
  SurveyResponse,
  SurveyResponseInput
} from "@snz-rodoved/shared";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";

export interface SessionResponse {
  authenticated: boolean;
  role: "workspace" | "admin" | null;
}

export async function getSession(): Promise<SessionResponse> {
  return request<SessionResponse>("/api/auth/me");
}

export async function login(username: string, password: string): Promise<SessionResponse> {
  return request<SessionResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function workspaceLogin(password: string): Promise<SessionResponse> {
  return request<SessionResponse>("/api/auth/workspace-login", {
    method: "POST",
    body: JSON.stringify({ password })
  });
}

export async function logout(): Promise<SessionResponse> {
  return request<SessionResponse>("/api/auth/logout", {
    method: "POST"
  });
}

export async function updatePasswords(input: {
  adminPassword?: string;
  workspacePassword?: string;
}): Promise<{ updated: boolean; persisted: boolean }> {
  return request<{ updated: boolean; persisted: boolean }>("/api/admin/passwords", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function listResponses(filters: SurveyFilters): Promise<SurveyResponse[]> {
  const query = buildFilterQuery(filters);
  const result = await request<{ responses: SurveyResponse[] }>(`/api/responses${query}`);
  return result.responses;
}

export async function createResponse(input: SurveyResponseInput): Promise<SurveyResponse> {
  const result = await request<{ response: SurveyResponse }>("/api/responses", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.response;
}

export async function submitOnlineSurvey(input: SurveyResponseInput): Promise<SurveyResponse> {
  const result = await request<{ response: SurveyResponse }>("/api/public/survey-responses", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return result.response;
}

export async function createFakeResponse(): Promise<SurveyResponse> {
  const result = await request<{ response: SurveyResponse }>("/api/responses/fake", {
    method: "POST"
  });
  return result.response;
}

export async function updateResponse(
  id: string,
  input: SurveyResponseInput
): Promise<SurveyResponse> {
  const result = await request<{ response: SurveyResponse }>(`/api/responses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return result.response;
}

export async function deleteResponse(id: string): Promise<void> {
  await request<void>(`/api/responses/${id}`, {
    method: "DELETE"
  });
}

export async function deleteFakeResponses(): Promise<number> {
  const result = await request<{ deleted: number }>("/api/responses/fake", {
    method: "DELETE"
  });
  return result.deleted;
}

export async function listPdfFiles(filters: SurveyFilters): Promise<SurveyPdfFile[]> {
  const query = buildFilterQuery(filters);
  const result = await request<{ files: SurveyPdfFile[] }>(`/api/pdf-files${query}`);
  return result.files;
}

export async function uploadPdfFile(input: {
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

export async function deletePdfFile(id: string): Promise<void> {
  await request<void>(`/api/pdf-files/${id}`, {
    method: "DELETE"
  });
}

export async function downloadPdfFile(file: SurveyPdfFile): Promise<void> {
  const response = await fetch(`${apiBase}/api/pdf-files/${file.id}/download`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.displayName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function getAnalyticsSummary(filters: SurveyFilters): Promise<AnalyticsSummary> {
  const query = buildFilterQuery(filters);
  const result = await request<{ summary: AnalyticsSummary }>(`/api/analytics/summary${query}`);
  return result.summary;
}

export async function exportResponsesCsv(filters: SurveyFilters): Promise<void> {
  const query = buildFilterQuery(filters);
  const response = await fetch(`${apiBase}/api/responses/export.csv${query}`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "rodoved-responses.csv";
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

function buildFilterQuery(filters: SurveyFilters): string {
  const params = new URLSearchParams();
  setParam(params, "dateFrom", filters.dateFrom);
  setParam(params, "dateTo", filters.dateTo);
  setListParam(params, "source", filters.source);
  setListParam(params, "gender", filters.gender);
  setListParam(params, "ageGroup", filters.ageGroup);
  setListParam(params, "residence", filters.residence);

  for (const [questionId, values] of Object.entries(filters.answerFilters ?? {}) as Array<
    [AnswerQuestionId, AnswerValue[]]
  >) {
    setListParam(params, questionId, values);
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
