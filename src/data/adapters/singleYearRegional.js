import { parseCsv, toCamelCase, toLabel, toNumber } from "../csv";

export function adaptSingleYearRegionalDataset(raw, schema = "singleYearRegional") {
  const rawRows = parseCsv(raw);
  const headers = Object.keys(rawRows[0] || {});
  const valueField = headers.find((header) => /^20\d{2}_.+_Amount$/i.test(header));
  const year = valueField ? valueField.slice(0, 4) : "2026";

  const dimensionFields = headers
    .filter((header) => header !== "Page_No" && header !== valueField)
    .map((header) => ({
      key: toCamelCase(header),
      source: header,
      label: toLabel(header),
    }));

  const rows = rawRows.map((rawRow, index) => ({
    id: `${schema}-${index}`,
    dimensions: dimensionFields.reduce((accumulator, field) => {
      accumulator[field.key] = rawRow[field.source] || "Unspecified";
      return accumulator;
    }, {}),
    valuesByYear: {
      [year]: toNumber(rawRow[valueField]),
    },
    metrics: {},
    meta: {
      pageNo: rawRow.Page_No || "",
      source: rawRow,
    },
  }));

  return {
    schema,
    years: [year],
    dimensionFields,
    metricFields: [],
    rows,
  };
}
