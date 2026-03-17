import { describe, expect, it } from "vitest";
import { adaptA4Dataset } from "../data/adapters/a4";

describe("adaptA4Dataset", () => {
  it("cascades missing hierarchy values and normalizes years", () => {
    const raw = [
      "Dept_Name,Agency_Name,Appropriation_Type,Category,Item_Name,2024_Actual_NG,2025_Program_NG,2026_GAA_NG,Page_No",
      "Congress,Senate,New General,Buildings,Main Building,100,200,300,1",
      ",,Continuing,Equipment,Servers,50,0,25,2",
    ].join("\n");

    const dataset = adaptA4Dataset(raw);

    expect(dataset.rows[1]).toMatchObject({
      dimensions: {
        dept: "Unspecified",
        agency: "Unspecified",
        appropriationType: "Continuing",
        category: "Equipment",
        itemName: "Servers",
      },
      valuesByYear: {
        "2024": 50,
        "2025": 0,
        "2026": 25,
      },
      meta: {
        pageNo: "2",
      },
    });
  });
});
