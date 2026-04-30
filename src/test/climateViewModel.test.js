import { describe, expect, it } from "vitest";
import { buildClimateViewModel } from "../pages/viewModels/buildClimateViewModel";

describe("buildClimateViewModel", () => {
  it("excludes aggregate department labels from department views and total from climate typologies", () => {
    const dataset = {
      rows: [
        {
          id: "agg-departments",
          dimensions: { deptName: "DEPARTMENTS", climateTypology: "Adaptation" },
          valuesByYear: { "2025": 100, "2026": 110 },
          meta: { pageNo: "1" },
        },
        {
          id: "agg-total",
          dimensions: { deptName: "TOTAL", climateTypology: "Total" },
          valuesByYear: { "2025": 200, "2026": 220 },
          meta: { pageNo: "1" },
        },
        {
          id: "dept-a-adaptation",
          dimensions: { deptName: "Department A", climateTypology: "Adaptation" },
          valuesByYear: { "2025": 30, "2026": 40 },
          meta: { pageNo: "1" },
        },
        {
          id: "dept-a-mitigation",
          dimensions: { deptName: "Department A", climateTypology: "Mitigation" },
          valuesByYear: { "2025": 10, "2026": 20 },
          meta: { pageNo: "1" },
        },
        {
          id: "dept-a-total",
          dimensions: { deptName: "Department A", climateTypology: "Total" },
          valuesByYear: { "2025": 40, "2026": 60 },
          meta: { pageNo: "1" },
        },
        {
          id: "dept-b-adaptation",
          dimensions: { deptName: "Department B", climateTypology: "Adaptation" },
          valuesByYear: { "2025": 25, "2026": 30 },
          meta: { pageNo: "1" },
        },
        {
          id: "dept-b-total",
          dimensions: { deptName: "Department B", climateTypology: "Total" },
          valuesByYear: { "2025": 25, "2026": 30 },
          meta: { pageNo: "1" },
        },
      ],
      dimensionFields: [
        { key: "deptName", label: "Department" },
        { key: "climateTypology", label: "Climate Typology" },
      ],
    };
    const page = {
      id: "B.21",
      viewConfig: {
        primaryDimensionKey: "deptName",
        secondaryDimensionKey: "climateTypology",
        tableDimensionKeys: ["deptName", "climateTypology"],
        searchDimensionKeys: ["deptName", "climateTypology"],
      },
    };

    const viewModel = buildClimateViewModel({
      dataset,
      page,
      selectedYears: ["2025", "2026"],
      searchQuery: "",
    });

    expect(viewModel.primaryChartData.map((item) => item.name)).toEqual(["Department A", "Department B"]);
    expect(viewModel.secondaryChartData.map((item) => item.name)).toEqual(["Adaptation", "Mitigation"]);
    expect(viewModel.tableRows.some((row) => row.dimensions.deptName === "DEPARTMENTS")).toBe(false);
    expect(viewModel.tableRows.some((row) => row.dimensions.deptName === "TOTAL")).toBe(false);
  });
});
