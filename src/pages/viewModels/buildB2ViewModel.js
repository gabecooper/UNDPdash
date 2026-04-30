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
import { buildAuditInfo, buildDatasetAuditSummary, buildRowDetailSections, buildRowAuditInfo, getPreferredHeadersForYears } from "./audit";
import { buildDimensionColumns, buildDrilldownOptions, buildSummaryMeta, buildYearColumns, buildYearComparisonColumn, getComparisonYear, placeKpiFirst } from "./helpers";

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
    value: item?.value,
    change: item?.name || "No data available",
    tone: "neutral",
  };
}

function isCapitalOutlayRow(row) {
  return row.dimensions.expenseClass === "Capital Outlays";
}

function buildHighLevelCategorySeries(rows, selectedYears) {
  const categories = [
    {
      name: "Current Operating Expenditures",
      predicate: (row) => !isCapitalOutlayRow(row),
    },
    {
      name: "Capital Outlays",
      predicate: (row) => isCapitalOutlayRow(row),
    },
  ];

  return categories.map((category) => {
    const series = { name: category.name };
    selectedYears.forEach((year) => {
      series[year] = rows.reduce(
        (sum, row) => sum + (category.predicate(row) ? row.valuesByYear?.[year] || 0 : 0),
        0
      );
    });
    return series;
  });
}

export function buildB2ViewModel({ dataset, selectedYears, searchQuery, page, currencyDisplay }) {
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
  const breakdownKpis = latestBreakdownFields.map((field) => {
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
      title: field.label,
      value: formatMoneyCompact(totalsByYear[mostRecentSelectedYear] || 0, { currencyDisplay }),
      change: comparison.change,
      tone: comparison.tone,
      audit: buildAuditInfo({
        page,
        rows,
        headers: [field.source],
      }),
    };
  });
  const rankedObjects = buildRankedGroups(rows, "objectExpenditure", selectedYears, mostRecentSelectedYear);
  const rankedExpenseClasses = buildRankedGroups(rows, "expenseClass", selectedYears, mostRecentSelectedYear);
  const tableDimensionKeys = page.viewConfig.tableDimensionKeys;
  const searchDimensionKeys = page.viewConfig.searchDimensionKeys || tableDimensionKeys;
  const headlineTotalTitle = `${mostRecentSelectedYear} Total`;
  const yearComparisonColumn = buildYearComparisonColumn(selectedYears, currencyDisplay);
  const allTableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, "", searchDimensionKeys);
  const { primaryOptions } = buildDrilldownOptions(rows, selectedYears, "deptName");
  const kpis = [
    buildValueKpi(headlineTotalTitle, buildYearTotals(rows), selectedYears, comparisonYear, currencyDisplay),
    ...breakdownKpis,
    buildValueKpi(
      "Current Operating Expenditures",
      buildYearTotals(rows, (row) => !isCapitalOutlayRow(row)),
      selectedYears,
      comparisonYear,
      currencyDisplay
    ),
    buildValueKpi(
      "Capital Outlays",
      buildYearTotals(rows, isCapitalOutlayRow),
      selectedYears,
      comparisonYear,
      currencyDisplay
    ),
    {
      title: "Objects on Budget Sheet",
      value: numberFormatter.format(distinctCount(rows, "objectExpenditure", selectedYears)),
      change: "Distinct funded object expenditures across selected years",
      tone: "neutral",
    },
  ].slice(0, 6).map((kpi) => ({
    audit: totalAudit,
    ...kpi,
  }));

  return {
    meta: buildSummaryMeta(selectedYears, rows.length),
    auditSummary: buildDatasetAuditSummary({ dataset, page }),
    currencyDisplay,
    kpis: placeKpiFirst(kpis, headlineTotalTitle),
    treemapTitle: "Split by Department",
    treemapData: buildTreemapData(rows, "deptName", selectedYears, mostRecentSelectedYear).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.deptName === item.name),
        headers: getPreferredHeadersForYears(dataset, selectedYears),
      }),
    })),
    groupedTitle: "Top 10 Object Expenditures",
    groupedData: buildGroupedSeries(rows, "objectExpenditure", selectedYears, 10).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.objectExpenditure === item.name),
        headers: getPreferredHeadersForYears(dataset, selectedYears),
      }),
      auditByYear: Object.fromEntries(
        selectedYears.map((year) => [year, buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.objectExpenditure === item.name),
          headers: [dataset.audit?.preferredValueFields?.[year]].filter(Boolean),
        })])
      ),
    })),
    yearComparisonData: buildYearComparisonSeries(buildYearTotals(rows), selectedYears, rows).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows,
        headers: [dataset.audit?.preferredValueFields?.[item.year]].filter(Boolean),
      }),
    })),
    movesTitle: "Biggest Movers by Department",
    movesData: selectedYears.length > 1
      ? buildMovers(rows, "deptName", oldestSelectedYear, mostRecentSelectedYear).map((item) => ({
        ...item,
        audit: buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.deptName === item.name),
          headers: getPreferredHeadersForYears(dataset, [oldestSelectedYear, mostRecentSelectedYear]),
        }),
      }))
      : [],
    comparisonLabel: `${oldestSelectedYear} to ${mostRecentSelectedYear}`,
    isMultiYearSelection: selectedYears.length > 1,
    allRows: rows,
    allTableRows,
    tableTitle: `${page.id} Data Table`,
    tableRows: buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, searchDimensionKeys),
    totalRowCount: rows.length,
    searchKeys: searchDimensionKeys,
    departmentOptions: primaryOptions.map((option) => ({
      ...option,
      meta: `${option.rowCount} rows`,
    })),
    categoryBreakdownData: buildHighLevelCategorySeries(rows, selectedYears),
    largestExpenseClassKpi: {
      ...buildLargestGroupKpi("Largest Expense Class", rankedExpenseClasses[0]),
      value: formatMoneyCompact(rankedExpenseClasses[0]?.value || 0, { currencyDisplay }),
    },
    largestObjectKpi: {
      ...buildLargestGroupKpi("Largest Object Expenditure", rankedObjects[0]),
      value: formatMoneyCompact(rankedObjects[0]?.value || 0, { currencyDisplay }),
    },
    tableColumns: [
      ...buildDimensionColumns(dataset, tableDimensionKeys),
      ...buildYearColumns(selectedYears, currencyDisplay),
      ...(yearComparisonColumn ? [yearComparisonColumn] : []),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || "Search department, class, object, type...",
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
