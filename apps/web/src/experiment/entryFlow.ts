export type EntryFlowAnswer = "yes" | "no" | "unknown";

export function shouldAutoAdvanceEntryQuestion(
  questionId: string,
  answer: EntryFlowAnswer,
  isLastStep: boolean
): boolean {
  if (isLastStep) {
    return false;
  }

  return !(answer === "yes" && (questionId === "q11" || questionId === "q16"));
}
