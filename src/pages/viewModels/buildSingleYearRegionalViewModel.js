import { formatMoneyCompact, numberFormatter } from "../../data/formatters";
import { buildGroupedSeries, buildTableRows, buildTreemapData, distinctCount, selectedWindowAverage } from "../../data/selectors";
import { buildAuditInfo, buildDatasetAuditSummary, buildRowDetailSections, buildRowAuditInfo, getPreferredHeadersForYears } from "./audit";
import { applyRowTransform, buildDimensionColumns, buildDrilldownOptions, buildSummaryMeta, buildYearColumns, getDimensionLabel, placeKpiFirst } from "./helpers";

export function buildSingleYearRegionalViewModel({ dataset, page, searchQuery, currencyDisplay }) {
  const rows = applyRowTransform(dataset.rows, page.viewConfig.rowTransform);
  const singleYear = dataset.years[0];
  const {
    primaryDimensionKey,
    secondaryDimensionKey,
    groupedDimensionKey = secondaryDimensionKey || primaryDimensionKey,
    tableDimensionKeys,
    searchDimensionKeys,
    drilldownConfig = null,
  } = page.viewConfig;

  const total = rows.reduce((sum, row) => sum + selectedWindowAverage(row.valuesByYear, [singleYear]), 0);
  const averageRowValue = rows.length ? total / rows.length : 0;
  const primaryLabel = getDimensionLabel(dataset, primaryDimensionKey);
  const secondaryLabel = getDimensionLabel(dataset, secondaryDimensionKey);
  const groupedLabel = getDimensionLabel(dataset, groupedDimensionKey);
  const primaryTreemapData = buildTreemapData(rows, primaryDimensionKey, [singleYear], singleYear);
  const secondaryTreemapData = buildTreemapData(rows, secondaryDimensionKey || primaryDimensionKey, [singleYear], singleYear);
  const secondarySeriesData = buildGroupedSeries(rows, groupedDimensionKey, [singleYear], 10);
  const effectiveSearchKeys = searchDimensionKeys || tableDimensionKeys;
  const allTableRows = buildTableRows(rows, [singleYear], singleYear, "", effectiveSearchKeys);
  const tableRows = buildTableRows(rows, [singleYear], singleYear, searchQuery, effectiveSearchKeys);
  const headlineTotalTitle = `${singleYear} Total`;
  const totalAudit = buildAuditInfo({
    page,
    rows,
    headers: getPreferredHeadersForYears(dataset, [singleYear]),
  });
  const drilldown = drilldownConfig
    ? (() => {
      const primaryKey = drilldownConfig.primaryKey;
      const secondaryKey = drilldownConfig.secondaryKey || "";
      const { primaryOptions, secondaryOptionsByPrimary, hasMeaningfulSecondary } = buildDrilldownOptions(
        rows,
        [singleYear],
        primaryKey,
        secondaryKey
      );

      return {
        primaryKey,
        primaryLabel: drilldownConfig.primaryLabel || getDimensionLabel(dataset, primaryKey),
        secondaryKey,
        secondaryLabel: drilldownConfig.secondaryLabel || getDimensionLabel(dataset, secondaryKey || primaryKey),
        primaryOptions: primaryOptions.map((option) => ({
          ...option,
          meta: `${option.rowCount} rows`,
        })),
        secondaryOptionsByPrimary: Object.fromEntries(
          Object.entries(secondaryOptionsByPrimary).map(([primaryValue, options]) => [
            primaryValue,
            options.map((option) => ({
              ...option,
              meta: `${option.rowCount} rows`,
            })),
          ])
        ),
        hasSecondaryFilter: Boolean(secondaryKey) && hasMeaningfulSecondary,
        breakdownMode: "dimension",
        breakdownDimensionKey: drilldownConfig.breakdownDimensionKey || groupedDimensionKey,
        title: drilldownConfig.title || "Selected Breakdown",
        emptyLabel: drilldownConfig.emptyLabel || "Select a department to display a focused regional breakdown.",
      };
    })()
    : null;
  const kpis = [
    {
      title: headlineTotalTitle,
      value: formatMoneyCompact(total, { currencyDisplay }),
      change: `Total amount across ${rows.length.toLocaleString("en-US")} records`,
      tone: "neutral",
      audit: totalAudit,
    },
    {
      title: `${primaryLabel} Count`,
      value: numberFormatter.format(distinctCount(rows, primaryDimensionKey, [singleYear])),
      change: `Distinct ${primaryLabel.toLowerCase()} values in the dataset`,
      tone: "neutral",
      audit: totalAudit,
    },
    {
      title: `${secondaryLabel} Count`,
      value: numberFormatter.format(distinctCount(rows, secondaryDimensionKey || primaryDimensionKey, [singleYear])),
      change: `Distinct ${secondaryLabel.toLowerCase()} values in the dataset`,
      tone: "neutral",
      audit: totalAudit,
    },
    {
      title: `Top ${primaryLabel}`,
      value: primaryTreemapData[0] ? formatMoneyCompact(primaryTreemapData[0].value, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
      change: primaryTreemapData[0]?.name || "No current data",
      tone: "neutral",
      audit: totalAudit,
    },
    {
      title: `Top ${secondaryLabel}`,
      value: secondaryTreemapData[0] ? formatMoneyCompact(secondaryTreemapData[0].value, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
      change: secondaryTreemapData[0]?.name || "No current data",
      tone: "neutral",
      audit: totalAudit,
    },
    {
      title: "Average Row Value",
      value: formatMoneyCompact(averageRowValue, { currencyDisplay }),
      change: "Average across rows in the selected year",
      tone: "neutral",
      audit: totalAudit,
    },
  ];

  return {
    meta: buildSummaryMeta([singleYear], rows.length),
    auditSummary: buildDatasetAuditSummary({ dataset, page }),
    currencyDisplay,
    kpis: placeKpiFirst(kpis, headlineTotalTitle),
    treemapTitle: `${primaryLabel} Allocation`,
    treemapData: primaryTreemapData.map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.[primaryDimensionKey] === item.name),
        headers: getPreferredHeadersForYears(dataset, [singleYear]),
      }),
    })),
    groupedTitle: `Top ${groupedLabel}`,
    groupedData: secondarySeriesData.map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.[groupedDimensionKey] === item.name),
        headers: getPreferredHeadersForYears(dataset, [singleYear]),
      }),
      auditByYear: {
        [singleYear]: buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.[groupedDimensionKey] === item.name),
          headers: [dataset.audit?.preferredValueFields?.[singleYear]].filter(Boolean),
        }),
      },
    })),
    groupedYears: [singleYear],
    allRows: rows,
    allTableRows,
    tableTitle: `${page.id} Allocation Detail`,
    tableRows,
    totalRowCount: rows.length,
    searchKeys: effectiveSearchKeys,
    drilldown,
    tableColumns: [
      ...buildDimensionColumns(dataset, tableDimensionKeys),
      ...buildYearColumns([singleYear], currencyDisplay),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || "Search allocation data...",
    getRowKey: (row, index) => `${page.id}-${row.id}-${index}`,
    getHoverLabel: (row) => {
      const audit = buildRowAuditInfo({
        page,
        row,
        headers: getPreferredHeadersForYears(dataset, [singleYear]),
      });
      return `${audit.sourceFile} • ${audit.pages.length ? `Page ${audit.pages.join(", ")}` : "Page unavailable"}`;
    },
    getRowDetail: (row) => buildRowDetailSections({ dataset, row }),
  };
}
