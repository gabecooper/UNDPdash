import { formatPesoCompact } from "../../data/formatters";
import {
  buildComparisonMeta,
  buildGroupedSeries,
  buildMovers,
  buildTableRows,
  buildTreemapData,
  buildYearTotals,
  selectedWindowAverage,
} from "../../data/selectors";
import { buildDimensionColumns, buildSelectedAverageColumn, buildSummaryMeta, buildYearColumns, getComparisonYear, placeKpiFirst } from "./helpers";

const ECONOMIC_SERVICES = "ECONOMIC SERVICES";
const SOCIAL_SERVICES = "SOCIAL SERVICES";
const DEFENSE = "DEFENSE";
const GENERAL_PUBLIC_SERVICES = "GENERAL PUBLIC SERVICES";
const INTEREST_PAYMENTS = "INTEREST PAYMENTS";

function isSectorMatch(row, sectorName) {
  return row.dimensions.sectorName === sectorName;
}

function buildSectorKpi(title, totalsByYear, selectedYears, comparisonYear) {
  const selectedTotal = selectedWindowAverage(totalsByYear, selectedYears);
  const comparison = buildComparisonMeta(
    selectedTotal,
    comparisonYear ? totalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );

  return {
    title,
    value: formatPesoCompact(selectedTotal),
    change: comparison.change,
    tone: comparison.tone,
  };
}

export function buildA5ViewModel({ dataset, selectedYears, searchQuery, page }) {
  const rows = dataset.rows;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);

  const overallTotalsByYear = buildYearTotals(rows);
  const economicServicesTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, ECONOMIC_SERVICES));
  const socialServicesTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, SOCIAL_SERVICES));
  const defenseTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, DEFENSE));
  const generalPublicServicesTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, GENERAL_PUBLIC_SERVICES));
  const interestPaymentsTotalsByYear = buildYearTotals(rows, (row) => isSectorMatch(row, INTEREST_PAYMENTS));

  const tableDimensionKeys = page.viewConfig.tableDimensionKeys;
  const searchDimensionKeys = page.viewConfig.searchDimensionKeys || tableDimensionKeys;
  const tableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, searchDimensionKeys);
  const kpis = [
    buildSectorKpi("Total", overallTotalsByYear, selectedYears, comparisonYear),
    buildSectorKpi("Economic Services Total", economicServicesTotalsByYear, selectedYears, comparisonYear),
    buildSectorKpi("Social Services Total", socialServicesTotalsByYear, selectedYears, comparisonYear),
    buildSectorKpi("Defense Total", defenseTotalsByYear, selectedYears, comparisonYear),
    buildSectorKpi("General Public Services Total", generalPublicServicesTotalsByYear, selectedYears, comparisonYear),
    buildSectorKpi("Interest Payments Total", interestPaymentsTotalsByYear, selectedYears, comparisonYear),
  ];

  return {
    meta: buildSummaryMeta(selectedYears, rows.length),
    kpis: placeKpiFirst(kpis, "Total"),
    treemapTitle: "Split by Subsector",
    treemapData: buildTreemapData(rows, "subSectorName", selectedYears, mostRecentSelectedYear),
    groupedTitle: "Top 10 Subsectors",
    groupedData: buildGroupedSeries(rows, "subSectorName", selectedYears, 10),
    movesTitle: "Biggest Movers by Subsector",
    movesData: selectedYears.length > 1 ? buildMovers(rows, "subSectorName", oldestSelectedYear, mostRecentSelectedYear) : [],
    comparisonLabel: `${oldestSelectedYear} to ${mostRecentSelectedYear}`,
    isMultiYearSelection: selectedYears.length > 1,
    tableTitle: `${page.id} Data Table`,
    tableRows,
    totalRowCount: rows.length,
    tableColumns: [
      ...buildDimensionColumns(dataset, tableDimensionKeys),
      ...buildYearColumns(selectedYears),
      ...(selectedYears.length > 1 ? [buildSelectedAverageColumn()] : []),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || "Search sector, subsector, entity type...",
    getRowKey: (row, index) => `${page.id}-${row.id}-${index}`,
    getHoverLabel: (row) => (row.meta.pageNo ? `Page ${row.meta.pageNo}` : ""),
  };
}
