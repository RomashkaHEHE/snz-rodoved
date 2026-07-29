export function resolveSegmentedKeyboardIndex(
  key: string,
  currentIndex: number,
  optionCount: number
): number | null {
  if (optionCount <= 0 || currentIndex < 0 || currentIndex >= optionCount) {
    return null;
  }

  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return optionCount - 1;
  }

  if (key === "ArrowLeft" || key === "ArrowUp") {
    return (currentIndex - 1 + optionCount) % optionCount;
  }

  if (key === "ArrowRight" || key === "ArrowDown") {
    return (currentIndex + 1) % optionCount;
  }

  return null;
}
