import { describe, expect, it } from "vitest";
import { buildGroupedSeries, buildMovers, buildTreemapData } from "../data/selectors";

const rows = [
  {
    id: "row-none",
    dimensions: {
      category: "None",
    },
    valuesByYear: {
      "2024": 10,
      "2025": 40,
      "2026": 80,
    },
  },
  {
    id: "row-a",
    dimensions: {
      category: "Alpha",
    },
    valuesByYear: {
      "2024": 30,
      "2025": 120,
      "2026": 150,
    },
  },
  {
    id: "row-b",
    dimensions: {
      category: "Bravo",
    },
    valuesByYear: {
      "2024": 20,
      "2025": 90,
      "2026": 110,
    },
  },
];

describe("chart selectors", () => {
  it('excludes "None" labels from treemap data', () => {
    expect(buildTreemapData(rows, "category", ["2025", "2026"], "2026")).toEqual([
      { name: "Alpha", value: 150, orderValue: 150 },
      { name: "Bravo", value: 110, orderValue: 110 },
    ]);
  });

  it('excludes "None" labels from grouped bar data', () => {
    expect(buildGroupedSeries(rows, "category", ["2025", "2026"], 10).map((item) => item.name)).toEqual([
      "Alpha",
      "Bravo",
    ]);
  });

  it('excludes "None" labels from movers data', () => {
    expect(buildMovers(rows, "category", "2025", "2026", 10).map((item) => item.name)).toEqual([
      "Alpha",
      "Bravo",
    ]);
  });
});
