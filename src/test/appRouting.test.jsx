import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/pageComponents", () => {
  const MockPage = ({ page, selectedYears = [] }) => (
    <div data-testid="mock-page">
      <span>{page.id}</span>
      <span>{selectedYears.join(",")}</span>
    </div>
  );

  return {
    pageComponents: {
      a4: MockPage,
      a5: MockPage,
      b1: MockPage,
      b2: MockPage,
      multiYearSummary: MockPage,
      climate: MockPage,
      singleYearRegional: MockPage,
      comparison: MockPage,
      datasetIndex: MockPage,
      placeholder: MockPage,
    },
  };
});

describe("App routing", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("updates the route and active page through sidebar navigation", async () => {
    window.history.replaceState({}, "", "/a4");
    const { default: App } = await import("../App");

    render(<App />);

    expect(screen.getByTestId("mock-page")).toHaveTextContent("A.4");
    fireEvent.click(screen.getByRole("link", { name: /Sectoral Distribution of Public Expenditures/i }));

    expect(window.location.pathname).toBe("/a5");
    expect(screen.getByTestId("mock-page")).toHaveTextContent("A.5");
  });

  it("keeps the year selector visible on pages that do not use it", async () => {
    window.history.replaceState({}, "", "/b4c");
    const { default: App } = await import("../App");

    render(<App />);

    expect(screen.getByRole("button", { name: "2024" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2025" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026" })).toBeInTheDocument();
    expect(screen.getByTestId("mock-page")).toHaveTextContent("B.4.c");
  });

  it("preserves the selected years when navigating to a page without year filtering", async () => {
    window.history.replaceState({}, "", "/a4");
    const { default: App } = await import("../App");

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "2026" }));
    fireEvent.click(screen.getByRole("link", { name: /Infrastructure Outlays, Regional Breakdown/i }));

    expect(screen.getByRole("button", { name: "2024" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "2025" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "2026" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("mock-page")).toHaveTextContent("B.4.c");
  });

  it("opens the dataset index from the sidebar action button", async () => {
    window.history.replaceState({}, "", "/a4");
    const { default: App } = await import("../App");

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /View Dataset/i }));

    expect(window.location.pathname).toBe("/datasets");
    expect(screen.getByTestId("mock-page")).toHaveTextContent("datasets");
  });

  it("opens compare from the sidebar action button and keeps the current year selection", async () => {
    window.history.replaceState({}, "", "/a4");
    const { default: App } = await import("../App");

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "2026" }));
    fireEvent.click(screen.getByRole("button", { name: /Compare/i }));

    expect(window.location.pathname).toBe("/comparison");
    expect(screen.getByTestId("mock-page")).toHaveTextContent("comparison");
    expect(screen.getByTestId("mock-page")).toHaveTextContent("2025,2026");
  });
});
