import { describe, expect, it } from "vitest";
import { buildMultiYearSummaryViewModel } from "../pages/viewModels/buildMultiYearSummaryViewModel";
import { buildSingleYearRegionalViewModel } from "../pages/viewModels/buildSingleYearRegionalViewModel";

describe("summary view model overrides", () => {
  it("builds the consolidated COFOG page with headline KPIs and department drilldown metadata", () => {
    const dataset = {
      rows: [
        {
          id: "1",
          dimensions: {
            cofogCategory: "GENERAL PUBLIC SERVICES",
            deptName: "Department A",
            agencyName: "Agency A",
            itemName: "Operations",
          },
          valuesByYear: { "2024": 0, "2025": 100, "2026": 110 },
          meta: { pageNo: "1" },
        },
        {
          id: "2",
          dimensions: {
            cofogCategory: "DEFENSE",
            deptName: "Department B",
            agencyName: "Agency B",
            itemName: "Readiness",
          },
          valuesByYear: { "2024": 0, "2025": 80, "2026": 90 },
          meta: { pageNo: "1" },
        },
        {
          id: "3",
          dimensions: {
            cofogCategory: "HEALTH",
            deptName: "Department C",
            agencyName: "Agency C",
            itemName: "Care",
          },
          valuesByYear: { "2024": 0, "2025": 70, "2026": 75 },
          meta: { pageNo: "1" },
        },
        {
          id: "4",
          dimensions: {
            cofogCategory: "PUBLIC ORDER AND SAFETY",
            deptName: "Department D",
            agencyName: "Agency D",
            itemName: "Patrol",
          },
          valuesByYear: { "2024": 0, "2025": 60, "2026": 65 },
          meta: { pageNo: "1" },
        },
        {
          id: "5",
          dimensions: {
            cofogCategory: "EDUCATION",
            deptName: "Department E",
            agencyName: "Agency E",
            itemName: "Teaching",
          },
          valuesByYear: { "2024": 0, "2025": 50, "2026": 55 },
          meta: { pageNo: "1" },
        },
      ],
      dimensionFields: [
        { key: "cofogCategory", label: "COFOG Category" },
        { key: "deptName", label: "Dept Name" },
        { key: "agencyName", label: "Agency Name" },
        { key: "itemName", label: "Item Name" },
      ],
    };
    const page = {
      id: "B.5.b",
      viewConfig: {
        primaryDimensionKey: "cofogCategory",
        secondaryDimensionKey: "deptName",
        treemapDimensionKey: "cofogCategory",
        groupedDimensionKey: "cofogCategory",
        primaryMovesDimensionKey: "cofogCategory",
        secondaryMovesDimensionKey: "agencyName",
        customKpiMode: "cofogHeadlineTotals",
        tableDimensionKeys: ["cofogCategory", "deptName", "agencyName", "itemName"],
        searchDimensionKeys: ["deptName", "agencyName", "cofogCategory", "itemName"],
        drilldownConfig: {
          primaryKey: "deptName",
          secondaryKey: "agencyName",
          breakdownMode: "dimension",
          breakdownDimensionKey: "cofogCategory",
        },
      },
    };

    const viewModel = buildMultiYearSummaryViewModel({
      dataset,
      page,
      selectedYears: ["2025"],
      searchQuery: "",
    });

    expect(viewModel.kpis.map((kpi) => kpi.title)).toEqual([
      "2025 Total",
      "Defense",
      "Health",
      "Public Order",
      "Education",
      "General Public",
    ]);
    expect(viewModel.treemapData.map((item) => item.name)).toContain("DEFENSE");
    expect(viewModel.groupedData.map((item) => item.name)).toContain("EDUCATION");
    expect(viewModel.drilldown.primaryLabel).toBe("Dept Name");
  });

  it("adds year-breakdown drilldown metadata for the consolidated B.8 page", () => {
    const dataset = {
      yearBreakdownFields: {
        "2025": [
          { key: "personnelServices", label: "Personnel Services", isTotal: false, isPercent: false },
          { key: "capitalOutlays", label: "Capital Outlays", isTotal: false, isPercent: false },
        ],
      },
      rows: [
        {
          id: "1",
          dimensions: {
            deptName: "Department A",
            agencyName: "Agency A",
          },
          valuesByYear: { "2024": 0, "2025": 180, "2026": 200 },
          meta: {
            pageNo: "1",
            yearBreakdowns: {
              "2025": {
                personnelServices: 120,
                capitalOutlays: 60,
              },
            },
          },
        },
        {
          id: "2",
          dimensions: {
            deptName: "Department B",
            agencyName: "Agency B",
          },
          valuesByYear: { "2024": 0, "2025": 140, "2026": 160 },
          meta: {
            pageNo: "1",
            yearBreakdowns: {
              "2025": {
                personnelServices: 90,
                capitalOutlays: 50,
              },
            },
          },
        },
      ],
      dimensionFields: [
        { key: "deptName", label: "Dept Name" },
        { key: "agencyName", label: "Agency Name" },
      ],
    };
    const page = {
      id: "B.8",
      viewConfig: {
        primaryDimensionKey: "deptName",
        secondaryDimensionKey: "agencyName",
        groupedChartMode: "breakdown",
        tableDimensionKeys: ["deptName", "agencyName"],
        searchDimensionKeys: ["deptName", "agencyName"],
        drilldownConfig: {
          primaryKey: "deptName",
          secondaryKey: "agencyName",
          breakdownMode: "yearBreakdown",
        },
      },
    };

    const viewModel = buildMultiYearSummaryViewModel({
      dataset,
      page,
      selectedYears: ["2025"],
      searchQuery: "",
    });

    expect(viewModel.groupedTitle).toBe("2025 Breakdown");
    expect(viewModel.groupedData.map((item) => item.name)).toEqual(["Personnel Services", "Capital Outlays"]);
    expect(viewModel.drilldown.breakdownMode).toBe("yearBreakdown");
    expect(viewModel.drilldown.breakdownFields.map((field) => field.label)).toEqual([
      "Personnel Services",
      "Capital Outlays",
    ]);
  });

  it("allows regional pages to chart by a dedicated grouped dimension", () => {
    const dataset = {
      years: ["2026"],
      rows: [
        {
          id: "1",
          dimensions: {
            category: "Roads",
            itemName: "National roads",
            regionName: "Region I",
          },
          valuesByYear: { "2026": 90 },
          meta: { pageNo: "1" },
        },
        {
          id: "2",
          dimensions: {
            category: "Bridges",
            itemName: "Regional bridges",
            regionName: "Region II",
          },
          valuesByYear: { "2026": 110 },
          meta: { pageNo: "1" },
        },
      ],
      dimensionFields: [
        { key: "category", label: "Category" },
        { key: "itemName", label: "Item Name" },
        { key: "regionName", label: "Region Name" },
      ],
    };
    const page = {
      id: "B.4.c",
      viewConfig: {
        primaryDimensionKey: "regionName",
        secondaryDimensionKey: "category",
        groupedDimensionKey: "regionName",
        tableDimensionKeys: ["category", "itemName", "regionName"],
        searchDimensionKeys: ["category", "itemName", "regionName"],
      },
    };

    const viewModel = buildSingleYearRegionalViewModel({
      dataset,
      page,
      searchQuery: "",
    });

    expect(viewModel.groupedTitle).toBe("Top Region Name");
    expect(viewModel.groupedData.map((item) => item.name)).toEqual(["Region II", "Region I"]);
  });
});
