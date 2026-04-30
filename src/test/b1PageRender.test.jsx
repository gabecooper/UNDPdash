import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import B1Page from "../pages/B1Page";

vi.mock("../hooks/useDataset", () => ({
  useDataset: () => ({
    status: "success",
    data: {
      rows: [
        {
          id: "row-1",
          dimensions: {
            expenseClass: "A. PERSONNEL EXPENSES",
            subExpenseClass: "Permanent Positions",
            itemName: "Basic Salary",
          },
          valuesByYear: {
            "2024": 100,
            "2025": 200,
            "2026": 300,
          },
          metrics: {},
          meta: {
            pageNo: "1",
            source: {},
          },
        },
        {
          id: "row-2",
          dimensions: {
            expenseClass: "B. MAINTENANCE AND OTHER OPERATING EXPENSES",
            subExpenseClass: "Other Maintenance and Operating Expenses",
            itemName: "Donations",
          },
          valuesByYear: {
            "2024": 50,
            "2025": 150,
            "2026": 250,
          },
          metrics: {},
          meta: {
            pageNo: "2",
            source: {},
          },
        },
        {
          id: "row-3",
          dimensions: {
            expenseClass: "II. CAPITAL OUTLAYS",
            subExpenseClass: "Machinery and Equipment Outlay",
            itemName: "Heavy Equipment",
          },
          valuesByYear: {
            "2024": 80,
            "2025": 180,
            "2026": 280,
          },
          metrics: {},
          meta: {
            pageNo: "3",
            source: {},
          },
        },
      ],
      dimensionFields: [
        { key: "expenseClass", label: "Expense Class" },
        { key: "subExpenseClass", label: "Sub Expense Class" },
        { key: "itemName", label: "Item Name" },
      ],
    },
  }),
}));

describe("B1Page", () => {
  beforeEach(() => {
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  it("renders the custom B.1 layout without crashing", () => {
    render(
      <B1Page
        page={{
          id: "B.1",
          navLabel: "Expenditure Program by Object (B.1)",
          csvFile: "B1.csv",
          supportsDownload: true,
          viewConfig: {
            tableDimensionKeys: ["expenseClass", "subExpenseClass", "itemName"],
            searchDimensionKeys: ["expenseClass", "subExpenseClass", "itemName"],
            searchPlaceholder: "Search expense class, sub class, item...",
          },
        }}
        selectedYears={["2025", "2026"]}
      />
    );

    expect(screen.getByText("Expenditure Program by Object (B.1)")).toBeInTheDocument();
    expect(screen.getByText("Split by Sub Expense Class")).toBeInTheDocument();
    expect(screen.getByText("Top 10 Items")).toBeInTheDocument();
    expect(screen.getByText("Biggest Movers by Sub Expense Class")).toBeInTheDocument();
  });
});
