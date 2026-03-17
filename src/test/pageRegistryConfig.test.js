import { describe, expect, it } from "vitest";
import { flatPageRegistry } from "../app/pageRegistry";

function getPage(id) {
  return flatPageRegistry.find((page) => page.id === id);
}

describe("page registry config", () => {
  it("uses the requested chart dimensions for the affected B pages", () => {
    expect(getPage("B.3")?.viewConfig.secondaryDimensionKey).toBe("agencyName");
    expect(getPage("B.4.c")?.viewConfig.groupedDimensionKey).toBe("regionName");
    expect(getPage("B.5")?.csvFile).toBe("B5a.csv");
    expect(getPage("B.5")?.viewConfig.groupedDimensionKey).toBe("deptAgency");
    expect(getPage("B.5.b")?.viewConfig.treemapDimensionKey).toBe("cofogSubCategory");
    expect(getPage("B.5.c")?.viewConfig.groupedDimensionKey).toBe("deptName");
    expect(getPage("B.5.c")?.viewConfig.secondaryDimensionKey).toBe("agencyName");
  });
});
