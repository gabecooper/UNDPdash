import { parseCsv, toCamelCase, toLabel, toNumber } from "../csv";
import { detectYearValueFields, isYearValueField } from "../yearFields";

function buildDimensionFields(headers, yearFieldMap) {
  return headers
    .filter((header) => header !== "Page_No" && !yearFieldMap[header] && !isYearValueField(header) && header !== "2026_Percent_Share")
    .map((header) => ({
      key: toCamelCase(header),
      source: header,
      label: toLabel(header),
    }));
}

export function adaptThreeYearBudgetDataset(raw, schema = "threeYearBudget") {
  const rawRows = parseCsv(raw);
  const headers = Object.keys(rawRows[0] || {});
  const detectedYearFields = detectYearValueFields(headers);
  const yearFieldsByHeader = Object.values(detectedYearFields).reduce((accumulator, header) => {
    accumulator[header] = true;
    return accumulator;
  }, {});

  const dimensionFields = headers
    .filter((header) => header !== "Page_No" && !yearFieldsByHeader[header] && header !== "2026_Percent_Share")
    .map((header) => ({
      key: toCamelCase(header),
      source: header,
      label: toLabel(header),
    }));

  const metricFields = headers
    .filter((header) => !yearFieldsByHeader[header] && header !== "Page_No" && !dimensionFields.some((field) => field.source === header))
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
    valuesByYear: Object.entries(detectedYearFields).reduce((accumulator, [year, field]) => {
      accumulator[year] = toNumber(rawRow[field]);
      return accumulator;
    }, {}),
    metrics: metricFields.reduce((accumulator, field) => {
      accumulator[field.key] = toNumber(rawRow[field.source]);
      return accumulator;
    }, {}),
    meta: {
      pageNo: rawRow.Page_No || "",
      source: rawRow,
    },
  }));

  return {
    schema,
    years: Object.keys(detectedYearFields),
    dimensionFields,
    metricFields,
    rows,
  };
}
