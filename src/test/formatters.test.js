import { describe, expect, it } from "vitest";
import { formatMoneyCompact } from "../data/formatters";

describe("formatMoneyCompact", () => {
  it("includes a peso symbol for PHP compact values", () => {
    expect(formatMoneyCompact(1250000, { currencyDisplay: "php" })).toMatch(/^₱/);
  });

  it("includes a dollar symbol for USD compact values", () => {
    expect(formatMoneyCompact(60150000, { currencyDisplay: "usd", exchangeRate: 60.15 })).toMatch(/^\$/);
  });

  it("includes both symbols for dual compact values", () => {
    const value = formatMoneyCompact(60150000, { currencyDisplay: "dual", exchangeRate: 60.15 });
    expect(value).toContain("₱");
    expect(value).toContain("$");
  });

  it("uses the same symbol-rich output for custom-rate mode", () => {
    const value = formatMoneyCompact(60150000, { currencyDisplay: "custom", exchangeRate: 50 });
    expect(value).toContain("₱");
    expect(value).toContain("$");
  });
});
