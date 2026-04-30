import { formatMoneyCompact, numberFormatter } from "../../data/formatters";
import {
  buildComparisonMeta,
  buildGroupedSeries,
  buildMovers,
  buildTableRows,
  buildTreemapData,
  buildYearComparisonSeries,
  buildYearTotals,
  distinctCount,
  getSelectedYearValue,
} from "../../data/selectors";
import {
  buildDimensionColumns,
  buildLargestGroupLabel,
  buildSummaryMeta,
  buildYearColumns,
  buildYearComparisonColumn,
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

function buildValueKpi(title, totalsByYear, selectedYears, comparisonYear, currencyDisplay) {
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

function buildLargestItems(rows, selectedYears, limit = 2) {
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];

  return rows
    .map((row) => ({
      itemName: row.dimensions.itemName || "Unspecified",
      selectedValue: getSelectedYearValue(row.valuesByYear, selectedYears),
      mostRecentValue: row.valuesByYear?.[mostRecentSelectedYear] || 0,
    }))
    .filter((item) => item.selectedValue > 0)
    .sort((left, right) => {
      const averageDelta = right.selectedValue - left.selectedValue;
      if (averageDelta) return averageDelta;

      const recentDelta = right.mostRecentValue - left.mostRecentValue;
      if (recentDelta) return recentDelta;

      return left.itemName.localeCompare(right.itemName);
    })
    .slice(0, limit);
}

function buildLargestItemKpi(title, item, currencyDisplay) {
  return {
    title,
    value: item ? formatMoneyCompact(item.selectedValue, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
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
  currencyDisplay,
}) {
  return placeKpiFirst([
    {
      title: headlineTotalTitle,
      value: formatMoneyCompact(selectedTotal, { currencyDisplay }),
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
      value: largestPrimary ? formatMoneyCompact(largestPrimary.value, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
      change: buildLargestGroupLabel(largestPrimary?.name, largestPrimary?.value || 0, currencyDisplay),
      tone: "neutral",
    },
    {
      title: `Largest ${secondaryLabel}`,
      value: largestSecondary ? formatMoneyCompact(largestSecondary.value, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
      change: buildLargestGroupLabel(largestSecondary?.name, largestSecondary?.value || 0, currencyDisplay),
      tone: "neutral",
    },
    {
      title: "Average Row Value",
      value: formatMoneyCompact(averageRowValue, { currencyDisplay }),
      change: "Average across rows in the latest selected year",
      tone: "neutral",
    },
  ], headlineTotalTitle);
}

function buildCofogHeadlineKpis({ rows, selectedYears, comparisonYear, headlineTotalTitle, currencyDisplay }) {
  return placeKpiFirst([
    buildValueKpi(headlineTotalTitle, buildYearTotals(rows), selectedYears, comparisonYear, currencyDisplay),
    ...COFOG_HEADLINE_CATEGORIES.map(({ title, match }) => (
      buildValueKpi(title, buildYearTotals(rows, (row) => row.dimensions.cofogCategory === match), selectedYears, comparisonYear, currencyDisplay)
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
  currencyDisplay,
}) {
  const [largestItem, secondLargestItem] = buildLargestItems(rows, selectedYears, 2);

  return placeKpiFirst([
    {
      title: headlineTotalTitle,
      value: formatMoneyCompact(selectedTotal, { currencyDisplay }),
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
      value: largestPrimary ? formatMoneyCompact(largestPrimary.value, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
      change: buildLargestGroupLabel(largestPrimary?.name, largestPrimary?.value || 0, currencyDisplay),
      tone: "neutral",
    },
    buildLargestItemKpi("Largest Item", largestItem, currencyDisplay),
    buildLargestItemKpi("Second Largest Item", secondLargestItem, currencyDisplay),
  ], headlineTotalTitle);
}

export function buildMultiYearSummaryViewModel({ dataset, selectedYears, searchQuery, page, currencyDisplay }) {
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
  const selectedTotal = getSelectedYearValue(overallTotalsByYear, selectedYears);
  const comparison = buildComparisonMeta(
    selectedTotal,
    comparisonYear ? overallTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );

  const headlineTotalTitle = `${mostRecentSelectedYear} Total`;
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
    ? rows.reduce((sum, row) => sum + (row.valuesByYear?.[mostRecentSelectedYear] || 0), 0) / rows.length
    : 0;
  const largestPrimary = treemapData[0];
  const tableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, searchDimensionKeys || tableDimensionKeys);
  const yearComparisonColumn = buildYearComparisonColumn(selectedYears, currencyDisplay);

  const kpis = customKpiMode === "cofogHeadlineTotals"
    ? buildCofogHeadlineKpis({ rows, selectedYears, comparisonYear, headlineTotalTitle, currencyDisplay })
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
        currencyDisplay,
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
        currencyDisplay,
      });

  return {
    meta: buildSummaryMeta(selectedYears, rows.length),
    kpis,
    treemapTitle: `${treemapLabel} Expenditure`,
    treemapData,
    groupedTitle: `Top ${groupedLabel}`,
    groupedData,
    yearComparisonData: buildYearComparisonSeries(overallTotalsByYear, selectedYears),
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
      ...buildYearColumns(selectedYears, currencyDisplay),
      ...(yearComparisonColumn ? [yearComparisonColumn] : []),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || `Search ${tableDimensionKeys.join(", ")}...`,
    getRowKey: (row, index) => `${page.id}-${row.id}-${index}`,
    getHoverLabel: (row) => (row.meta.pageNo ? `Page ${row.meta.pageNo}` : ""),
  };
}
