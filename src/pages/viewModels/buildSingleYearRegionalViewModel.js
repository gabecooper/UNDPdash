import { formatPesoCompact, numberFormatter } from "../../data/formatters";
import { buildGroupedSeries, buildTableRows, buildTreemapData, distinctCount, selectedWindowAverage } from "../../data/selectors";
import { buildDimensionColumns, buildSummaryMeta, buildYearColumns, getDimensionLabel, placeKpiFirst } from "./helpers";

export function buildSingleYearRegionalViewModel({ dataset, page, searchQuery }) {
  const rows = dataset.rows;
  const singleYear = dataset.years[0];
  const {
    primaryDimensionKey,
    secondaryDimensionKey,
    groupedDimensionKey = secondaryDimensionKey || primaryDimensionKey,
    tableDimensionKeys,
    searchDimensionKeys,
  } = page.viewConfig;

  const total = rows.reduce((sum, row) => sum + selectedWindowAverage(row.valuesByYear, [singleYear]), 0);
  const averageRowValue = rows.length ? total / rows.length : 0;
  const primaryLabel = getDimensionLabel(dataset, primaryDimensionKey);
  const secondaryLabel = getDimensionLabel(dataset, secondaryDimensionKey);
  const groupedLabel = getDimensionLabel(dataset, groupedDimensionKey);
  const primaryTreemapData = buildTreemapData(rows, primaryDimensionKey, [singleYear], singleYear);
  const secondaryTreemapData = buildTreemapData(rows, secondaryDimensionKey || primaryDimensionKey, [singleYear], singleYear);
  const secondarySeriesData = buildGroupedSeries(rows, groupedDimensionKey, [singleYear], 10);
  const tableRows = buildTableRows(rows, [singleYear], singleYear, searchQuery, searchDimensionKeys || tableDimensionKeys);
  const headlineTotalTitle = `${singleYear} Total`;
  const kpis = [
    {
      title: headlineTotalTitle,
      value: formatPesoCompact(total),
      change: `Total amount across ${rows.length.toLocaleString("en-US")} records`,
      tone: "neutral",
    },
    {
      title: `${primaryLabel} Count`,
      value: numberFormatter.format(distinctCount(rows, primaryDimensionKey, [singleYear])),
      change: `Distinct ${primaryLabel.toLowerCase()} values in the dataset`,
      tone: "neutral",
    },
    {
      title: `${secondaryLabel} Count`,
      value: numberFormatter.format(distinctCount(rows, secondaryDimensionKey || primaryDimensionKey, [singleYear])),
      change: `Distinct ${secondaryLabel.toLowerCase()} values in the dataset`,
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
      change: "Average across rows in the selected year",
      tone: "neutral",
    },
  ];

  return {
    meta: buildSummaryMeta([singleYear], rows.length),
    kpis: placeKpiFirst(kpis, headlineTotalTitle),
    treemapTitle: `${primaryLabel} Allocation`,
    treemapData: primaryTreemapData,
    groupedTitle: `Top ${groupedLabel}`,
    groupedData: secondarySeriesData,
    groupedYears: [singleYear],
    tableTitle: `${page.id} Allocation Detail`,
    tableRows,
    totalRowCount: rows.length,
    tableColumns: [
      ...buildDimensionColumns(dataset, tableDimensionKeys),
      ...buildYearColumns([singleYear]),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || "Search allocation data...",
    getRowKey: (row, index) => `${page.id}-${row.id}-${index}`,
    getHoverLabel: (row) => (row.meta.pageNo ? `Page ${row.meta.pageNo}` : ""),
  };
}
