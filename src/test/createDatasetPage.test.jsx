import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDatasetPage } from "../pages/createDatasetPage";

vi.mock("../hooks/useDataset", () => ({
  useDataset: () => ({
    status: "success",
    data: {
      rows: [],
      dimensionFields: [],
    },
  }),
}));

function Template({ searchQuery, onSearchChange }) {
  return (
    <div>
      <label htmlFor="page-search">Search</label>
      <input
        id="page-search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div data-testid="search-value">{searchQuery}</div>
    </div>
  );
}

const DatasetPage = createDatasetPage({
  template: Template,
  buildViewModel: () => ({ ok: true }),
});

describe("createDatasetPage", () => {
  it("resets the search query when the active page changes", () => {
    const { rerender } = render(
      <DatasetPage
        page={{
          id: "B.8",
          navLabel: "B.8",
          csvFile: "B8.csv",
          supportsDownload: true,
        }}
        selectedYears={["2025"]}
      />
    );

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "local government" },
    });

    expect(screen.getByTestId("search-value")).toHaveTextContent("local government");

    rerender(
      <DatasetPage
        page={{
          id: "B.5.b",
          navLabel: "B.5.b",
          csvFile: "B5b.csv",
          supportsDownload: true,
        }}
        selectedYears={["2025"]}
      />
    );

    expect(screen.getByTestId("search-value")).toHaveTextContent("");
  });
});
