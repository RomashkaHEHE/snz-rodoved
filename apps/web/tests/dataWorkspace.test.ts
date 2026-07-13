import { describe, expect, it } from "vitest";
import {
  advanceVisibleCount,
  dataPageSize,
  readDataMode,
  setDataModeSearchParam
} from "../src/experiment/dataWorkspace";

describe("data workspace navigation", () => {
  it("reads supported modes and falls back to contacts", () => {
    expect(readDataMode("?view=rows&source=online")).toBe("rows");
    expect(readDataMode("?view=pdf")).toBe("pdf");
    expect(readDataMode("?view=unknown")).toBe("contacts");
    expect(readDataMode("")).toBe("contacts");
  });

  it("keeps filter parameters while changing the mode", () => {
    const params = new URLSearchParams("source=paper&query=Снежинск");

    setDataModeSearchParam(params, "charts");
    expect(params.get("source")).toBe("paper");
    expect(params.get("query")).toBe("Снежинск");
    expect(params.get("view")).toBe("charts");

    setDataModeSearchParam(params, "contacts");
    expect(params.has("view")).toBe(false);
  });
});

describe("incremental data lists", () => {
  it("advances one page without exceeding the available rows", () => {
    expect(advanceVisibleCount(dataPageSize, 67)).toBe(40);
    expect(advanceVisibleCount(60, 67)).toBe(67);
    expect(advanceVisibleCount(20, 20)).toBe(20);
  });
});
