import { formatPesoCompact, numberFormatter } from "../../data/formatters";
import {
  buildComparisonMeta,
  buildGroupedSeries,
  buildMovers,
  buildTableRows,
  buildTreemapData,
  buildYearTotals,
  distinctCount,
  selectedWindowAverage,
} from "../../data/selectors";
import { buildDimensionColumns, buildSelectedAverageColumn, buildSummaryMeta, buildYearColumns, getComparisonYear, placeKpiFirst } from "./helpers";

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

function buildRankedGroups(rows, dimensionKey, selectedYears, mostRecentSelectedYear) {
  const totals = buildTreemapData(rows, dimensionKey, selectedYears, mostRecentSelectedYear);
  return totals.sort((left, right) => {
    const selectedDelta = right.value - left.value;
    if (selectedDelta) return selectedDelta;
    return left.name.localeCompare(right.name);
  });
}

function buildLargestGroupKpi(title, item) {
  return {
    title,
    value: item ? formatPesoCompact(item.value) : "₱0",
    change: item?.name || "No data available",
    tone: "neutral",
  };
}

export function buildB2ViewModel({ dataset, selectedYears, searchQuery, page }) {
  const rows = dataset.rows;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);
  const rankedObjects = buildRankedGroups(rows, "objectExpenditure", selectedYears, mostRecentSelectedYear);
  const rankedExpenseClasses = buildRankedGroups(rows, "expenseClass", selectedYears, mostRecentSelectedYear);
  const tableDimensionKeys = page.viewConfig.tableDimensionKeys;
  const searchDimensionKeys = page.viewConfig.searchDimensionKeys || tableDimensionKeys;
  const kpis = [
    buildValueKpi("Total", buildYearTotals(rows), selectedYears, comparisonYear),
    buildLargestGroupKpi("Largest Object Expenditure", rankedObjects[0]),
    buildLargestGroupKpi("Second Largest Object Expenditure", rankedObjects[1]),
    buildLargestGroupKpi("Third Largest Object Expenditure", rankedObjects[2]),
    {
      title: "Objects on Budget Sheet",
      value: numberFormatter.format(distinctCount(rows, "objectExpenditure", selectedYears)),
      change: "Distinct funded object expenditures across selected years",
      tone: "neutral",
    },
    buildLargestGroupKpi("Largest Expense Class", rankedExpenseClasses[0]),
  ];

  return {
    meta: buildSummaryMeta(selectedYears, rows.length),
    kpis: placeKpiFirst(kpis, "Total"),
    treemapTitle: "Split by Department",
    treemapData: buildTreemapData(rows, "deptName", selectedYears, mostRecentSelectedYear),
    groupedTitle: "Top 10 Object Expenditures",
    groupedData: buildGroupedSeries(rows, "objectExpenditure", selectedYears, 10),
    movesTitle: "Biggest Movers by Department",
    movesData: selectedYears.length > 1 ? buildMovers(rows, "deptName", oldestSelectedYear, mostRecentSelectedYear) : [],
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
    searchPlaceholder: page.viewConfig.searchPlaceholder || "Search department, class, object, type...",
    getRowKey: (row, index) => `${page.id}-${row.id}-${index}`,
    getHoverLabel: (row) => (row.meta.pageNo ? `Page ${row.meta.pageNo}` : ""),
  };
}
