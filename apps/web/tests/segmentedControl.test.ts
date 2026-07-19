import { describe, expect, it } from "vitest";
import { resolveSegmentedKeyboardIndex } from "../src/experiment/segmentedControl";

describe("segmented control keyboard navigation", () => {
  it("moves between options and wraps at both ends", () => {
    expect(resolveSegmentedKeyboardIndex("ArrowRight", 0, 3)).toBe(1);
    expect(resolveSegmentedKeyboardIndex("ArrowDown", 2, 3)).toBe(0);
    expect(resolveSegmentedKeyboardIndex("ArrowLeft", 0, 3)).toBe(2);
    expect(resolveSegmentedKeyboardIndex("ArrowUp", 1, 3)).toBe(0);
  });

  it("supports direct first and last option navigation", () => {
    expect(resolveSegmentedKeyboardIndex("Home", 2, 3)).toBe(0);
    expect(resolveSegmentedKeyboardIndex("End", 0, 3)).toBe(2);
  });

  it("ignores unrelated keys and invalid option positions", () => {
    expect(resolveSegmentedKeyboardIndex("Tab", 1, 3)).toBeNull();
    expect(resolveSegmentedKeyboardIndex("ArrowRight", -1, 3)).toBeNull();
    expect(resolveSegmentedKeyboardIndex("ArrowRight", 0, 0)).toBeNull();
  });
});
