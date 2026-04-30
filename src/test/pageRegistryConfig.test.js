import { describe, expect, it } from "vitest";
import { allPages, flatPageRegistry } from "../app/pageRegistry";

function getPage(id) {
  return flatPageRegistry.find((page) => page.id === id);
}

describe("page registry config", () => {
  it("uses the requested chart dimensions for the affected B pages", () => {
    expect(getPage("B.3")?.viewConfig.secondaryDimensionKey).toBe("agencyName");
    expect(getPage("B.4.c")?.viewConfig.groupedDimensionKey).toBe("regionName");
    expect(getPage("B.5")?.csvFile).toBe("B5a.csv");
    expect(getPage("B.5")?.viewConfig.groupedDimensionKey).toBe("subSectorName");
    expect(getPage("B.5.b")?.csvFile).toBe("B5c.csv");
    expect(getPage("B.5.b")?.viewConfig.treemapDimensionKey).toBe("cofogCategory");
    expect(getPage("B.5.b")?.viewConfig.drilldownConfig?.primaryKey).toBe("deptName");
    expect(getPage("B.8")?.csvFile).toBe("B9.csv");
    expect(getPage("B.8")?.viewConfig.drilldownConfig?.breakdownMode).toBe("yearBreakdown");
  });

  it("exposes a compare route outside the main dataset registry", () => {
    expect(flatPageRegistry.some((page) => page.id === "comparison")).toBe(false);
    expect(allPages.find((page) => page.id === "comparison")?.route).toBe("/comparison");
  });
});
