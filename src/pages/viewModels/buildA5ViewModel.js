import { formatMoneyCompact } from "../../data/formatters";
import {
  buildComparisonMeta,
  buildGroupedSeries,
  buildMovers,
  buildTableRows,
  buildTreemapData,
  buildYearComparisonSeries,
  buildYearTotals,
  getSelectedYearValue,
} from "../../data/selectors";
import { buildAuditInfo, buildDatasetAuditSummary, buildRowDetailSections, buildRowAuditInfo, getPreferredHeadersForYears } from "./audit";
import { buildDimensionColumns, buildSummaryMeta, buildYearColumns, buildYearComparisonColumn, getComparisonYear, placeKpiFirst } from "./helpers";

const ECONOMIC_SERVICES = "ECONOMIC SERVICES";
const SOCIAL_SERVICES = "SOCIAL SERVICES";
const DEFENSE = "DEFENSE";
const GENERAL_PUBLIC_SERVICES = "GENERAL PUBLIC SERVICES";
const INTEREST_PAYMENTS = "INTEREST PAYMENTS";
const CATEGORY_BREAKDOWN_CONFIGS = [
  {
    sectorName: ECONOMIC_SERVICES,
    title: "Economic Services Breakdown",
    fallbackLabel: "Economic Services",
  },
  {
    sectorName: SOCIAL_SERVICES,
    title: "Social Services Breakdown",
    fallbackLabel: "Social Services",
  },
  {
    sectorName: DEFENSE,
    title: "Defense Breakdown",
    fallbackLabel: "Defense",
  },
  {
    sectorName: GENERAL_PUBLIC_SERVICES,
    title: "General Public Services Breakdown",
    fallbackLabel: "General Public Services",
  },
  {
    sectorName: INTEREST_PAYMENTS,
    title: "Interest Payments & Financial Services Breakdown",
    fallbackLabel: "Interest Payments & Financial Services",
  },
];

function isSectorMatch(row, sectorName) {
  return row.dimensions.sectorName === sectorName;
}

function buildSectorKpi(title, totalsByYear, selectedYears, comparisonYear, currencyDisplay) {
  const selectedTotal = getSelectedYearValue(totalsByYear, selectedYears);
  const comparison = buildComparisonMeta(
    selectedTotal,
    comparisonYear ? totalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );

  return {
    title,
    value: formatMoneyCompact(selectedTotal, { currencyDisplay }),
    change: comparison.change,
    tone: comparison.tone,
  };
}

function isMissingBreakdownLabel(value) {
  return typeof value !== "string" || value.trim().toLowerCase() === "none";
}

function buildSectorChart(rows, selectedYears, { sectorName, title, fallbackLabel }, page, dataset) {
  const sectorRows = rows
    .filter((row) => isSectorMatch(row, sectorName))
    .map((row) => {
      if (!isMissingBreakdownLabel(row.dimensions.subSectorName)) {
        return row;
      }

      return {
        ...row,
        dimensions: {
          ...row.dimensions,
          subSectorName: fallbackLabel,
        },
      };
    });

  const data = buildGroupedSeries(sectorRows, "subSectorName", selectedYears, 12).map((item) => ({
    ...item,
    audit: buildAuditInfo({
      page,
      rows: sectorRows.filter((row) => row.dimensions?.subSectorName === item.name),
      headers: getPreferredHeadersForYears(dataset, selectedYears),
    }),
    auditByYear: Object.fromEntries(
      selectedYears.map((year) => [year, buildAuditInfo({
        page,
        rows: sectorRows.filter((row) => row.dimensions?.subSectorName === item.name),
        headers: [dataset.audit?.preferredValueFields?.[year]].filter(Boolean),
      })])
    ),
  }));
  const sourceRowCount = sectorRows.length;

  return {
    key: sectorName,
    title,
    fallbackLabel,
    data,
    sourceRowCount,
    note: sourceRowCount === 1 ? "1 source row in Table A.5" : "",
    height: Math.max(260, data.length * 36),
    emptyLabel: `No ${fallbackLabel.toLowerCase()} breakdown is available for the current filters.`,
  };
}

function buildCategoryBreakdownCharts(rows, selectedYears, page, dataset) {
  const sectorCharts = CATEGORY_BREAKDOWN_CONFIGS.map((config) => buildSectorChart(rows, selectedYears, config, page, dataset));
  const multiRowCharts = sectorCharts.filter((chart) => chart.sourceRowCount > 1);
  const singleRowCharts = sectorCharts.filter((chart) => chart.sourceRowCount === 1);

  if (!singleRowCharts.length) {
    return sectorCharts;
  }

  return [
    ...multiRowCharts,
    {
      key: "single-row-breakdowns",
      title: "Single-row Sector Breakdowns",
      data: singleRowCharts
        .filter((chart) => chart.data[0])
        .map((chart) => ({
          ...chart.data[0],
          name: chart.fallbackLabel,
        })),
      sourceRowCount: singleRowCharts.length,
      note: "Each bar is 1 source row in Table A.5",
      height: Math.max(260, singleRowCharts.length * 48),
      emptyLabel: "No single-row sector breakdowns are available for the current filters.",
    },
  ];
}

export function buildA5ViewModel({ dataset, selectedYears, searchQuery, page, currencyDisplay }) {
  const rows = dataset.rows;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);
  const totalAudit = buildAuditInfo({
    page,
    rows,
    headers: getPreferredHeadersForYears(dataset, selectedYears),
  });
  const latestBreakdownFields = (dataset.yearBreakdownFields?.[mostRecentSelectedYear] || []).filter((field) => !field.isTotal && !field.isPercent);
  const splitKpis = latestBreakdownFields.map((field) => {
    const totalsByYear = selectedYears.reduce((accumulator, year) => {
      accumulator[year] = rows.reduce((sum, row) => sum + (row.meta?.yearBreakdowns?.[year]?.[field.key] || 0), 0);
      return accumulator;
    }, {});
    const comparison = buildComparisonMeta(
      totalsByYear[mostRecentSelectedYear] || 0,
      comparisonYear ? totalsByYear[comparisonYear] || 0 : 0,
      Boolean(comparisonYear)
    );

    return {
      title: `${field.label} Total`,
      value: formatMoneyCompact(totalsByYear[mostRecentSelectedYear] || 0, { currencyDisplay }),
      change: comparison.change,
      tone: comparison.tone,
      audit: buildAuditInfo({ page, rows, headers: [field.source] }),
    };
  });

  const overallTotalsByYear = buildYearTotals(rows);
  const economicServicesTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, ECONOMIC_SERVICES));
  const socialServicesTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, SOCIAL_SERVICES));
  const defenseTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, DEFENSE));
  const generalPublicServicesTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, GENERAL_PUBLIC_SERVICES));
  const interestPaymentsTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, INTEREST_PAYMENTS));

  const tableDimensionKeys = page.viewConfig.tableDimensionKeys;
  const searchDimensionKeys = page.viewConfig.searchDimensionKeys || tableDimensionKeys;
  const tableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, searchDimensionKeys);
  const yearComparisonData = buildYearComparisonSeries(overallTotalsByYear, selectedYears);
  const yearComparisonColumn = buildYearComparisonColumn(selectedYears, currencyDisplay);
  const headlineTotalTitle = `${mostRecentSelectedYear} Total`;
  const kpis = [
    buildSectorKpi(headlineTotalTitle, overallTotalsByYear, selectedYears, comparisonYear, currencyDisplay),
    ...splitKpis,
    buildSectorKpi("Economic Services Total", economicServicesTotalsByYear, selectedYears, comparisonYear, currencyDisplay),
    buildSectorKpi("Social Services Total", socialServicesTotalsByYear, selectedYears, comparisonYear, currencyDisplay),
    buildSectorKpi("Defense Total", defenseTotalsByYear, selectedYears, comparisonYear, currencyDisplay),
    buildSectorKpi("General Public Services Total", generalPublicServicesTotalsByYear, selectedYears, comparisonYear, currencyDisplay),
    buildSectorKpi("Interest Payments Total", interestPaymentsTotalsByYear, selectedYears, comparisonYear, currencyDisplay),
  ].slice(0, 6).map((kpi) => ({
    audit: totalAudit,
    ...kpi,
  }));

  return {
    meta: buildSummaryMeta(selectedYears, rows.length),
    auditSummary: buildDatasetAuditSummary({ dataset, page }),
    currencyDisplay,
    kpis: placeKpiFirst(kpis, headlineTotalTitle),
    treemapTitle: "Split by Subsector",
    treemapData: buildTreemapData(rows, "subSectorName", selectedYears, mostRecentSelectedYear).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.subSectorName === item.name),
        headers: getPreferredHeadersForYears(dataset, selectedYears),
      }),
    })),
    categoryCharts: buildCategoryBreakdownCharts(rows, selectedYears, page, dataset),
    groupedTitle: "Top 10 Subsectors",
    groupedData: buildGroupedSeries(rows, "subSectorName", selectedYears, 10).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.subSectorName === item.name),
        headers: getPreferredHeadersForYears(dataset, selectedYears),
      }),
      auditByYear: Object.fromEntries(
        selectedYears.map((year) => [year, buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.subSectorName === item.name),
          headers: [dataset.audit?.preferredValueFields?.[year]].filter(Boolean),
        })])
      ),
    })),
    yearComparisonData: yearComparisonData.map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows,
        headers: [dataset.audit?.preferredValueFields?.[item.year]].filter(Boolean),
      }),
    })),
    movesTitle: "Biggest Movers by Subsector",
    movesData: selectedYears.length > 1
      ? buildMovers(rows, "subSectorName", oldestSelectedYear, mostRecentSelectedYear).map((item) => ({
        ...item,
        audit: buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.subSectorName === item.name),
          headers: getPreferredHeadersForYears(dataset, [oldestSelectedYear, mostRecentSelectedYear]),
        }),
      }))
      : [],
    comparisonLabel: `${oldestSelectedYear} to ${mostRecentSelectedYear}`,
    isMultiYearSelection: selectedYears.length > 1,
    tableTitle: `${page.id} Data Table`,
    tableRows,
    totalRowCount: rows.length,
    tableColumns: [
      ...buildDimensionColumns(dataset, tableDimensionKeys),
      ...buildYearColumns(selectedYears, currencyDisplay),
      ...(yearComparisonColumn ? [yearComparisonColumn] : []),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || "Search sector, subsector, entity type...",
    getRowKey: (row, index) => `${page.id}-${row.id}-${index}`,
    getHoverLabel: (row) => {
      const audit = buildRowAuditInfo({
        page,
        row,
        headers: getPreferredHeadersForYears(dataset, selectedYears),
      });
      return `${audit.sourceFile} • ${audit.pages.length ? `Page ${audit.pages.join(", ")}` : "Page unavailable"}`;
    },
    getRowDetail: (row) => buildRowDetailSections({ dataset, row }),
  };
}
