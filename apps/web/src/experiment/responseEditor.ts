import { isValidContactPhone } from "@snz-rodoved/shared";

export type ResponseEditorSource = "online" | "paper";

interface ContactDraft {
  contactName?: string;
  contactPhone?: string;
  q16: "yes" | "no" | "unknown";
}

interface SearchDraft {
  freeText?: string;
  researchPeriodEnd?: number;
  researchPeriodStart?: number;
  researchTerritory?: string;
}

export function requiresResponseContacts(source: ResponseEditorSource): boolean {
  return source === "online";
}

export function hasMissingRequiredResponseContacts(
  source: ResponseEditorSource,
  draft: ContactDraft
): boolean {
  return (
    requiresResponseContacts(source) &&
    draft.q16 === "yes" &&
    (!draft.contactName?.trim() || !draft.contactPhone?.trim() || !isValidContactPhone(draft.contactPhone))
  );
}

export function shouldShowResponseSearchFields(
  source: ResponseEditorSource,
  draft: SearchDraft
): boolean {
  return (
    source === "online" ||
    Boolean(
      draft.researchTerritory ||
        draft.researchPeriodStart ||
        draft.researchPeriodEnd ||
        draft.freeText
    )
  );
}
