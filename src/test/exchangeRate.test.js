import { describe, expect, it } from "vitest";
import { extractPhpPerUsdRate } from "../hooks/useExchangeRate";

describe("extractPhpPerUsdRate", () => {
  it("derives PHP per USD from EUR-based API rates", () => {
    expect(extractPhpPerUsdRate({
      rates: {
        PHP: 63.12,
        USD: 1.05,
      },
    })).toBeCloseTo(60.1142857143);
  });

  it("returns null when the payload is incomplete", () => {
    expect(extractPhpPerUsdRate({ rates: { PHP: 63.12 } })).toBeNull();
  });
});
