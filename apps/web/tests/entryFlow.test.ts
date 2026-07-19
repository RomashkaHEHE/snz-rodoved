import { describe, expect, it } from "vitest";
import { shouldAutoAdvanceEntryQuestion } from "../src/experiment/entryFlow";

describe("mobile paper-entry flow", () => {
  it("advances after ordinary answers", () => {
    expect(shouldAutoAdvanceEntryQuestion("q4", "yes", false)).toBe(true);
    expect(shouldAutoAdvanceEntryQuestion("q7", "no", false)).toBe(true);
    expect(shouldAutoAdvanceEntryQuestion("q12", "unknown", false)).toBe(true);
  });

  it("waits when a positive answer needs follow-up fields", () => {
    expect(shouldAutoAdvanceEntryQuestion("q11", "yes", false)).toBe(false);
    expect(shouldAutoAdvanceEntryQuestion("q16", "yes", false)).toBe(false);
    expect(shouldAutoAdvanceEntryQuestion("q11", "no", false)).toBe(true);
  });

  it("never advances past the final step", () => {
    expect(shouldAutoAdvanceEntryQuestion("q16", "no", true)).toBe(false);
    expect(shouldAutoAdvanceEntryQuestion("q16", "unknown", true)).toBe(false);
  });

  it("advances from q16 to the separate paper-consent step", () => {
    expect(shouldAutoAdvanceEntryQuestion("q16", "no", false)).toBe(true);
    expect(shouldAutoAdvanceEntryQuestion("q16", "unknown", false)).toBe(true);
    expect(shouldAutoAdvanceEntryQuestion("q16", "yes", false)).toBe(false);
  });
});
