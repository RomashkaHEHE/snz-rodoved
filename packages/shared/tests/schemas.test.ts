import { describe, expect, it } from "vitest";
import {
  answerQuestionIds,
  onlineSurveyResponseInputSchema,
  parseSurveyDateFromPdfFileName,
  partialSurveyResponseInputSchema,
  surveyPdfFileNameSchema,
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

  it("accepts online survey search context", () => {
    const parsed = onlineSurveyResponseInputSchema.parse({
      surveyDate: "2026-07-08",
      source: "online",
      gender: "female",
      ageGroup: "over_40",
      residence: "other",
      researchTerritory: "Челябинская область",
      researchPeriodStart: 1850,
      researchPeriodEnd: 1945,
      freeText: "Ищу сведения по фамилии Ивановы",
      contactName: "Алёна",
      contactPhone: "+7 900 000-00-00",
      q4: "unknown",
      q5: "yes",
      q6: "no",
      q7: "yes",
      q8: "yes",
      q9: "yes",
      q10: "unknown",
      q11: "no",
      q11WarDetails: "—",
      q12: "yes",
      q13: "unknown",
      q14: "no",
      q15: "yes",
      q16: "yes"
    });

    expect(parsed.source).toBe("online");
    expect(parsed.researchTerritory).toBe("Челябинская область");
    expect(parsed.researchPeriodStart).toBe(1850);
    expect(parsed.contactName).toBe("Алёна");
    expect(parsed.contactPhone).toBe("+7 900 000-00-00");
  });

  it("rejects a reversed online research period", () => {
    expect(() =>
      onlineSurveyResponseInputSchema.parse({
        surveyDate: "2026-07-08",
        gender: "female",
        ageGroup: "over_40",
        residence: "other",
        researchPeriodStart: 1945,
        researchPeriodEnd: 1850,
        q4: "unknown",
        q5: "unknown",
        q6: "unknown",
        q7: "unknown",
        q8: "unknown",
        q9: "unknown",
        q10: "unknown",
        q11: "unknown",
        q12: "unknown",
        q13: "unknown",
        q14: "unknown",
        q15: "unknown",
        q16: "unknown"
      })
    ).toThrow();
  });

  it("requires contact fields when online respondent asks for help", () => {
    expect(() =>
      onlineSurveyResponseInputSchema.parse({
        surveyDate: "2026-07-08",
        gender: "female",
        ageGroup: "over_40",
        residence: "other",
        q4: "unknown",
        q5: "unknown",
        q6: "unknown",
        q7: "unknown",
        q8: "unknown",
        q9: "unknown",
        q10: "unknown",
        q11: "unknown",
        q12: "unknown",
        q13: "unknown",
        q14: "unknown",
        q15: "unknown",
        q16: "yes"
      })
    ).toThrow();
  });

  it("accepts workspace contact workflow fields for response updates", () => {
    const parsed = partialSurveyResponseInputSchema.parse({
      contactNote: "Перезвонить после мероприятия",
      contactStatus: "in_progress"
    });

    expect(parsed.contactStatus).toBe("in_progress");
    expect(parsed.contactNote).toBe("Перезвонить после мероприятия");
  });

  it("contains the paper quick value for the war details dash", () => {
    expect(warDetailQuickValues).toContain("—");
  });

  it("parses survey PDF file names into survey dates", () => {
    expect(surveyPdfFileNameSchema.parse("20260517_анкеты.pdf")).toBe("20260517_анкеты.pdf");
    expect(parseSurveyDateFromPdfFileName("20260517_анкеты.pdf")).toBe("2026-05-17");
    expect(() => surveyPdfFileNameSchema.parse("2026-05-17.pdf")).toThrow();
    expect(() => surveyPdfFileNameSchema.parse("20261340_анкеты.pdf")).toThrow();
  });
});
