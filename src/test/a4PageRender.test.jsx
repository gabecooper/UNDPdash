import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import A4Page from "../pages/A4Page";

vi.mock("../hooks/useDataset", () => ({
  useDataset: () => ({
    status: "success",
    data: {
      rows: [
        {
          id: "row-1",
          dimensions: {
            dept: "Congress",
            agency: "Senate",
            appropriationType: "New General",
            category: "Buildings",
            itemName: "Main Building",
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
      ],
      dimensionFields: [
        { key: "dept", label: "Department" },
        { key: "agency", label: "Agency" },
        { key: "appropriationType", label: "Type" },
        { key: "category", label: "Category" },
        { key: "itemName", label: "Item" },
      ],
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

  it("renders the migrated A.4 template without crashing", () => {
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
    expect(screen.getByText("Top 10 Agencies")).toBeInTheDocument();
  });
});
