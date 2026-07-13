import { describe, expect, it } from "vitest";
import {
  buildPdfArchiveName,
  getPdfSelectionIssue,
  maxPdfUploadSizeBytes
} from "../src/experiment/pdfArchive";

describe("PDF archive selection", () => {
  it("builds the archive name from the survey date", () => {
    expect(buildPdfArchiveName("2026-05-17")).toBe("20260517_анкеты.pdf");
  });

  it("accepts PDF files even when a mobile browser omits the MIME type", () => {
    expect(getPdfSelectionIssue({ name: "анкеты.PDF", size: 1024, type: "" })).toBeNull();
    expect(getPdfSelectionIssue({ name: "scan", size: 1024, type: "application/x-pdf" })).toBeNull();
  });

  it("rejects empty, oversized, and unrelated files before upload", () => {
    expect(getPdfSelectionIssue({ name: "scan.pdf", size: 0, type: "application/pdf" })).toBe("empty");
    expect(
      getPdfSelectionIssue({
        name: "scan.pdf",
        size: maxPdfUploadSizeBytes + 1,
        type: "application/pdf"
      })
    ).toBe("too_large");
    expect(getPdfSelectionIssue({ name: "scan.jpg", size: 1024, type: "image/jpeg" })).toBe("wrong_type");
  });
});
