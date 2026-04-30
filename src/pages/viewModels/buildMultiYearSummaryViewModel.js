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
  buildAuditInfo,
  buildDatasetAuditSummary,
  buildRowDetailSections,
  buildRowAuditInfo,
  getPreferredHeadersForYears,
} from "./audit";
import {
  buildDimensionColumns,
  buildDrilldownOptions,
  buildLargestGroupLabel,
  buildSummaryMeta,
  buildYearColumns,
  buildYearComparisonColumn,
  getComparisonYear,
  getDimensionLabel,
  applyRowTransform,
  placeKpiFirst,
} from "./helpers";

const COFOG_HEADLINE_CATEGORIES = [
  { title: "Defense", match: "DEFENSE" },
  { title: "Health", match: "HEALTH" },
  { title: "Public Order", match: "PUBLIC ORDER AND SAFETY" },
  { title: "Education", match: "EDUCATION" },
  { title: "General Public", match: "GENERAL PUBLIC SERVICES" },
];

function buildValueKpi(title, totalsByYear, selectedYears, comparisonYear, currencyDisplay, audit) {
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
    audit,
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

function buildLargestItemKpi(title, item, currencyDisplay, audit) {
  return {
    title,
    value: item ? formatMoneyCompact(item.selectedValue, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
    change: item?.itemName || "No current data",
    tone: "neutral",
    audit,
  };
}

function buildDefaultSupportKpis({
  comparison,
  primaryLabel,
  primaryCount,
  secondaryLabel,
  secondaryCount,
  largestPrimary,
  largestSecondary,
  averageRowValue,
  currencyDisplay,
  audit,
}) {
  return [
    {
      title: `${primaryLabel} Groups`,
      value: numberFormatter.format(primaryCount),
      change: `Distinct ${primaryLabel.toLowerCase()} groups with funded rows`,
      tone: "neutral",
      audit,
    },
    {
      title: `${secondaryLabel} Groups`,
      value: numberFormatter.format(secondaryCount),
      change: `Distinct ${secondaryLabel.toLowerCase()} groups with funded rows`,
      tone: "neutral",
      audit,
    },
    {
      title: `Largest ${primaryLabel}`,
      value: largestPrimary ? formatMoneyCompact(largestPrimary.value, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
      change: buildLargestGroupLabel(largestPrimary?.name, largestPrimary?.value || 0, currencyDisplay),
      tone: "neutral",
      audit,
    },
    {
      title: `Largest ${secondaryLabel}`,
      value: largestSecondary ? formatMoneyCompact(largestSecondary.value, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
      change: buildLargestGroupLabel(largestSecondary?.name, largestSecondary?.value || 0, currencyDisplay),
      tone: "neutral",
      audit,
    },
    {
      title: "Average Row Value",
      value: formatMoneyCompact(averageRowValue, { currencyDisplay }),
      change: comparison.change || "Average across rows in the latest selected year",
      tone: "neutral",
      audit,
    },
  ];
}

function buildCofogHeadlineKpis({ rows, selectedYears, comparisonYear, headlineTotalTitle, currencyDisplay, page, dataset }) {
  const totalAudit = buildAuditInfo({
    page,
    rows,
    headers: getPreferredHeadersForYears(dataset, selectedYears),
  });

  return placeKpiFirst([
    buildValueKpi(headlineTotalTitle, buildYearTotals(rows), selectedYears, comparisonYear, currencyDisplay, totalAudit),
    ...COFOG_HEADLINE_CATEGORIES.map(({ title, match }) => (
      buildValueKpi(
        title,
        buildYearTotals(rows, (row) => row.dimensions.cofogCategory === match),
        selectedYears,
        comparisonYear,
        currencyDisplay,
        totalAudit
      )
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
  audit,
}) {
  const [largestItem, secondLargestItem] = buildLargestItems(rows, selectedYears, 2);

  return placeKpiFirst([
    {
      title: headlineTotalTitle,
      value: formatMoneyCompact(selectedTotal, { currencyDisplay }),
      change: comparison.change,
      tone: comparison.tone,
      audit,
    },
    {
      title: `${primaryLabel} Groups`,
      value: numberFormatter.format(primaryCount),
      change: `Distinct ${primaryLabel.toLowerCase()} groups with funded rows`,
      tone: "neutral",
      audit,
    },
    {
      title: `${secondaryLabel} Groups`,
      value: numberFormatter.format(secondaryCount),
      change: `Distinct ${secondaryLabel.toLowerCase()} groups with funded rows`,
      tone: "neutral",
      audit,
    },
    {
      title: `Largest ${primaryLabel}`,
      value: largestPrimary ? formatMoneyCompact(largestPrimary.value, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
      change: buildLargestGroupLabel(largestPrimary?.name, largestPrimary?.value || 0, currencyDisplay),
      tone: "neutral",
      audit,
    },
    buildLargestItemKpi("Largest Item", largestItem, currencyDisplay, audit),
    buildLargestItemKpi("Second Largest Item", secondLargestItem, currencyDisplay, audit),
  ], headlineTotalTitle);
}

function buildBreakdownSeries({ dataset, rows, selectedYears, page }) {
  const latestYear = selectedYears[selectedYears.length - 1];
  const latestFields = (dataset.yearBreakdownFields?.[latestYear] || []).filter((field) => !field.isTotal && !field.isPercent);

  if (latestFields.length <= 1) {
    return [];
  }

  return latestFields
    .map((field) => {
      const series = {
        name: field.label,
        audit: buildAuditInfo({ page, rows, headers: [field.source] }),
        auditByYear: {},
      };

      selectedYears.forEach((year) => {
        const matchingField = (dataset.yearBreakdownFields?.[year] || []).find((candidate) => candidate.key === field.key);
        const value = rows.reduce((sum, row) => sum + (row.meta?.yearBreakdowns?.[year]?.[field.key] || 0), 0);
        series[year] = value;

        if (matchingField) {
          series.auditByYear[year] = buildAuditInfo({ page, rows, headers: [matchingField.source] });
        }
      });

      return series;
    })
    .filter((item) => selectedYears.some((year) => item[year] > 0))
    .sort((left, right) => {
      const valueDelta = (right[latestYear] || 0) - (left[latestYear] || 0);
      if (valueDelta) return valueDelta;
      return left.name.localeCompare(right.name);
    });
}

function buildBreakdownKpis({ breakdownSeries, selectedYears, comparisonYear, currencyDisplay }) {
  const latestYear = selectedYears[selectedYears.length - 1];

  return breakdownSeries.slice(0, 5).map((item) => {
    const comparison = buildComparisonMeta(
      item[latestYear] || 0,
      comparisonYear ? item[comparisonYear] || 0 : 0,
      Boolean(comparisonYear)
    );

    return {
      title: item.name,
      value: formatMoneyCompact(item[latestYear] || 0, { currencyDisplay }),
      change: comparison.change,
      tone: comparison.tone,
      audit: item.auditByYear?.[latestYear] || item.audit,
    };
  });
}

export function buildMultiYearSummaryViewModel({ dataset, selectedYears, searchQuery, page, currencyDisplay }) {
  const rows = applyRowTransform(dataset.rows, page.viewConfig.rowTransform);
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
    groupedChartMode,
    drilldownConfig = null,
  } = page.viewConfig;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);
  const totalAudit = buildAuditInfo({
    page,
    rows,
    headers: getPreferredHeadersForYears(dataset, selectedYears),
  });

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
  const treemapData = buildTreemapData(rows, treemapDimensionKey, selectedYears, mostRecentSelectedYear)
    .map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.[treemapDimensionKey] === item.name),
        headers: getPreferredHeadersForYears(dataset, selectedYears),
      }),
    }));
  const secondaryTreemapData = buildTreemapData(rows, secondaryDimensionKey || primaryDimensionKey, selectedYears, mostRecentSelectedYear);
  const breakdownSeries = buildBreakdownSeries({ dataset, rows, selectedYears, page });
  const groupedData = groupedChartMode === "breakdown" && breakdownSeries.length
    ? breakdownSeries
    : buildGroupedSeries(rows, groupedDimensionKey, selectedYears, 10)
      .map((item) => ({
        ...item,
        audit: buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.[groupedDimensionKey] === item.name),
          headers: getPreferredHeadersForYears(dataset, selectedYears),
        }),
        auditByYear: Object.fromEntries(
          selectedYears.map((year) => [year, buildAuditInfo({
            page,
            rows: rows.filter((row) => row.dimensions?.[groupedDimensionKey] === item.name),
            headers: [dataset.audit?.preferredValueFields?.[year]].filter(Boolean),
          })])
        ),
      }));
  const primaryMovesData = selectedYears.length > 1
    ? buildMovers(rows, primaryMovesDimensionKey, oldestSelectedYear, mostRecentSelectedYear).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.[primaryMovesDimensionKey] === item.name),
        headers: getPreferredHeadersForYears(dataset, [oldestSelectedYear, mostRecentSelectedYear]),
      }),
    }))
    : [];
  const secondaryMovesData = secondaryMovesDimensionKey && selectedYears.length > 1
    ? buildMovers(rows, secondaryMovesDimensionKey, oldestSelectedYear, mostRecentSelectedYear).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.[secondaryMovesDimensionKey] === item.name),
        headers: getPreferredHeadersForYears(dataset, [oldestSelectedYear, mostRecentSelectedYear]),
      }),
    }))
    : [];
  const averageRowValue = rows.length
    ? rows.reduce((sum, row) => sum + (row.valuesByYear?.[mostRecentSelectedYear] || 0), 0) / rows.length
    : 0;
  const effectiveSearchKeys = searchDimensionKeys || tableDimensionKeys;
  const allTableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, "", effectiveSearchKeys);
  const tableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, effectiveSearchKeys);
  const yearComparisonColumn = buildYearComparisonColumn(selectedYears, currencyDisplay);
  const drilldown = drilldownConfig
    ? (() => {
      const primaryKey = drilldownConfig.primaryKey;
      const secondaryKey = drilldownConfig.secondaryKey || "";
      const { primaryOptions, secondaryOptionsByPrimary, hasMeaningfulSecondary } = buildDrilldownOptions(
        rows,
        selectedYears,
        primaryKey,
        secondaryKey
      );
      const latestBreakdownFields = (dataset.yearBreakdownFields?.[mostRecentSelectedYear] || [])
        .filter((field) => !field.isTotal && !field.isPercent);

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
        breakdownMode: drilldownConfig.breakdownMode || "dimension",
        breakdownDimensionKey: drilldownConfig.breakdownDimensionKey || groupedDimensionKey,
        breakdownFields: latestBreakdownFields,
        title: drilldownConfig.title || "Selected Breakdown",
        emptyLabel: drilldownConfig.emptyLabel || "Select a department to display a focused breakdown.",
      };
    })()
    : null;

  const totalKpi = {
    title: headlineTotalTitle,
    value: formatMoneyCompact(selectedTotal, { currencyDisplay }),
    change: comparison.change,
    tone: comparison.tone,
    audit: totalAudit,
  };

  const defaultSupportKpis = buildDefaultSupportKpis({
    comparison,
    primaryLabel,
    primaryCount,
    secondaryLabel,
    secondaryCount,
    largestPrimary: treemapData[0],
    largestSecondary: secondaryTreemapData[0],
    averageRowValue,
    currencyDisplay,
    audit: totalAudit,
  });

  const kpis = customKpiMode === "cofogHeadlineTotals"
    ? buildCofogHeadlineKpis({ rows, selectedYears, comparisonYear, headlineTotalTitle, currencyDisplay, page, dataset })
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
        largestPrimary: treemapData[0],
        currencyDisplay,
        audit: totalAudit,
      })
      : placeKpiFirst([
        totalKpi,
        ...buildBreakdownKpis({
          breakdownSeries,
          selectedYears,
          comparisonYear,
          currencyDisplay,
        }),
        ...defaultSupportKpis,
      ].slice(0, 6), headlineTotalTitle);

  return {
    meta: buildSummaryMeta(selectedYears, rows.length),
    auditSummary: buildDatasetAuditSummary({ dataset, page }),
    currencyDisplay,
    kpis,
    treemapTitle: `${treemapLabel} Expenditure`,
    treemapData,
    groupedTitle: groupedChartMode === "breakdown" && breakdownSeries.length
      ? `${mostRecentSelectedYear} Breakdown`
      : `Top ${groupedLabel}`,
    groupedData,
    yearComparisonData: buildYearComparisonSeries(overallTotalsByYear, selectedYears, rows).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows,
        headers: [dataset.audit?.preferredValueFields?.[item.year]].filter(Boolean),
      }),
    })),
    primaryMovesTitle: `Biggest Moves by ${primaryMovesLabel}`,
    primaryMovesData,
    secondaryMovesTitle: secondaryMovesLabel ? `Biggest Moves by ${secondaryMovesLabel}` : "",
    secondaryMovesData,
    comparisonLabel: `${oldestSelectedYear} to ${mostRecentSelectedYear}`,
    isMultiYearSelection: selectedYears.length > 1,
    allRows: rows,
    allTableRows,
    tableTitle: `${page.id} Data Table`,
    tableRows,
    totalRowCount: rows.length,
    searchKeys: effectiveSearchKeys,
    drilldown,
    tableColumns: [
      ...buildDimensionColumns(dataset, tableDimensionKeys),
      ...buildYearColumns(selectedYears, currencyDisplay),
      ...(yearComparisonColumn ? [yearComparisonColumn] : []),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || `Search ${tableDimensionKeys.join(", ")}...`,
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
