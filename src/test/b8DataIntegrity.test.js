import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCsv } from "../data/csv";

describe("B8 dataset integrity", () => {
  it("keeps ALGU 2025 summary values aligned with the agency breakdown data", () => {
    const b8Rows = parseCsv(fs.readFileSync("new_csv/B8.csv", "utf8"));
    const alguRows = b8Rows.filter((row) => row.Dept_Name === "Allocations to Local Government Units (ALGU)");

    expect(alguRows).toEqual([
      expect.objectContaining({
        Expense_Class: "Personnel Services",
        "2025_Program": "68831",
      }),
      expect.objectContaining({
        Expense_Class: "Maintenance and Other Operating Expenses",
        "2025_Program": "1188733308",
      }),
      expect.objectContaining({
        Expense_Class: "Capital Outlays",
        "2025_Program": "5888477",
      }),
    ]);
  });
});
