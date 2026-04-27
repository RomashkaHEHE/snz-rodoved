import { describe, expect, it } from "vitest";
import {
  answerQuestionIds,
  surveyResponseInputSchema,
  warDetailQuickValues
} from "../src/index.js";

describe("survey response schema", () => {
  it("accepts unknown answers for unreadable paper fields", () => {
    const parsed = surveyResponseInputSchema.parse({
      surveyDate: "2026-04-27",
      gender: "female",
      ageGroup: "over_40",
      residence: "snezhinsk",
      q4: "unknown",
      q5: "yes",
      q6: "no",
      q7: "unknown",
      q8: "yes",
      q9: "no",
      q10: "unknown",
      q11: "yes",
      q11WarDetails: "ВОв",
      q12: "yes",
      q13: "no",
      q14: "unknown",
      q15: "yes",
      q16: "yes"
    });

    expect(parsed.q4).toBe("unknown");
    expect(parsed.q11WarDetails).toBe("ВОв");
  });

  it("keeps questions 7 and 8 as separate fields", () => {
    expect(answerQuestionIds).toContain("q7");
    expect(answerQuestionIds).toContain("q8");
  });

  it("contains the paper quick value for the war details dash", () => {
    expect(warDetailQuickValues).toContain("—");
  });
});
