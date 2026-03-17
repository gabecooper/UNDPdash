import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import A5Page from "../pages/A5Page";

vi.mock("../hooks/useDataset", () => ({
  useDataset: () => ({
    status: "success",
    data: {
      rows: [
        {
          id: "row-1",
          dimensions: {
            sectorName: "ECONOMIC SERVICES",
            subSectorName: "Agriculture",
            entityType: "Agriculture",
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
            sectorName: "SOCIAL SERVICES",
            subSectorName: "Health",
            entityType: "None",
          },
          valuesByYear: {
            "2024": 50,
            "2025": 150,
            "2026": 250,
          },
          metrics: {},
          meta: {
            pageNo: "1",
            source: {},
          },
        },
      ],
      dimensionFields: [
        { key: "sectorName", label: "Sector Name" },
        { key: "subSectorName", label: "Subsector Name" },
        { key: "entityType", label: "Entity Type" },
      ],
    },
  }),
}));

describe("A5Page", () => {
  beforeEach(() => {
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  it("renders the custom A.5 layout without crashing", () => {
    render(
      <A5Page
        page={{
          id: "A.5",
          navLabel: "Sectoral Distribution of Public Expenditures (A.5)",
          csvFile: "A5.csv",
          supportsDownload: true,
          viewConfig: {
            tableDimensionKeys: ["sectorName", "subSectorName", "entityType"],
            searchDimensionKeys: ["sectorName", "subSectorName", "entityType"],
            searchPlaceholder: "Search sector, subsector, entity type...",
          },
        }}
        selectedYears={["2025", "2026"]}
      />
    );

    expect(screen.getByText("Sectoral Distribution of Public Expenditures (A.5)")).toBeInTheDocument();
    expect(screen.getByText("Split by Subsector")).toBeInTheDocument();
    expect(screen.getByText("Top 10 Subsectors")).toBeInTheDocument();
    expect(screen.getByText("Biggest Movers by Subsector")).toBeInTheDocument();
  });
});
