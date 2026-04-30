import { parseCsv, toCamelCase, toLabel, toNumber } from "../csv";
import { buildYearFieldCatalog, sortYears } from "../yearFields";

const META_HEADERS = new Set(["Page_No", "Notes", "Ref"]);

function buildDimensionFields(headers, yearFieldLookup) {
  return headers
    .filter((header) => !META_HEADERS.has(header) && !yearFieldLookup.has(header))
    .map((header) => ({
      key: toCamelCase(header),
      source: header,
      label: toLabel(header),
    }));
}

function buildYearBreakdownFields(yearFieldCatalog) {
  return Object.fromEntries(
    Object.entries(yearFieldCatalog).map(([year, fields]) => [
      year,
      fields.map((field) => ({
        key: toCamelCase(field.seriesKey),
        rawSeriesKey: field.rawSeriesKey || "",
        label: field.rawSeriesKey ? toLabel(field.rawSeriesKey) : `${field.stage} Amount`,
        source: field.fieldName,
        isPercent: field.isPercent,
        isTotal: field.isTotal,
      })),
    ])
  );
}

function buildPreferredValueFields(yearFieldCatalog) {
  return Object.fromEntries(
    Object.entries(yearFieldCatalog).map(([year, fields]) => {
      const monetaryFields = fields.filter((field) => !field.isPercent);
      const totalField = monetaryFields.find((field) => field.isTotal);
      const fallbackField = monetaryFields.length === 1 ? monetaryFields[0] : null;

      return [year, totalField?.fieldName || fallbackField?.fieldName || null];
    })
  );
}

function buildWarnings(yearFieldCatalog, preferredValueFields) {
  const warnings = [];

  Object.entries(yearFieldCatalog).forEach(([year, fields]) => {
    const monetaryFields = fields.filter((field) => !field.isPercent);
    if (monetaryFields.length > 1 && !preferredValueFields[year]) {
      warnings.push(`No explicit ${year} total column was found; totals are being summed from the year breakdown columns.`);
    }
  });

  return warnings;
}

function buildAuditHeaders(headers, yearFieldLookup, dimensionFields) {
  return headers.map((header) => {
    const yearField = yearFieldLookup.get(header);
    const dimensionField = dimensionFields.find((field) => field.source === header);

    if (yearField) {
      return {
        raw: header,
        label: yearField.rawSeriesKey ? toLabel(yearField.rawSeriesKey) : `${yearField.year} ${yearField.stage}`,
        kind: yearField.isPercent ? "yearMetric" : "yearValue",
        year: yearField.year,
        stage: yearField.stage,
        isTotal: yearField.isTotal,
      };
    }

    if (META_HEADERS.has(header)) {
      return {
        raw: header,
        label: toLabel(header),
        kind: "meta",
      };
    }

    return {
      raw: header,
      label: dimensionField?.label || toLabel(header),
      kind: "dimension",
    };
  });
}

function buildYearBreakdowns(rawRow, yearBreakdownFields) {
  return Object.fromEntries(
    Object.entries(yearBreakdownFields).map(([year, fields]) => [
      year,
      fields.reduce((accumulator, field) => {
        accumulator[field.key] = toNumber(rawRow[field.source]);
        return accumulator;
      }, {}),
    ])
  );
}

function buildValuesByYear(rawRow, years, preferredValueFields, yearBreakdownFields) {
  return years.reduce((accumulator, year) => {
    const preferredField = preferredValueFields[year];

    if (preferredField) {
      accumulator[year] = toNumber(rawRow[preferredField]);
      return accumulator;
    }

    const summedValue = yearBreakdownFields[year]
      .filter((field) => !field.isPercent)
      .reduce((sum, field) => sum + toNumber(rawRow[field.source]), 0);

    accumulator[year] = summedValue;
    return accumulator;
  }, {});
}

export function adaptThreeYearBudgetDataset(raw, schema = "threeYearBudget") {
  const rawRows = parseCsv(raw);
  const headers = Object.keys(rawRows[0] || {});
  const yearFieldCatalog = buildYearFieldCatalog(headers);
  const yearFieldLookup = new Map(
    Object.values(yearFieldCatalog)
      .flat()
      .map((field) => [field.fieldName, field])
  );
  const years = sortYears(Object.keys(yearFieldCatalog));
  const dimensionFields = buildDimensionFields(headers, yearFieldLookup);
  const yearBreakdownFields = buildYearBreakdownFields(yearFieldCatalog);
  const preferredValueFields = buildPreferredValueFields(yearFieldCatalog);
  const warnings = buildWarnings(yearFieldCatalog, preferredValueFields);
  const rows = rawRows.map((rawRow, index) => ({
    id: `${schema}-${index}`,
    dimensions: dimensionFields.reduce((accumulator, field) => {
      accumulator[field.key] = rawRow[field.source] || "Unspecified";
      return accumulator;
    }, {}),
    valuesByYear: buildValuesByYear(rawRow, years, preferredValueFields, yearBreakdownFields),
    metrics: {},
    meta: {
      pageNo: rawRow.Page_No || "",
      notes: rawRow.Notes || "",
      ref: rawRow.Ref || "",
      source: rawRow,
      yearBreakdowns: buildYearBreakdowns(rawRow, yearBreakdownFields),
    },
  }));

  return {
    schema,
    years,
    dimensionFields,
    metricFields: [],
    yearBreakdownFields,
    rows,
    audit: {
      headers: buildAuditHeaders(headers, yearFieldLookup, dimensionFields),
      warnings,
      preferredValueFields,
    },
  };
}
