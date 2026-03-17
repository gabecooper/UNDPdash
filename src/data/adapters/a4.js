import { cascadeHierarchyFromLeft, parseCsv, toNumber } from "../csv";

const A4_HIERARCHY_COLUMNS = [
  "Dept_Name",
  "Agency_Name",
  "Appropriation_Type",
  "Category",
  "Item_Name",
];

export function adaptA4Dataset(raw) {
  const rows = parseCsv(raw).map((rawRow, index) => {
    const row = cascadeHierarchyFromLeft(rawRow, A4_HIERARCHY_COLUMNS);

    return {
      id: `a4-${index}`,
      dimensions: {
        dept: row.Dept_Name || "Unspecified",
        agency: row.Agency_Name || "Unspecified",
        appropriationType: row.Appropriation_Type || "Unspecified",
        category: row.Category || "Unspecified",
        itemName: row.Item_Name || "Unspecified",
      },
      valuesByYear: {
        "2024": toNumber(row["2024_Actual_NG"]),
        "2025": toNumber(row["2025_Program_NG"]),
        "2026": toNumber(row["2026_GAA_NG"]),
      },
      metrics: {},
      meta: {
        pageNo: row.Page_No || "",
        source: row,
      },
    };
  });

  return {
    schema: "a4",
    years: ["2024", "2025", "2026"],
    dimensionFields: [
      { key: "dept", label: "Department" },
      { key: "agency", label: "Agency" },
      { key: "appropriationType", label: "Type" },
      { key: "category", label: "Category" },
      { key: "itemName", label: "Item" },
    ],
    metricFields: [],
    rows,
  };
}
