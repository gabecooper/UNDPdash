import { describe, expect, it } from "vitest";
import { buildA5ViewModel } from "../pages/viewModels/buildA5ViewModel";

describe("buildA5ViewModel", () => {
  it("combines single-row A.5 sectors into one shared breakdown chart", () => {
    const dataset = {
      rows: [
        {
          id: "1",
          dimensions: {
            sectorName: "ECONOMIC SERVICES",
            subSectorName: "Agriculture",
            entityType: "Agriculture",
          },
          valuesByYear: { "2024": 80, "2025": 120, "2026": 160 },
          metrics: {},
          meta: { pageNo: "1" },
        },
        {
          id: "2",
          dimensions: {
            sectorName: "ECONOMIC SERVICES",
            subSectorName: "Trade and Industry",
            entityType: "None",
          },
          valuesByYear: { "2024": 40, "2025": 60, "2026": 90 },
          metrics: {},
          meta: { pageNo: "1" },
        },
        {
          id: "3",
          dimensions: {
            sectorName: "SOCIAL SERVICES",
            subSectorName: "Health",
            entityType: "None",
          },
          valuesByYear: { "2024": 100, "2025": 140, "2026": 210 },
          metrics: {},
          meta: { pageNo: "1" },
        },
        {
          id: "4",
          dimensions: {
            sectorName: "DEFENSE",
            subSectorName: "Domestic Security",
            entityType: "None",
          },
          valuesByYear: { "2024": 75, "2025": 80, "2026": 95 },
          metrics: {},
          meta: { pageNo: "1" },
        },
        {
          id: "5",
          dimensions: {
            sectorName: "GENERAL PUBLIC SERVICES",
            subSectorName: "General Administration",
            entityType: "None",
          },
          valuesByYear: { "2024": 120, "2025": 150, "2026": 180 },
          metrics: {},
          meta: { pageNo: "1" },
        },
        {
          id: "6",
          dimensions: {
            sectorName: "INTEREST PAYMENTS",
            subSectorName: "None",
            entityType: "None",
          },
          valuesByYear: { "2024": 200, "2025": 220, "2026": 260 },
          metrics: {},
          meta: { pageNo: "1" },
        },
      ],
      dimensionFields: [
        { key: "sectorName", label: "Sector Name" },
        { key: "subSectorName", label: "Subsector Name" },
        { key: "entityType", label: "Entity Type" },
      ],
    };
    const page = {
      id: "A.5",
      viewConfig: {
        tableDimensionKeys: ["sectorName", "subSectorName", "entityType"],
        searchDimensionKeys: ["sectorName", "subSectorName", "entityType"],
      },
    };

    const viewModel = buildA5ViewModel({
      dataset,
      page,
      selectedYears: ["2025", "2026"],
      searchQuery: "",
    });

    expect(viewModel.categoryCharts.map((chart) => chart.title)).toEqual([
      "Economic Services Breakdown",
      "Single-row Sector Breakdowns",
    ]);

    expect(viewModel.categoryCharts[0].data.map((item) => item.name)).toEqual([
      "Agriculture",
      "Trade and Industry",
    ]);
    expect(viewModel.categoryCharts[1].note).toBe("Each bar is 1 source row in Table A.5");
    expect(viewModel.categoryCharts[1].data).toEqual([
      expect.objectContaining({
        name: "Social Services",
        selectedValue: 210,
      }),
      expect.objectContaining({
        name: "Defense",
        selectedValue: 95,
      }),
      expect.objectContaining({
        name: "General Public Services",
        selectedValue: 180,
      }),
      expect.objectContaining({
        name: "Interest Payments & Financial Services",
        selectedValue: 260,
      }),
    ]);
  });
});
