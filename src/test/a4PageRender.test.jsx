import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import A4Page from "../pages/A4Page";

vi.mock("../hooks/useDataset", () => ({
  useDataset: () => ({
    status: "success",
    data: {
      years: ["2024", "2025", "2026"],
      rows: [
        {
          id: "row-1",
          dimensions: {
            dept: "Department of Agriculture",
            agency: "Office of the Secretary",
            appropriationType: "New General",
            category: "Buildings",
            itemName: "DA Main Building",
          },
          valuesByYear: {
            "2024": 100,
            "2025": 200,
            "2026": 300,
          },
          metrics: {},
          meta: {
            pageNo: "3",
            source: {},
            yearBreakdowns: {
              "2024": { nG: 100, gOCC: 0, lGU: 0, total: 100 },
              "2025": { nG: 200, gOCC: 0, lGU: 0, total: 200 },
              "2026": { nG: 300, gOCC: 0, lGU: 0, total: 300 },
            },
          },
        },
        {
          id: "row-2",
          dimensions: {
            dept: "Department of Agriculture",
            agency: "Bureau of Fisheries and Aquatic Resources",
            appropriationType: "Continuing",
            category: "Infrastructure",
            itemName: "BFAR Port Upgrade",
          },
          valuesByYear: {
            "2024": 50,
            "2025": 80,
            "2026": 120,
          },
          metrics: {},
          meta: {
            pageNo: "4",
            source: {},
            yearBreakdowns: {
              "2024": { nG: 50, gOCC: 0, lGU: 0, total: 50 },
              "2025": { nG: 80, gOCC: 0, lGU: 0, total: 80 },
              "2026": { nG: 120, gOCC: 0, lGU: 0, total: 120 },
            },
          },
        },
        {
          id: "row-3",
          dimensions: {
            dept: "Budgetary Support to Government Corporations",
            agency: "National Housing Authority",
            appropriationType: "New General",
            category: "Budgetary Support to Government-Owned or Controlled Corporations",
            itemName: "GOCC Subsidy",
          },
          valuesByYear: {
            "2024": 0,
            "2025": 40,
            "2026": 0,
          },
          metrics: {},
          meta: {
            pageNo: "108",
            source: {},
            yearBreakdowns: {
              "2024": { nG: 0, gOCC: 0, lGU: 0, total: 0 },
              "2025": { nG: 0, gOCC: 40, lGU: 0, total: 40 },
              "2026": { nG: 0, gOCC: 0, lGU: 0, total: 0 },
            },
          },
        },
        {
          id: "row-4",
          dimensions: {
            dept: "Department of Education",
            agency: "Early Childhood Care and Development Council",
            appropriationType: "New General",
            category: "Assistance to Local Government Units",
            itemName: "Financial Assistance to Local Government Units",
          },
          valuesByYear: {
            "2024": 0,
            "2025": 25,
            "2026": 0,
          },
          metrics: {},
          meta: {
            pageNo: "113",
            source: {},
            yearBreakdowns: {
              "2024": { nG: 0, gOCC: 0, lGU: 0, total: 0 },
              "2025": { nG: 0, gOCC: 0, lGU: 25, total: 25 },
              "2026": { nG: 0, gOCC: 0, lGU: 0, total: 0 },
            },
          },
        },
      ],
      dimensionFields: [
        { key: "dept", label: "Department" },
        { key: "agency", label: "Agency" },
        { key: "appropriationType", label: "Type" },
        { key: "category", label: "Category" },
        { key: "itemName", label: "Item" },
      ],
      yearBreakdownFields: {
        "2024": [
          { key: "nG", label: "NG", source: "2024_Actual_NG" },
          { key: "gOCC", label: "GOCC", source: "2024_Actual_GOCC" },
          { key: "lGU", label: "LGU", source: "2024_Actual_LGU" },
          { key: "total", label: "Total", source: "2024_Actual_TOTAL", isTotal: true },
        ],
        "2025": [
          { key: "nG", label: "NG", source: "2025_Program_NG" },
          { key: "gOCC", label: "GOCC", source: "2025_Program_GOCC" },
          { key: "lGU", label: "LGU", source: "2025_Program_LGU" },
          { key: "total", label: "Total", source: "2025_Program_TOTAL", isTotal: true },
        ],
        "2026": [
          { key: "nG", label: "NG", source: "2026_GAA_NG" },
          { key: "gOCC", label: "GOCC", source: "2026_GAA_GOCC" },
          { key: "lGU", label: "LGU", source: "2026_GAA_LGU" },
          { key: "total", label: "Total", source: "2026_GAA_TOTAL", isTotal: true },
        ],
      },
      audit: {
        headers: [],
        preferredValueFields: {
          "2024": "2024_Actual_TOTAL",
          "2025": "2025_Program_TOTAL",
          "2026": "2026_GAA_TOTAL",
        },
      },
    },
  }),
}));

describe("A4Page", () => {
  beforeEach(() => {
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  it("renders the updated A.4 layout without the PDF preview or top agencies chart", () => {
    render(
      <A4Page
        page={{
          id: "A.4",
          navLabel: "Public Sector Infrastructure Budget (A.4)",
          csvFile: "A4.csv",
          supportsDownload: true,
        }}
        selectedYears={["2025"]}
      />
    );

    expect(screen.getByText("Public Sector Infrastructure Budget (A.4)")).toBeInTheDocument();
    expect(screen.getByText("2025 Total Spending")).toBeInTheDocument();
    expect(screen.getByText("NG Total")).toBeInTheDocument();
    expect(screen.getByText("GOCC Total")).toBeInTheDocument();
    expect(screen.getByText("LGU Total")).toBeInTheDocument();
    expect(screen.getByText("New General Appropriations")).toBeInTheDocument();
    expect(screen.getAllByText("Expenditure by Department").length).toBeGreaterThan(0);
    expect(screen.getByText("Clear Filters")).toBeInTheDocument();
    expect(screen.queryByText("PDF Structure Preview")).not.toBeInTheDocument();
    expect(screen.queryByText("Top 10 Agencies")).not.toBeInTheDocument();
  });

  it("filters the table through the searchable department and agency dropdowns", () => {
    render(
      <A4Page
        page={{
          id: "A.4",
          navLabel: "Public Sector Infrastructure Budget (A.4)",
          csvFile: "A4.csv",
          supportsDownload: true,
        }}
        selectedYears={["2025"]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Department: Select a department" }));
    fireEvent.change(screen.getByLabelText("Search department"), { target: { value: "agri" } });
    fireEvent.click(screen.getByRole("button", { name: /Department of Agriculture/ }));

    fireEvent.click(screen.getByRole("button", { name: "Agency: Select one or more agencies" }));
    fireEvent.change(screen.getByLabelText("Search agency"), { target: { value: "secretary" } });
    fireEvent.click(screen.getByRole("button", { name: /Office of the Secretary/ }));

    expect(screen.getByText("DA Main Building")).toBeInTheDocument();
    expect(screen.queryByText("BFAR Port Upgrade")).not.toBeInTheDocument();
  });
});
