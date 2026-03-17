import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import B2Page from "../pages/B2Page";

vi.mock("../hooks/useDataset", () => ({
  useDataset: () => ({
    status: "success",
    data: {
      rows: [
        {
          id: "row-1",
          dimensions: {
            deptName: "Department A",
            expenseClass: "Capital Outlays",
            objectExpenditure: "Infrastructure Outlay",
            appropType: "None",
          },
          valuesByYear: {
            "2024": 100,
            "2025": 300,
            "2026": 500,
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
            deptName: "Department B",
            expenseClass: "Maintenance and Other Operating Services",
            objectExpenditure: "Professional Services",
            appropType: "None",
          },
          valuesByYear: {
            "2024": 50,
            "2025": 250,
            "2026": 350,
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
            deptName: "Department C",
            expenseClass: "Other Benefits",
            objectExpenditure: "Terminal Leave",
            appropType: "None",
          },
          valuesByYear: {
            "2024": 75,
            "2025": 200,
            "2026": 300,
          },
          metrics: {},
          meta: {
            pageNo: "3",
            source: {},
          },
        },
      ],
      dimensionFields: [
        { key: "deptName", label: "Department" },
        { key: "expenseClass", label: "Expense Class" },
        { key: "objectExpenditure", label: "Object Expenditure" },
        { key: "appropType", label: "Appropriation Type" },
      ],
    },
  }),
}));

describe("B2Page", () => {
  beforeEach(() => {
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  it("renders the custom B.2 layout without crashing", () => {
    render(
      <B2Page
        page={{
          id: "B.2",
          navLabel: "Obligations by Object of Expenditures by Department/Special Purpose Fund (B.2)",
          csvFile: "B2.csv",
          supportsDownload: true,
          viewConfig: {
            tableDimensionKeys: ["deptName", "expenseClass", "objectExpenditure", "appropType"],
            searchDimensionKeys: ["deptName", "expenseClass", "objectExpenditure", "appropType"],
            searchPlaceholder: "Search department, class, object, type...",
          },
        }}
        selectedYears={["2025", "2026"]}
      />
    );

    expect(screen.getByText("Obligations by Object of Expenditures by Department/Special Purpose Fund (B.2)")).toBeInTheDocument();
    expect(screen.getByText("Split by Department")).toBeInTheDocument();
    expect(screen.getByText("Top 10 Object Expenditures")).toBeInTheDocument();
    expect(screen.getByText("Biggest Movers by Department")).toBeInTheDocument();
  });
});
