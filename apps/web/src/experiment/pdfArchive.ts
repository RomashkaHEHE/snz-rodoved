export const maxPdfUploadSizeBytes = 100 * 1024 * 1024;

export type PdfSelectionIssue = "empty" | "too_large" | "wrong_type";

interface PdfCandidate {
  name: string;
  size: number;
  type: string;
}

export function buildPdfArchiveName(surveyDate: string): string {
  return `${surveyDate.replaceAll("-", "")}_анкеты.pdf`;
}

export function getPdfSelectionIssue(file: PdfCandidate): PdfSelectionIssue | null {
  const normalizedName = file.name.trim().toLowerCase();
  const normalizedType = file.type.trim().toLowerCase();

  if (!normalizedName.endsWith(".pdf") && !normalizedType.includes("pdf")) {
    return "wrong_type";
  }

  if (file.size === 0) {
    return "empty";
  }

  if (file.size > maxPdfUploadSizeBytes) {
    return "too_large";
  }

  return null;
}
