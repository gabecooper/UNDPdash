import { formatMoneyCompact } from "../../data/formatters";
import {
  buildComparisonMeta,
  buildGroupedSeries,
  buildMovers,
  buildTableRows,
  buildTreemapData,
  buildYearComparisonSeries,
  buildYearTotals,
  getSelectedYearValue,
} from "../../data/selectors";
import { buildAuditInfo, buildDatasetAuditSummary, buildRowDetailSections, buildRowAuditInfo, getPreferredHeadersForYears } from "./audit";
import { buildDimensionColumns, buildSummaryMeta, buildYearColumns, buildYearComparisonColumn, getComparisonYear, placeKpiFirst } from "./helpers";

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

function buildLargestItem(rows, selectedYears, mostRecentSelectedYear) {
  const rankedRows = rows
    .map((row) => ({
      row,
      selectedValue: getSelectedYearValue(row.valuesByYear, selectedYears),
      mostRecentValue: row.valuesByYear?.[mostRecentSelectedYear] || 0,
    }))
    .sort((left, right) => {
      const selectedDelta = right.selectedValue - left.selectedValue;
      if (selectedDelta) return selectedDelta;

      const recentDelta = right.mostRecentValue - left.mostRecentValue;
      if (recentDelta) return recentDelta;

      return (left.row.dimensions.itemName || "").localeCompare(right.row.dimensions.itemName || "");
    });

  return rankedRows[0] || null;
}

export function buildB1ViewModel({ dataset, selectedYears, searchQuery, page, currencyDisplay }) {
  const rows = dataset.rows;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);
  const totalAudit = buildAuditInfo({
    page,
    rows,
    headers: getPreferredHeadersForYears(dataset, selectedYears),
  });
  const largestItem = buildLargestItem(rows, selectedYears, mostRecentSelectedYear);
  const tableDimensionKeys = page.viewConfig.tableDimensionKeys;
  const searchDimensionKeys = page.viewConfig.searchDimensionKeys || tableDimensionKeys;
  const headlineTotalTitle = `${mostRecentSelectedYear} Total`;
  const yearComparisonColumn = buildYearComparisonColumn(selectedYears, currencyDisplay);
  const kpis = [
    buildValueKpi("Personnel Expenses", buildYearTotals(rows, (row) => isExpenseClassMatch(row, PERSONNEL_EXPENSES)), selectedYears, comparisonYear, currencyDisplay),
    buildValueKpi("Maintenance Expenses", buildYearTotals(rows, (row) => isExpenseClassMatch(row, MAINTENANCE_EXPENSES)), selectedYears, comparisonYear, currencyDisplay),
    buildValueKpi(headlineTotalTitle, buildYearTotals(rows), selectedYears, comparisonYear, currencyDisplay),
    buildValueKpi("Capital Outlays", buildYearTotals(rows, (row) => isExpenseClassMatch(row, CAPITAL_OUTLAYS)), selectedYears, comparisonYear, currencyDisplay),
    {
      title: "Largest Item",
      value: largestItem ? formatMoneyCompact(largestItem.selectedValue, { currencyDisplay }) : formatMoneyCompact(0, { currencyDisplay }),
      change: largestItem?.row.dimensions.itemName || "No data available",
      tone: "neutral",
      audit: totalAudit,
    },
    buildValueKpi("Donations Total", buildYearTotals(rows, isDonationRow), selectedYears, comparisonYear, currencyDisplay),
  ].map((kpi) => ({
    audit: totalAudit,
    ...kpi,
  }));

  return {
    meta: buildSummaryMeta(selectedYears, rows.length),
    auditSummary: buildDatasetAuditSummary({ dataset, page }),
    currencyDisplay,
    kpis: placeKpiFirst(kpis, headlineTotalTitle),
    treemapTitle: "Split by Sub Expense Class",
    treemapData: buildTreemapData(rows, "subExpenseClass", selectedYears, mostRecentSelectedYear).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.subExpenseClass === item.name),
        headers: getPreferredHeadersForYears(dataset, selectedYears),
      }),
    })),
    groupedTitle: "Top 10 Items",
    groupedData: buildGroupedSeries(rows, "itemName", selectedYears, 10).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.itemName === item.name),
        headers: getPreferredHeadersForYears(dataset, selectedYears),
      }),
      auditByYear: Object.fromEntries(
        selectedYears.map((year) => [year, buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.itemName === item.name),
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
    movesTitle: "Biggest Movers by Sub Expense Class",
    movesData: selectedYears.length > 1
      ? buildMovers(rows, "subExpenseClass", oldestSelectedYear, mostRecentSelectedYear).map((item) => ({
        ...item,
        audit: buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.subExpenseClass === item.name),
          headers: getPreferredHeadersForYears(dataset, [oldestSelectedYear, mostRecentSelectedYear]),
        }),
      }))
      : [],
    comparisonLabel: `${oldestSelectedYear} to ${mostRecentSelectedYear}`,
    isMultiYearSelection: selectedYears.length > 1,
    tableTitle: `${page.id} Data Table`,
    tableRows: buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, searchDimensionKeys),
    totalRowCount: rows.length,
    tableColumns: [
      ...buildDimensionColumns(dataset, tableDimensionKeys),
      ...buildYearColumns(selectedYears, currencyDisplay),
      ...(yearComparisonColumn ? [yearComparisonColumn] : []),
    ],
    searchPlaceholder: page.viewConfig.searchPlaceholder || "Search expense class, sub class, item...",
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
