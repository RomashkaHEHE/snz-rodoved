import { describe, expect, it } from "vitest";
import {
  getNextVisibleResponseCount,
  getVisibleResponseBatch,
  responseBatchSize
} from "../src/responseBatch";

describe("response table batching", () => {
  it("mounts only the first response batch", () => {
    const responses = Array.from({ length: responseBatchSize + 5 }, (_, index) => index);
    expect(getVisibleResponseBatch(responses, responseBatchSize)).toHaveLength(responseBatchSize);
  });

  it("reveals another bounded batch without exceeding the total", () => {
    expect(getNextVisibleResponseCount(responseBatchSize, 100)).toBe(responseBatchSize * 2);
    expect(getNextVisibleResponseCount(responseBatchSize, responseBatchSize + 5)).toBe(
      responseBatchSize + 5
    );
  });
});
