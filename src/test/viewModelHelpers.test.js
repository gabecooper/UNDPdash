import { describe, expect, it } from "vitest";
import { placeKpiFirst } from "../pages/viewModels/helpers";

describe("placeKpiFirst", () => {
  it("moves the requested KPI into the first slot", () => {
    const ordered = placeKpiFirst([
      { title: "Personnel Expenses" },
      { title: "Maintenance Expenses" },
      { title: "Total" },
    ], "Total");

    expect(ordered.map((kpi) => kpi.title)).toEqual([
      "Total",
      "Personnel Expenses",
      "Maintenance Expenses",
    ]);
  });

  it("leaves KPI order unchanged when the requested title is already first", () => {
    const ordered = placeKpiFirst([
      { title: "Climate Expenditure" },
      { title: "Top Agency" },
    ], "Climate Expenditure");

    expect(ordered.map((kpi) => kpi.title)).toEqual([
      "Climate Expenditure",
      "Top Agency",
    ]);
  });
});
