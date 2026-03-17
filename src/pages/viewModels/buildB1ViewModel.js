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

const PERSONNEL_EXPENSES = "A. PERSONNEL EXPENSES";
const MAINTENANCE_EXPENSES = "B. MAINTENANCE AND OTHER OPERATING EXPENSES";
const CAPITAL_OUTLAYS = "II. CAPITAL OUTLAYS";
const DONATIONS = "Donations";

function isExpenseClassMatch(row, expenseClass) {
  return row.dimensions.expenseClass === expenseClass;
}

function isDonationRow(row) {
  return row.dimensions.itemName === DONATIONS;
}

function buildValueKpi(title, totalsByYear, selectedYears, comparisonYear) {
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

function buildLargestItem(rows, selectedYears, mostRecentSelectedYear) {
  const rankedRows = rows
    .map((row) => ({
      row,
      selectedAverage: selectedWindowAverage(row.valuesByYear, selectedYears),
      mostRecentValue: row.valuesByYear?.[mostRecentSelectedYear] || 0,
    }))
    .sort((left, right) => {
      const selectedDelta = right.selectedAverage - left.selectedAverage;
      if (selectedDelta) return selectedDelta;

      const recentDelta = right.mostRecentValue - left.mostRecentValue;
      if (recentDelta) return recentDelta;

      return (left.row.dimensions.itemName || "").localeCompare(right.row.dimensions.itemName || "");
    });

  return rankedRows[0] || null;
}

export function buildB1ViewModel({ dataset, selectedYears, searchQuery, page }) {
  const rows = dataset.rows;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);
  const largestItem = buildLargestItem(rows, selectedYears, mostRecentSelectedYear);
  const tableDimensionKeys = page.viewConfig.tableDimensionKeys;
  const searchDimensionKeys = page.viewConfig.searchDimensionKeys || tableDimensionKeys;
  const kpis = [
    buildValueKpi("Personnel Expenses", buildYearTotals(rows, (row) => isExpenseClassMatch(row, PERSONNEL_EXPENSES)), selectedYears, comparisonYear),
    buildValueKpi("Maintenance Expenses", buildYearTotals(rows, (row) => isExpenseClassMatch(row, MAINTENANCE_EXPENSES)), selectedYears, comparisonYear),
    buildValueKpi("Total", buildYearTotals(rows), selectedYears, comparisonYear),
    buildValueKpi("Capital Outlays", buildYearTotals(rows, (row) => isExpenseClassMatch(row, CAPITAL_OUTLAYS)), selectedYears, comparisonYear),
    {
      title: "Largest Item",
      value: largestItem ? formatPesoCompact(largestItem.selectedAverage) : "₱0",
      change: largestItem?.row.dimensions.itemName || "No data available",
      tone: "neutral",
    },
    buildValueKpi("Donations Total", buildYearTotals(rows, isDonationRow), selectedYears, comparisonYear),
  ];

  return {
    meta: buildSummaryMeta(selectedYears, rows.length),
    kpis: placeKpiFirst(kpis, "Total"),
    treemapTitle: "Split by Sub Expense Class",
    treemapData: buildTreemapData(rows, "subExpenseClass", selectedYears, mostRecentSelectedYear),
    groupedTitle: "Top 10 Items",
    groupedData: buildGroupedSeries(rows, "itemName", selectedYears, 10),
    movesTitle: "Biggest Movers by Sub Expense Class",
    movesData: selectedYears.length > 1 ? buildMovers(rows, "subExpenseClass", oldestSelectedYear, mostRecentSelectedYear) : [],
    comparisonLabel: `${oldestSelectedYear} to ${mostRecentSelectedYear}`,
    isMultiYearSelection: selectedYears.length > 1,
    tableTitle: `${page.id} Data Table`,
    tableRows: buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, searchDimensionKeys),
    totalRowCount: rows.length,
    tableColumns: [
      ...buildDimensionColumns(dataset, tableDimensionKeys),
      ...buildYearColumns(selectedYears),
      ...(selectedYears.length > 1 ? [buildSelectedAverageColumn()] : []),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || "Search expense class, sub class, item...",
    getRowKey: (row, index) => `${page.id}-${row.id}-${index}`,
    getHoverLabel: (row) => (row.meta.pageNo ? `Page ${row.meta.pageNo}` : ""),
  };
}
