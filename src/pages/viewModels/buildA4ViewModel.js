import { formatPesoCompact, numberFormatter } from "../../data/formatters";
import {
  aggregateAllYears,
  buildComparisonMeta,
  buildGroupedSeries,
  buildMovers,
  buildTableRows,
  buildTreemapData,
  buildYearTotals,
  distinctCount,
  getRowYearValue,
  selectedWindowAverage,
} from "../../data/selectors";
import { buildDimensionColumns, buildSelectedAverageColumn, buildSummaryMeta, buildYearColumns, getComparisonYear, placeKpiFirst } from "./helpers";

const PUBLIC_WORKS_DEPARTMENT = "Department of Public Works and Highways";

export function buildA4ViewModel({ dataset, selectedYears, searchQuery }) {
  const rows = dataset.rows;
  const isMultiYearSelection = selectedYears.length > 1;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);
  const comparisonLabel = `${oldestSelectedYear} to ${mostRecentSelectedYear}`;

  const overallTotalsByYear = buildYearTotals(rows);
  const continuingTotalsByYear = buildYearTotals(rows, (row) => row.dimensions.appropriationType === "Continuing");
  const totalsExcludingPublicWorksByYear = buildYearTotals(rows, (row) => row.dimensions.dept !== PUBLIC_WORKS_DEPARTMENT);
  const newGeneralTotalsByYear = buildYearTotals(rows, (row) => row.dimensions.appropriationType === "New General");
  const automaticTotalsByYear = buildYearTotals(rows, (row) => row.dimensions.appropriationType === "Automatic");

  const selectedYearTotal = selectedWindowAverage(overallTotalsByYear, selectedYears);
  const continuingSelectedTotal = selectedWindowAverage(continuingTotalsByYear, selectedYears);
  const selectedTotalExcludingPublicWorks = selectedWindowAverage(totalsExcludingPublicWorksByYear, selectedYears);
  const newGeneralSelectedTotal = selectedWindowAverage(newGeneralTotalsByYear, selectedYears);
  const automaticSelectedTotal = selectedWindowAverage(automaticTotalsByYear, selectedYears);

  const yearTotalComparison = buildComparisonMeta(
    selectedYearTotal,
    comparisonYear ? overallTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );
  const publicWorksComparison = buildComparisonMeta(
    selectedTotalExcludingPublicWorks,
    comparisonYear ? totalsExcludingPublicWorksByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );
  const continuingComparison = buildComparisonMeta(
    continuingSelectedTotal,
    comparisonYear ? continuingTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );
  const newGeneralComparison = buildComparisonMeta(
    newGeneralSelectedTotal,
    comparisonYear ? newGeneralTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );
  const automaticComparison = buildComparisonMeta(
    automaticSelectedTotal,
    comparisonYear ? automaticTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );

  const fundedAgencyCount = distinctCount(rows, "agency", selectedYears);
  const departmentTreemapData = buildTreemapData(rows, "dept", selectedYears, mostRecentSelectedYear);
  const topAgencyData = buildGroupedSeries(rows, "agency", selectedYears, 10);
  const biggestDepartmentMoves = isMultiYearSelection ? buildMovers(rows, "dept", oldestSelectedYear, mostRecentSelectedYear) : [];
  const biggestAgencyMoves = isMultiYearSelection ? buildMovers(rows, "agency", oldestSelectedYear, mostRecentSelectedYear) : [];

  const tableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, [
    "dept",
    "agency",
    "appropriationType",
    "category",
    "itemName",
  ]);
  const headlineTotalTitle = selectedYears.length > 1 ? "Year Average" : "Year Total";
  const kpis = [
    {
      title: headlineTotalTitle,
      value: formatPesoCompact(selectedYearTotal),
      change: yearTotalComparison.change,
      tone: yearTotalComparison.tone,
    },
    {
      title: "New General Total",
      value: formatPesoCompact(newGeneralSelectedTotal),
      change: newGeneralComparison.change,
      tone: newGeneralComparison.tone,
    },
    {
      title: "Spending - Public Works",
      value: formatPesoCompact(selectedTotalExcludingPublicWorks),
      change: publicWorksComparison.change,
      tone: publicWorksComparison.tone,
    },
    {
      title: "Automatic Total",
      value: formatPesoCompact(automaticSelectedTotal),
      change: automaticComparison.change,
      tone: automaticComparison.tone,
    },
    {
      title: "# of Agencies Funded",
      value: numberFormatter.format(fundedAgencyCount),
      change: "Distinct funded agencies across selected years",
      tone: "neutral",
    },
    {
      title: "Continuing Total",
      value: formatPesoCompact(continuingSelectedTotal),
      change: continuingComparison.change,
      tone: continuingComparison.tone,
    },
  ];

  return {
    meta: buildSummaryMeta(selectedYears, rows.length, "line items"),
    kpis: placeKpiFirst(kpis, headlineTotalTitle),
    departmentTreemapData,
    topAgencyData,
    biggestDepartmentMoves,
    biggestAgencyMoves,
    comparisonLabel,
    isMultiYearSelection,
    tableTitle: "A.4 Data Table",
    tableRows,
    totalRowCount: rows.length,
    tableColumns: [
      ...buildDimensionColumns(dataset, ["dept", "agency", "appropriationType", "category", "itemName"]),
      ...buildYearColumns(selectedYears),
      ...(selectedYears.length > 1 ? [buildSelectedAverageColumn()] : []),
    ],
    getRowKey: (row, index) => `${row.dimensions.dept}-${row.dimensions.agency}-${row.dimensions.itemName}-${index}`,
    getHoverLabel: (row) => (row.meta.pageNo ? `Page ${row.meta.pageNo}` : ""),
  };
}
