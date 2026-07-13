import { describe, expect, it } from "vitest";
import {
  hasMissingRequiredResponseContacts,
  requiresResponseContacts,
  shouldShowResponseSearchFields
} from "../src/experiment/responseEditor";

describe("response editor policy", () => {
  it("requires contacts only for online responses", () => {
    expect(requiresResponseContacts("online")).toBe(true);
    expect(requiresResponseContacts("paper")).toBe(false);
  });

  it("blocks an online help request with blank contact fields", () => {
    expect(
      hasMissingRequiredResponseContacts("online", {
        contactName: "Анна",
        contactPhone: " ",
        q16: "yes"
      })
    ).toBe(true);
    expect(
      hasMissingRequiredResponseContacts("online", {
        contactName: "Анна",
        contactPhone: "12345",
        q16: "yes"
      })
    ).toBe(true);
    expect(
      hasMissingRequiredResponseContacts("online", {
        contactName: "Анна",
        contactPhone: "+7 900 000-00-00",
        q16: "yes"
      })
    ).toBe(false);
  });

  it("keeps contacts optional for paper and non-help responses", () => {
    expect(hasMissingRequiredResponseContacts("paper", { q16: "yes" })).toBe(false);
    expect(hasMissingRequiredResponseContacts("online", { q16: "no" })).toBe(false);
  });

  it("shows search fields for online rows or preserved paper details", () => {
    expect(shouldShowResponseSearchFields("online", {})).toBe(true);
    expect(shouldShowResponseSearchFields("paper", {})).toBe(false);
    expect(shouldShowResponseSearchFields("paper", { researchTerritory: "Урал" })).toBe(true);
  });
});
