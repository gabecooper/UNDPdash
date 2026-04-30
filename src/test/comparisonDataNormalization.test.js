import { describe, expect, it } from "vitest";
import {
  normalizeClimateComparisonRows,
  normalizeComparisonRows,
  normalizeDepartmentComparisonRows,
} from "../pages/ComparisonPage";

describe("comparison data normalization", () => {
  it("expands wide B8 department rows into expense-class rows", () => {
    const rows = [
      {
        Dept_Name: "Department of Agriculture",
        "2024_Actual_Personnel_Services": "7489189",
        "2024_Actual_Maintenance_and_Other_Operating_Expenses": "73822611",
        "2024_Actual_Capital_Outlays_and_Net_Lending": "30150528",
        "2024_Actual_Financial_Expenses": "0",
        "2025_Program_Personnel_Services": "6550389",
        "2025_Program_Maintenance_and_Other_Operating_Expenses": "60027369",
        "2025_Program_Capital_Outlays_and_Net_Lending": "58864845",
        "2025_Program_Financial_Expenses": "0",
        "2026_GAA_Personnel_Services": "7640074",
        "2026_GAA_Maintenance_and_Other_Operating_Expenses": "103325385",
        "2026_GAA_Capital_Outlays_and_Net_Lending": "75547975",
        "2026_GAA_Financial_Expenses": "0",
        Page_No: "1",
      },
    ];

    const normalizedRows = normalizeDepartmentComparisonRows(rows);

    expect(normalizedRows).toHaveLength(4);
    expect(normalizedRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Dept_Name: "Department of Agriculture",
          Expense_Class: "Personnel Services",
          "2024_Actual": "7489189",
          "2025_Program": "6550389",
          "2026_GAA": "7640074",
        }),
        expect.objectContaining({
          Dept_Name: "Department of Agriculture",
          Expense_Class: "Capital Outlays and Net Lending",
          "2024_Actual": "30150528",
          "2025_Program": "58864845",
          "2026_GAA": "75547975",
        }),
      ]),
    );
  });

  it("expands climate rows into adaptation and mitigation comparisons while skipping aggregate totals", () => {
    const rows = [
      {
        Department_Special_Purpose_Fund_Name: "DEPARTMENTS (Total)",
        "2024_Actual_CC_Expenditure_Adaptation": "452542181",
        "2024_Actual_CC_Expenditure_Mitigation": "106806823",
        "2025_GAA_CC_Expenditure_Adaptation": "1100363082",
        "2025_GAA_CC_Expenditure_Mitigation": "28715145",
        "2026_GAA_CC_Expenditure_Adaptation": "553868639",
        "2026_GAA_CC_Expenditure_Mitigation": "60461078",
      },
      {
        Department_Special_Purpose_Fund_Name: "Department of Agriculture",
        "2024_Actual_CC_Expenditure_Adaptation": "14729339",
        "2024_Actual_CC_Expenditure_Mitigation": "2109289",
        "2025_GAA_CC_Expenditure_Adaptation": "46630516",
        "2025_GAA_CC_Expenditure_Mitigation": "2046475",
        "2026_GAA_CC_Expenditure_Adaptation": "58509167",
        "2026_GAA_CC_Expenditure_Mitigation": "420754",
      },
      {
        Department_Special_Purpose_Fund_Name: "Department of Agrarian Reform",
        "2024_Actual_CC_Expenditure_Adaptation": "403521",
        "2024_Actual_CC_Expenditure_Mitigation": "",
        "2025_GAA_CC_Expenditure_Adaptation": "436901",
        "2025_GAA_CC_Expenditure_Mitigation": "",
        "2026_GAA_CC_Expenditure_Adaptation": "443853",
        "2026_GAA_CC_Expenditure_Mitigation": "",
      },
    ];

    const normalizedRows = normalizeClimateComparisonRows(rows);

    expect(normalizedRows).toHaveLength(3);
    expect(normalizedRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Department_Special_Purpose_Fund_Name: "Department of Agriculture",
          Climate_Typology: "Adaptation",
          "2025_GAA_CC": "46630516",
          "2026_GAA_CC": "58509167",
        }),
        expect.objectContaining({
          Department_Special_Purpose_Fund_Name: "Department of Agriculture",
          Climate_Typology: "Mitigation",
          "2024_Actual_CC": "2109289",
          "2026_GAA_CC": "420754",
        }),
        expect.objectContaining({
          Department_Special_Purpose_Fund_Name: "Department of Agrarian Reform",
          Climate_Typology: "Adaptation",
          "2024_Actual_CC": "403521",
          "2026_GAA_CC": "443853",
        }),
      ]),
    );
    expect(
      normalizedRows.some((row) => row.Department_Special_Purpose_Fund_Name === "DEPARTMENTS (Total)")
    ).toBe(false);
  });

  it("only normalizes files that provide a row adapter", () => {
    const rows = [{ Region_Name: "NCR", Category: "Roads", "2026_GAA_Amount": "100" }];

    expect(normalizeComparisonRows(rows, {})).toBe(rows);
    expect(
      normalizeComparisonRows(
        [
          {
            Dept_Name: "Department of Agriculture",
            "2024_Actual_Personnel_Services": "1",
            "2024_Actual_Maintenance_and_Other_Operating_Expenses": "2",
            "2024_Actual_Capital_Outlays_and_Net_Lending": "3",
            "2024_Actual_Financial_Expenses": "4",
            "2025_Program_Personnel_Services": "5",
            "2025_Program_Maintenance_and_Other_Operating_Expenses": "6",
            "2025_Program_Capital_Outlays_and_Net_Lending": "7",
            "2025_Program_Financial_Expenses": "8",
            "2026_GAA_Personnel_Services": "9",
            "2026_GAA_Maintenance_and_Other_Operating_Expenses": "10",
            "2026_GAA_Capital_Outlays_and_Net_Lending": "11",
            "2026_GAA_Financial_Expenses": "12",
          },
        ],
        { rowAdapter: normalizeDepartmentComparisonRows },
      )
    ).toHaveLength(4);
  });
});
