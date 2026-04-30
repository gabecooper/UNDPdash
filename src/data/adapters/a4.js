import { cascadeHierarchyFromLeft, parseCsv, toLabel, toNumber } from "../csv";
import { sortYears } from "../yearFields";

const A4_HIERARCHY_COLUMNS = [
  "Dept_Name",
  "Agency_Name",
  "Appropriation_Type",
  "Category",
  "Item_Name",
];

const YEAR_VALUE_FIELDS = {
  "2024": ["2024_Actual_TOTAL", "2024_Actual_NG"],
  "2025": ["2025_Program_TOTAL", "2025_Program_NG"],
  "2026": ["2026_GAA_TOTAL", "2026_GAA_NG"],
};

const YEAR_BREAKDOWN_FIELDS = {
  "2024": [
    { key: "nG", label: "NG", source: "2024_Actual_NG" },
    { key: "gOCC", label: "GOCC", source: "2024_Actual_GOCC" },
    { key: "lGU", label: "LGU", source: "2024_Actual_LGU" },
    { key: "total", label: "Total", source: "2024_Actual_TOTAL", isTotal: true },
  ],
  "2025": [
    { key: "nG", label: "NG", source: "2025_Program_NG" },
    { key: "gOCC", label: "GOCC", source: "2025_Program_GOCC" },
    { key: "lGU", label: "LGU", source: "2025_Program_LGU" },
    { key: "total", label: "Total", source: "2025_Program_TOTAL", isTotal: true },
  ],
  "2026": [
    { key: "nG", label: "NG", source: "2026_GAA_NG" },
    { key: "gOCC", label: "GOCC", source: "2026_GAA_GOCC" },
    { key: "lGU", label: "LGU", source: "2026_GAA_LGU" },
    { key: "total", label: "Total", source: "2026_GAA_TOTAL", isTotal: true },
  ],
};

function getPrimaryField(row, year) {
  return YEAR_VALUE_FIELDS[year].find((field) => field in row) || YEAR_VALUE_FIELDS[year][0];
}

function buildValuesByYear(row, years) {
  return years.reduce((accumulator, year) => {
    const primaryField = getPrimaryField(row, year);
    accumulator[year] = toNumber(row[primaryField]);
    return accumulator;
  }, {});
}

function buildYearBreakdowns(row, years) {
  return years.reduce((accumulator, year) => {
    accumulator[year] = YEAR_BREAKDOWN_FIELDS[year].reduce((nextBreakdown, field) => {
      nextBreakdown[field.key] = toNumber(row[field.source]);
      return nextBreakdown;
    }, {});
    return accumulator;
  }, {});
}

export function adaptA4Dataset(raw) {
  const parsedRows = parseCsv(raw);
  const headers = Object.keys(parsedRows[0] || {});
  const years = sortYears(Object.keys(YEAR_VALUE_FIELDS));
  const rows = parsedRows.map((rawRow, index) => {
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
      valuesByYear: buildValuesByYear(row, years),
      metrics: {},
      meta: {
        pageNo: row.Page_No || "",
        notes: row.Notes || "",
        ref: row.Ref || "",
        source: row,
        yearBreakdowns: buildYearBreakdowns(row, years),
      },
    };
  });

  return {
    schema: "a4",
    years,
    dimensionFields: [
      { key: "dept", label: "Department", source: "Dept_Name" },
      { key: "agency", label: "Agency", source: "Agency_Name" },
      { key: "appropriationType", label: "Type", source: "Appropriation_Type" },
      { key: "category", label: "Category", source: "Category" },
      { key: "itemName", label: "Item", source: "Item_Name" },
    ],
    metricFields: [],
    yearBreakdownFields: YEAR_BREAKDOWN_FIELDS,
    rows,
    audit: {
      headers: headers.map((header) => ({
        raw: header,
        label: toLabel(header),
        kind: header === "Page_No" || header === "Ref" || header === "Notes"
          ? "meta"
          : /^20\d{2}_/.test(header)
            ? "yearValue"
            : "dimension",
      })),
      warnings: [],
      preferredValueFields: Object.fromEntries(
        years.map((year) => [year, getPrimaryField(parsedRows[0] || {}, year)])
      ),
    },
  };
}
