import { describe, expect, it } from "vitest";
import { buildMultiYearSummaryViewModel } from "../pages/viewModels/buildMultiYearSummaryViewModel";
import { buildSingleYearRegionalViewModel } from "../pages/viewModels/buildSingleYearRegionalViewModel";

describe("summary view model overrides", () => {
  it("builds the COFOG page with custom headline KPIs and subcategory charts", () => {
    const dataset = {
      rows: [
        {
          id: "1",
          dimensions: {
            cofogCategory: "GENERAL PUBLIC SERVICES",
            cofogSubCategory: "Executive Services",
            itemName: "Operations",
          },
          valuesByYear: { "2024": 0, "2025": 100, "2026": 110 },
          meta: { pageNo: "1" },
        },
        {
          id: "2",
          dimensions: {
            cofogCategory: "DEFENSE",
            cofogSubCategory: "Military Defense",
            itemName: "Readiness",
          },
          valuesByYear: { "2024": 0, "2025": 80, "2026": 90 },
          meta: { pageNo: "1" },
        },
        {
          id: "3",
          dimensions: {
            cofogCategory: "HEALTH",
            cofogSubCategory: "Hospital Services",
            itemName: "Care",
          },
          valuesByYear: { "2024": 0, "2025": 70, "2026": 75 },
          meta: { pageNo: "1" },
        },
        {
          id: "4",
          dimensions: {
            cofogCategory: "PUBLIC ORDER AND SAFETY",
            cofogSubCategory: "Police Services",
            itemName: "Patrol",
          },
          valuesByYear: { "2024": 0, "2025": 60, "2026": 65 },
          meta: { pageNo: "1" },
        },
        {
          id: "5",
          dimensions: {
            cofogCategory: "EDUCATION",
            cofogSubCategory: "Basic Education",
            itemName: "Teaching",
          },
          valuesByYear: { "2024": 0, "2025": 50, "2026": 55 },
          meta: { pageNo: "1" },
        },
      ],
      dimensionFields: [
        { key: "cofogCategory", label: "COFOG Category" },
        { key: "cofogSubCategory", label: "COFOG SubCategory" },
        { key: "itemName", label: "Item Name" },
      ],
    };
    const page = {
      id: "B.5.b",
      viewConfig: {
        primaryDimensionKey: "cofogCategory",
        secondaryDimensionKey: "cofogSubCategory",
        treemapDimensionKey: "cofogSubCategory",
        groupedDimensionKey: "cofogSubCategory",
        primaryMovesDimensionKey: "cofogSubCategory",
        secondaryMovesDimensionKey: "cofogCategory",
        customKpiMode: "cofogHeadlineTotals",
        tableDimensionKeys: ["cofogSubCategory", "cofogCategory", "itemName"],
        searchDimensionKeys: ["cofogSubCategory", "cofogCategory", "itemName"],
      },
    };

    const viewModel = buildMultiYearSummaryViewModel({
      dataset,
      page,
      selectedYears: ["2025"],
      searchQuery: "",
    });

    expect(viewModel.kpis.map((kpi) => kpi.title)).toEqual([
      "Selected Total",
      "Defense",
      "Health",
      "Public Order",
      "Education",
      "General Public",
    ]);
    expect(viewModel.treemapData.map((item) => item.name)).toContain("Military Defense");
    expect(viewModel.groupedData.map((item) => item.name)).toContain("Basic Education");
  });

  it("builds B.5.c around departments and largest items instead of COFOG KPIs", () => {
    const dataset = {
      rows: [
        {
          id: "1",
          dimensions: {
            deptName: "Department A",
            agencyName: "Agency A",
            cofogCategory: "DEFENSE",
            itemName: "Item Alpha",
          },
          valuesByYear: { "2024": 0, "2025": 180, "2026": 200 },
          meta: { pageNo: "1" },
        },
        {
          id: "2",
          dimensions: {
            deptName: "Department B",
            agencyName: "Agency B",
            cofogCategory: "HEALTH",
            itemName: "Item Beta",
          },
          valuesByYear: { "2024": 0, "2025": 140, "2026": 160 },
          meta: { pageNo: "1" },
        },
        {
          id: "3",
          dimensions: {
            deptName: "Department A",
            agencyName: "Agency C",
            cofogCategory: "EDUCATION",
            itemName: "Item Gamma",
          },
          valuesByYear: { "2024": 0, "2025": 120, "2026": 130 },
          meta: { pageNo: "1" },
        },
      ],
      dimensionFields: [
        { key: "deptName", label: "Dept Name" },
        { key: "agencyName", label: "Agency Name" },
        { key: "cofogCategory", label: "COFOG Category" },
        { key: "itemName", label: "Item Name" },
      ],
    };
    const page = {
      id: "B.5.c",
      viewConfig: {
        primaryDimensionKey: "deptName",
        secondaryDimensionKey: "agencyName",
        groupedDimensionKey: "deptName",
        secondaryMovesDimensionKey: "agencyName",
        customKpiMode: "largestTwoItems",
        tableDimensionKeys: ["deptName", "agencyName", "cofogCategory", "itemName"],
        searchDimensionKeys: ["deptName", "agencyName", "cofogCategory", "itemName"],
      },
    };

    const viewModel = buildMultiYearSummaryViewModel({
      dataset,
      page,
      selectedYears: ["2025"],
      searchQuery: "",
    });

    expect(viewModel.groupedTitle).toBe("Top Dept Name");
    expect(viewModel.groupedData.map((item) => item.name)).toEqual(["Department A", "Department B"]);
    expect(viewModel.kpis.map((kpi) => kpi.title)).toEqual([
      "Selected Total",
      "Dept Name Groups",
      "Agency Name Groups",
      "Largest Dept Name",
      "Largest Item",
      "Second Largest Item",
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
