import { describe, expect, it } from "vitest";
import { parseCsv, toCamelCase } from "../data/csv";

describe("parseCsv", () => {
  it("handles quoted commas and blank lines", () => {
    const raw = [
      'Name,Value,Note',
      '"Alpha, Beta",42,"Quoted, field"',
      "",
      "Gamma,13,Plain",
    ].join("\n");

    expect(parseCsv(raw)).toEqual([
      {
        Name: "Alpha, Beta",
        Value: "42",
        Note: "Quoted, field",
      },
      {
        Name: "Gamma",
        Value: "13",
        Note: "Plain",
      },
    ]);
  });
});

describe("toCamelCase", () => {
  it("normalizes all-caps acronym headers into predictable camelCase keys", () => {
    expect(toCamelCase("COFOG_Category")).toBe("cofogCategory");
    expect(toCamelCase("COFOG_SubCategory")).toBe("cofogSubCategory");
    expect(toCamelCase("Dept_Name")).toBe("deptName");
  });
});
