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
import {
  buildDimensionColumns,
  buildLargestGroupLabel,
  buildSelectedAverageColumn,
  buildSummaryMeta,
  buildYearColumns,
  getComparisonYear,
  getDimensionLabel,
  placeKpiFirst,
} from "./helpers";

const COFOG_HEADLINE_CATEGORIES = [
  { title: "Defense", match: "DEFENSE" },
  { title: "Health", match: "HEALTH" },
  { title: "Public Order", match: "PUBLIC ORDER AND SAFETY" },
  { title: "Education", match: "EDUCATION" },
  { title: "General Public", match: "GENERAL PUBLIC SERVICES" },
];

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

function buildLargestItems(rows, selectedYears, limit = 2) {
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];

  return rows
    .map((row) => ({
      itemName: row.dimensions.itemName || "Unspecified",
      selectedAverage: selectedWindowAverage(row.valuesByYear, selectedYears),
      mostRecentValue: row.valuesByYear?.[mostRecentSelectedYear] || 0,
    }))
    .filter((item) => item.selectedAverage > 0)
    .sort((left, right) => {
      const averageDelta = right.selectedAverage - left.selectedAverage;
      if (averageDelta) return averageDelta;

      const recentDelta = right.mostRecentValue - left.mostRecentValue;
      if (recentDelta) return recentDelta;

      return left.itemName.localeCompare(right.itemName);
    })
    .slice(0, limit);
}

function buildLargestItemKpi(title, item) {
  return {
    title,
    value: item ? formatPesoCompact(item.selectedAverage) : "₱0",
    change: item?.itemName || "No current data",
    tone: "neutral",
  };
}

function buildDefaultKpis({
  headlineTotalTitle,
  selectedTotal,
  comparison,
  primaryLabel,
  primaryCount,
  secondaryLabel,
  secondaryCount,
  largestPrimary,
  largestSecondary,
  averageRowValue,
}) {
  return placeKpiFirst([
    {
      title: headlineTotalTitle,
      value: formatPesoCompact(selectedTotal),
      change: comparison.change,
      tone: comparison.tone,
    },
    {
      title: `${primaryLabel} Groups`,
      value: numberFormatter.format(primaryCount),
      change: `Distinct ${primaryLabel.toLowerCase()} groups with funded rows`,
      tone: "neutral",
    },
    {
      title: `${secondaryLabel} Groups`,
      value: numberFormatter.format(secondaryCount),
      change: `Distinct ${secondaryLabel.toLowerCase()} groups with funded rows`,
      tone: "neutral",
    },
    {
      title: `Largest ${primaryLabel}`,
      value: largestPrimary ? formatPesoCompact(largestPrimary.value) : "₱0",
      change: buildLargestGroupLabel(largestPrimary?.name, largestPrimary?.value || 0),
      tone: "neutral",
    },
    {
      title: `Largest ${secondaryLabel}`,
      value: largestSecondary ? formatPesoCompact(largestSecondary.value) : "₱0",
      change: buildLargestGroupLabel(largestSecondary?.name, largestSecondary?.value || 0),
      tone: "neutral",
    },
    {
      title: "Average Row Value",
      value: formatPesoCompact(averageRowValue),
      change: "Average across rows in the selected year window",
      tone: "neutral",
    },
  ], headlineTotalTitle);
}

function buildCofogHeadlineKpis({ rows, selectedYears, comparisonYear, headlineTotalTitle }) {
  return placeKpiFirst([
    buildValueKpi(headlineTotalTitle, buildYearTotals(rows), selectedYears, comparisonYear),
    ...COFOG_HEADLINE_CATEGORIES.map(({ title, match }) => (
      buildValueKpi(title, buildYearTotals(rows, (row) => row.dimensions.cofogCategory === match), selectedYears, comparisonYear)
    )),
  ], headlineTotalTitle);
}

function buildLargestTwoItemKpis({
  rows,
  selectedYears,
  comparison,
  headlineTotalTitle,
  selectedTotal,
  primaryLabel,
  primaryCount,
  secondaryLabel,
  secondaryCount,
  largestPrimary,
}) {
  const [largestItem, secondLargestItem] = buildLargestItems(rows, selectedYears, 2);

  return placeKpiFirst([
    {
      title: headlineTotalTitle,
      value: formatPesoCompact(selectedTotal),
      change: comparison.change,
      tone: comparison.tone,
    },
    {
      title: `${primaryLabel} Groups`,
      value: numberFormatter.format(primaryCount),
      change: `Distinct ${primaryLabel.toLowerCase()} groups with funded rows`,
      tone: "neutral",
    },
    {
      title: `${secondaryLabel} Groups`,
      value: numberFormatter.format(secondaryCount),
      change: `Distinct ${secondaryLabel.toLowerCase()} groups with funded rows`,
      tone: "neutral",
    },
    {
      title: `Largest ${primaryLabel}`,
      value: largestPrimary ? formatPesoCompact(largestPrimary.value) : "₱0",
      change: buildLargestGroupLabel(largestPrimary?.name, largestPrimary?.value || 0),
      tone: "neutral",
    },
    buildLargestItemKpi("Largest Item", largestItem),
    buildLargestItemKpi("Second Largest Item", secondLargestItem),
  ], headlineTotalTitle);
}

export function buildMultiYearSummaryViewModel({ dataset, selectedYears, searchQuery, page }) {
  const rows = dataset.rows;
  const {
    primaryDimensionKey,
    secondaryDimensionKey,
    treemapDimensionKey = primaryDimensionKey,
    groupedDimensionKey = secondaryDimensionKey || primaryDimensionKey,
    primaryMovesDimensionKey = primaryDimensionKey,
    secondaryMovesDimensionKey = secondaryDimensionKey,
    tableDimensionKeys,
    searchDimensionKeys,
    customKpiMode,
  } = page.viewConfig;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);

  const overallTotalsByYear = buildYearTotals(rows);
  const selectedTotal = selectedWindowAverage(overallTotalsByYear, selectedYears);
  const comparison = buildComparisonMeta(
    selectedTotal,
    comparisonYear ? overallTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );

  const headlineTotalTitle = selectedYears.length > 1 ? "Selected Avg Total" : "Selected Total";
  const primaryLabel = getDimensionLabel(dataset, primaryDimensionKey);
  const secondaryLabel = getDimensionLabel(dataset, secondaryDimensionKey || primaryDimensionKey);
  const treemapLabel = getDimensionLabel(dataset, treemapDimensionKey);
  const groupedLabel = getDimensionLabel(dataset, groupedDimensionKey);
  const primaryMovesLabel = getDimensionLabel(dataset, primaryMovesDimensionKey);
  const secondaryMovesLabel = secondaryMovesDimensionKey ? getDimensionLabel(dataset, secondaryMovesDimensionKey) : "";
  const primaryCount = distinctCount(rows, primaryDimensionKey, selectedYears);
  const secondaryCount = distinctCount(rows, secondaryDimensionKey || primaryDimensionKey, selectedYears);
  const treemapData = buildTreemapData(rows, treemapDimensionKey, selectedYears, mostRecentSelectedYear);
  const secondaryTreemapData = buildTreemapData(rows, secondaryDimensionKey || primaryDimensionKey, selectedYears, mostRecentSelectedYear);
  const groupedData = buildGroupedSeries(rows, groupedDimensionKey, selectedYears, 10);
  const primaryMovesData = selectedYears.length > 1
    ? buildMovers(rows, primaryMovesDimensionKey, oldestSelectedYear, mostRecentSelectedYear)
    : [];
  const secondaryMovesData = secondaryMovesDimensionKey && selectedYears.length > 1
    ? buildMovers(rows, secondaryMovesDimensionKey, oldestSelectedYear, mostRecentSelectedYear)
    : [];
  const averageRowValue = rows.length
    ? rows.reduce((sum, row) => sum + selectedWindowAverage(row.valuesByYear, selectedYears), 0) / rows.length
    : 0;
  const largestPrimary = treemapData[0];
  const tableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, searchDimensionKeys || tableDimensionKeys);

  const kpis = customKpiMode === "cofogHeadlineTotals"
    ? buildCofogHeadlineKpis({ rows, selectedYears, comparisonYear, headlineTotalTitle })
    : customKpiMode === "largestTwoItems"
      ? buildLargestTwoItemKpis({
        rows,
        selectedYears,
        comparison,
        headlineTotalTitle,
        selectedTotal,
        primaryLabel,
        primaryCount,
        secondaryLabel,
        secondaryCount,
        largestPrimary,
      })
      : buildDefaultKpis({
        headlineTotalTitle,
        selectedTotal,
        comparison,
        primaryLabel,
        primaryCount,
        secondaryLabel,
        secondaryCount,
        largestPrimary,
        largestSecondary: secondaryTreemapData[0],
        averageRowValue,
      });

  return {
    meta: buildSummaryMeta(selectedYears, rows.length),
    kpis,
    treemapTitle: `${treemapLabel} Expenditure`,
    treemapData,
    groupedTitle: `Top ${groupedLabel}`,
    groupedData,
    primaryMovesTitle: `Biggest Moves by ${primaryMovesLabel}`,
    primaryMovesData,
    secondaryMovesTitle: secondaryMovesLabel ? `Biggest Moves by ${secondaryMovesLabel}` : "",
    secondaryMovesData,
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
    searchPlaceholder: page.viewConfig.searchPlaceholder || `Search ${tableDimensionKeys.join(", ")}...`,
    getRowKey: (row, index) => `${page.id}-${row.id}-${index}`,
    getHoverLabel: (row) => (row.meta.pageNo ? `Page ${row.meta.pageNo}` : ""),
  };
}
