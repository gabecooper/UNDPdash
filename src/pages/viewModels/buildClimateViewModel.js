import { formatPesoCompact, numberFormatter } from "../../data/formatters";
import { buildComparisonMeta, buildGroupedSeries, buildMovers, buildTableRows, buildTreemapData, buildYearTotals, distinctCount, selectedWindowAverage } from "../../data/selectors";
import { buildDimensionColumns, buildSelectedAverageColumn, buildSummaryMeta, buildYearColumns, getComparisonYear, getDimensionLabel, placeKpiFirst } from "./helpers";

function normalizeDimensionValue(value) {
  return String(value || "").trim().toLowerCase();
}

function isAggregateOrgLabel(value) {
  const normalized = normalizeDimensionValue(value);
  return normalized === "total" || normalized === "departments";
}

function isTotalClimateTypology(value) {
  return normalizeDimensionValue(value) === "total";
}

export function buildClimateViewModel({ dataset, selectedYears, searchQuery, page }) {
  const rows = dataset.rows;
  const { primaryDimensionKey, secondaryDimensionKey, tableDimensionKeys, searchDimensionKeys } = page.viewConfig;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);
  const realPrimaryRows = rows.filter((row) => !isAggregateOrgLabel(row.dimensions?.[primaryDimensionKey]));
  const typologyRows = realPrimaryRows.filter((row) => !isTotalClimateTypology(row.dimensions?.[secondaryDimensionKey]));
  const summaryRows = (() => {
    const totalRows = realPrimaryRows.filter((row) => isTotalClimateTypology(row.dimensions?.[secondaryDimensionKey]));
    return totalRows.length ? totalRows : typologyRows;
  })();

  const overallTotalsByYear = buildYearTotals(summaryRows);
  const selectedTotal = selectedWindowAverage(overallTotalsByYear, selectedYears);
  const comparison = buildComparisonMeta(
    selectedTotal,
    comparisonYear ? overallTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );

  const primaryLabel = getDimensionLabel(dataset, primaryDimensionKey);
  const secondaryLabel = getDimensionLabel(dataset, secondaryDimensionKey);
  const primaryCount = distinctCount(summaryRows, primaryDimensionKey, selectedYears);
  const typologyCount = distinctCount(typologyRows, secondaryDimensionKey, selectedYears);
  const primaryTreemapData = buildTreemapData(summaryRows, primaryDimensionKey, selectedYears, mostRecentSelectedYear);
  const secondaryTreemapData = buildTreemapData(typologyRows, secondaryDimensionKey, selectedYears, mostRecentSelectedYear);
  const typologySeriesData = buildGroupedSeries(typologyRows, secondaryDimensionKey, selectedYears, 10);
  const topPrimaryData = buildGroupedSeries(summaryRows, primaryDimensionKey, selectedYears, 10);
  const moversByPrimary = selectedYears.length > 1 ? buildMovers(summaryRows, primaryDimensionKey, oldestSelectedYear, mostRecentSelectedYear) : [];
  const averageRowValue = summaryRows.length
    ? summaryRows.reduce((sum, row) => sum + selectedWindowAverage(row.valuesByYear, selectedYears), 0) / summaryRows.length
    : 0;
  const tableRows = buildTableRows(realPrimaryRows, selectedYears, mostRecentSelectedYear, searchQuery, searchDimensionKeys || tableDimensionKeys);
  const kpis = [
    {
      title: "Climate Expenditure",
      value: formatPesoCompact(selectedTotal),
      change: comparison.change,
      tone: comparison.tone,
    },
    {
      title: `${primaryLabel} Groups`,
      value: numberFormatter.format(primaryCount),
      change: `Distinct ${primaryLabel.toLowerCase()} groups funded`,
      tone: "neutral",
    },
    {
      title: `${secondaryLabel} Groups`,
      value: numberFormatter.format(typologyCount),
      change: `Distinct ${secondaryLabel.toLowerCase()} categories funded`,
      tone: "neutral",
    },
    {
      title: `Top ${primaryLabel}`,
      value: primaryTreemapData[0] ? formatPesoCompact(primaryTreemapData[0].value) : "₱0",
      change: primaryTreemapData[0]?.name || "No current data",
      tone: "neutral",
    },
    {
      title: `Top ${secondaryLabel}`,
      value: secondaryTreemapData[0] ? formatPesoCompact(secondaryTreemapData[0].value) : "₱0",
      change: secondaryTreemapData[0]?.name || "No current data",
      tone: "neutral",
    },
    {
      title: "Average Row Value",
      value: formatPesoCompact(averageRowValue),
      change: "Average across rows in the selected year window",
      tone: "neutral",
    },
  ];

  return {
    meta: buildSummaryMeta(selectedYears, summaryRows.length),
    kpis: placeKpiFirst(kpis, "Climate Expenditure"),
    treemapTitle: `Climate Spend by ${primaryLabel}`,
    treemapData: primaryTreemapData,
    primaryChartTitle: `Top ${primaryLabel}`,
    primaryChartData: topPrimaryData,
    secondaryChartTitle: `${secondaryLabel} Breakdown`,
    secondaryChartData: typologySeriesData,
    movesTitle: `Biggest Moves by ${primaryLabel}`,
    movesData: moversByPrimary,
    comparisonLabel: `${oldestSelectedYear} to ${mostRecentSelectedYear}`,
    isMultiYearSelection: selectedYears.length > 1,
    tableTitle: `${page.id} Climate Data`,
    tableRows,
    totalRowCount: realPrimaryRows.length,
    tableColumns: [
      ...buildDimensionColumns(dataset, tableDimensionKeys),
      ...buildYearColumns(selectedYears),
      ...(selectedYears.length > 1 ? [buildSelectedAverageColumn()] : []),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || "Search climate data...",
    getRowKey: (row, index) => `${page.id}-${row.id}-${index}`,
    getHoverLabel: (row) => (row.meta.pageNo ? `Page ${row.meta.pageNo}` : ""),
  };
}
