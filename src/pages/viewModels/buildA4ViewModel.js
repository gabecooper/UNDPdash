import { formatMoneyCompact } from "../../data/formatters";
import {
  buildComparisonMeta,
  buildMovers,
  buildTableRows,
  buildTreemapData,
  buildYearComparisonSeries,
  buildYearTotals,
  getSelectedYearValue,
} from "../../data/selectors";
import { buildAuditInfo, buildDatasetAuditSummary, buildRowDetailSections, buildRowAuditInfo, getPreferredHeadersForYears } from "./audit";
import { buildDimensionColumns, buildSummaryMeta, buildYearColumns, buildYearComparisonColumn, getComparisonYear } from "./helpers";

const GOCC_DEPARTMENTS = new Set(["Budgetary Support to Government Corporations"]);
const LGU_DEPARTMENTS = new Set([
  "Allocations to Local Government Units",
  "Local Government Support Fund",
  "National Tax Allotment2",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)3",
]);
const SECTOR_ORDER = ["NGA", "GOCC", "LGU"];
const ALL_YEARS = ["2024", "2025", "2026"];

function sumRowsByYear(rows) {
  return rows.reduce((accumulator, row) => {
    ALL_YEARS.forEach((year) => {
      accumulator[year] += row.valuesByYear?.[year] || 0;
    });
    return accumulator;
  }, { "2024": 0, "2025": 0, "2026": 0 });
}

function hasGoCcSignal(text) {
  return /government-owned|controlled corporations|gocc/i.test(text);
}

function hasLguSignal(text) {
  return /local government units?|financial assistance to local government units|internal revenue allotment|barmm/i.test(text);
}

function getSectorForRow(row) {
  const department = row.dimensions.dept || "";
  const category = row.dimensions.category || "";
  const itemName = row.dimensions.itemName || "";
  const agency = row.dimensions.agency || "";
  const combined = `${department} ${category} ${itemName} ${agency}`;

  if (GOCC_DEPARTMENTS.has(department) || hasGoCcSignal(combined)) return "GOCC";
  if (LGU_DEPARTMENTS.has(department) || hasLguSignal(combined)) return "LGU";
  return "NGA";
}

function getSectorForDepartment(department) {
  if (GOCC_DEPARTMENTS.has(department)) return "GOCC";
  if (LGU_DEPARTMENTS.has(department)) return "LGU";
  return "NGA";
}

function normalizeLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isRealAgencyName(agency) {
  const normalized = normalizeLabel(agency);
  return normalized !== "" && normalized !== "none" && normalized !== "unspecified";
}

function isDepartmentProperAgency(department, agency) {
  const normalizedDepartment = normalizeLabel(department);
  const normalizedAgency = normalizeLabel(agency);

  if (!isRealAgencyName(agency)) return false;
  if (normalizedAgency === normalizedDepartment) return true;
  if (normalizedAgency.includes(normalizedDepartment) || normalizedDepartment.includes(normalizedAgency)) return true;
  if (normalizedAgency.includes("office of the secretary")) return true;
  if (department === "Office of the President" && normalizedAgency.includes("president")) return true;
  return false;
}

function buildDepartmentChartData(rows, selectedYears, dataset, page) {
  const departments = new Map();

  rows.forEach((row) => {
    const department = row.dimensions.dept || "Unspecified";
    if (!departments.has(department)) {
      departments.set(department, []);
    }
    departments.get(department).push(row);
  });

  return [...departments.entries()]
    .map(([department, departmentRows]) => {
      const realAgencies = new Set(
        departmentRows.map((row) => row.dimensions.agency).filter((agency) => isRealAgencyName(agency))
      );
      const departmentProperRows = departmentRows.filter((row) =>
        isDepartmentProperAgency(department, row.dimensions.agency)
      );
      const chartRows = realAgencies.size > 1 && departmentProperRows.length ? departmentProperRows : departmentRows;
      const totalsByYear = sumRowsByYear(chartRows);
      const selectedValue = getSelectedYearValue(totalsByYear, selectedYears);

      return {
        name: department,
        sector: getSectorForDepartment(department),
        selectedValue,
        totalsByYear,
        auditByYear: Object.fromEntries(
          selectedYears.map((year) => [year, buildAuditInfo({
            page,
            rows: chartRows,
            headers: [dataset.audit?.preferredValueFields?.[year]].filter(Boolean),
          })])
        ),
      };
    })
    .filter((item) => item.selectedValue > 0)
    .sort((left, right) => {
      const valueDelta = right.selectedValue - left.selectedValue;
      if (valueDelta) return valueDelta;
      return left.name.localeCompare(right.name);
    });
}

function buildDepartmentOptions(rows, selectedYears) {
  const departmentMap = new Map();

  rows.forEach((row) => {
    const departmentName = row.dimensions.dept || "Unspecified";
    const agencyName = row.dimensions.agency || "Unspecified";

    if (!departmentMap.has(departmentName)) {
      departmentMap.set(departmentName, {
        name: departmentName,
        sector: getSectorForDepartment(departmentName),
        rows: [],
        agencies: new Map(),
      });
    }

    const department = departmentMap.get(departmentName);
    department.rows.push(row);

    if (!department.agencies.has(agencyName)) {
      department.agencies.set(agencyName, []);
    }
    department.agencies.get(agencyName).push(row);
  });

  return [...departmentMap.values()]
    .map((department) => {
      const totalsByYear = sumRowsByYear(department.rows);
      const agencies = [...department.agencies.entries()]
        .map(([agencyName, agencyRows]) => {
          const agencyTotalsByYear = sumRowsByYear(agencyRows);
          return {
            name: agencyName,
            rowCount: agencyRows.length,
            selectedValue: getSelectedYearValue(agencyTotalsByYear, selectedYears),
            totalsByYear: agencyTotalsByYear,
          };
        })
        .sort((left, right) => {
          const valueDelta = right.selectedValue - left.selectedValue;
          if (valueDelta) return valueDelta;
          return left.name.localeCompare(right.name);
        });

      return {
        name: department.name,
        sector: department.sector,
        selectedValue: getSelectedYearValue(totalsByYear, selectedYears),
        totalsByYear,
        agencies,
      };
    })
    .sort((left, right) => {
      const sectorDelta = SECTOR_ORDER.indexOf(left.sector) - SECTOR_ORDER.indexOf(right.sector);
      if (sectorDelta) return sectorDelta;
      const valueDelta = right.selectedValue - left.selectedValue;
      if (valueDelta) return valueDelta;
      return left.name.localeCompare(right.name);
    });
}

function buildSectorSummary(rows, selectedYears, sector, currencyDisplay, comparisonYear) {
  const sectorRows = rows.filter((row) => getSectorForRow(row) === sector);
  const totalsByYear = buildYearTotals(sectorRows);
  const selectedValue = getSelectedYearValue(totalsByYear, selectedYears);
  const comparison = buildComparisonMeta(
    selectedValue,
    comparisonYear ? totalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );
  const hasOnlyZeroSourceRows = sectorRows.length > 0 && ALL_YEARS.every((year) => (totalsByYear[year] || 0) === 0);

  let change = comparison.change;
  let tone = comparison.tone;

  if (sector === "LGU" && selectedValue > 0) {
    change = comparison.change || "Includes LGU assistance rows carried under regular departments";
  }

  if (sector === "GOCC" && hasOnlyZeroSourceRows) {
    change = "All GOCC-coded A.4 rows in the source CSV are zero across 2024-2026.";
    tone = "neutral";
  }

  return {
    title: `${sector} Total`,
    value: formatMoneyCompact(selectedValue, { currencyDisplay }),
    change,
    tone,
  };
}

export function buildA4ViewModel({ dataset, selectedYears, searchQuery, currencyDisplay, page }) {
  const rows = dataset.rows;
  const isMultiYearSelection = selectedYears.length > 1;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = getComparisonYear(selectedYears);
  const comparisonLabel = `${oldestSelectedYear} to ${mostRecentSelectedYear}`;
  const totalAudit = buildAuditInfo({
    page,
    rows,
    headers: getPreferredHeadersForYears(dataset, selectedYears),
  });
  const latestBreakdownFields = (dataset.yearBreakdownFields?.[mostRecentSelectedYear] || []).filter((field) => !field.isTotal && !field.isPercent);

  const overallTotalsByYear = buildYearTotals(rows);
  const newGeneralTotalsByYear = buildYearTotals(rows, (row) => row.dimensions.appropriationType === "New General Appropriations");
  const continuingTotalsByYear = buildYearTotals(rows, (row) => row.dimensions.appropriationType === "Continuing Appropriations");

  const totalSpending = getSelectedYearValue(overallTotalsByYear, selectedYears);
  const newGeneralTotal = getSelectedYearValue(newGeneralTotalsByYear, selectedYears);
  const continuingTotal = getSelectedYearValue(continuingTotalsByYear, selectedYears);

  const totalComparison = buildComparisonMeta(
    totalSpending,
    comparisonYear ? overallTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );
  const newGeneralComparison = buildComparisonMeta(
    newGeneralTotal,
    comparisonYear ? newGeneralTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );
  const continuingComparison = buildComparisonMeta(
    continuingTotal,
    comparisonYear ? continuingTotalsByYear[comparisonYear] || 0 : 0,
    Boolean(comparisonYear)
  );

  const searchKeys = ["dept", "agency", "appropriationType", "category", "itemName"];
  const allTableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, "", searchKeys);
  const tableRows = buildTableRows(rows, selectedYears, mostRecentSelectedYear, searchQuery, searchKeys);
  const yearComparisonColumn = buildYearComparisonColumn(selectedYears, currencyDisplay);
  const totalSpendingCard = {
    title: `${mostRecentSelectedYear} Total Spending`,
    value: formatMoneyCompact(totalSpending, { currencyDisplay }),
    change: totalComparison.change,
    tone: totalComparison.tone,
    audit: totalAudit,
  };
  const appropriationBreakdown = {
    title: "New vs Continuing",
    items: [
      {
        key: "new-general",
        label: "New General Appropriations",
        value: formatMoneyCompact(newGeneralTotal, { currencyDisplay }),
        change: newGeneralComparison.change,
        tone: newGeneralComparison.tone,
        audit: totalAudit,
      },
      {
        key: "continuing",
        label: "Continuing Appropriations",
        value: formatMoneyCompact(continuingTotal, { currencyDisplay }),
        change: continuingComparison.change,
        tone: continuingComparison.tone,
        audit: totalAudit,
      },
    ],
  };
  const splitCards = latestBreakdownFields.map((field) => {
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
      title: `${field.label} Total`,
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
  const sectorCards = [
    buildSectorSummary(rows, selectedYears, "NGA", currencyDisplay, comparisonYear),
    buildSectorSummary(rows, selectedYears, "GOCC", currencyDisplay, comparisonYear),
    buildSectorSummary(rows, selectedYears, "LGU", currencyDisplay, comparisonYear),
  ].map((card) => ({
    ...card,
    audit: totalAudit,
  }));

  return {
    meta: buildSummaryMeta(selectedYears, rows.length, "line items"),
    auditSummary: buildDatasetAuditSummary({ dataset, page }),
    currencyDisplay,
    years: dataset.years || ALL_YEARS,
    totalSpendingCard,
    appropriationBreakdown,
    sectorCards,
    kpis: [
      totalSpendingCard,
      ...splitCards,
      ...appropriationBreakdown.items.map((item) => ({
        title: item.label,
        value: item.value,
        change: item.change,
        tone: item.tone,
        audit: item.audit,
      })),
    ].slice(0, 6),
    treemapTitle: "Expenditure by Department",
    treemapData: buildTreemapData(rows, "dept", selectedYears, mostRecentSelectedYear).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows: rows.filter((row) => row.dimensions?.dept === item.name),
        headers: getPreferredHeadersForYears(dataset, selectedYears),
      }),
    })),
    yearComparisonData: buildYearComparisonSeries(overallTotalsByYear, selectedYears, rows).map((item) => ({
      ...item,
      audit: buildAuditInfo({
        page,
        rows,
        headers: [dataset.audit?.preferredValueFields?.[item.year]].filter(Boolean),
      }),
    })),
    departmentChartData: buildDepartmentChartData(rows, selectedYears, dataset, page),
    departmentOptions: buildDepartmentOptions(rows, selectedYears),
    biggestDepartmentMoves: isMultiYearSelection
      ? buildMovers(rows, "dept", oldestSelectedYear, mostRecentSelectedYear).map((item) => ({
        ...item,
        audit: buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.dept === item.name),
          headers: getPreferredHeadersForYears(dataset, [oldestSelectedYear, mostRecentSelectedYear]),
        }),
      }))
      : [],
    biggestAgencyMoves: isMultiYearSelection
      ? buildMovers(rows, "agency", oldestSelectedYear, mostRecentSelectedYear).map((item) => ({
        ...item,
        audit: buildAuditInfo({
          page,
          rows: rows.filter((row) => row.dimensions?.agency === item.name),
          headers: getPreferredHeadersForYears(dataset, [oldestSelectedYear, mostRecentSelectedYear]),
        }),
      }))
      : [],
    comparisonLabel,
    isMultiYearSelection,
    sectorOrder: SECTOR_ORDER,
    allRows: rows,
    allTableRows,
    tableTitle: "A.4 Data Table",
    tableRows,
    totalRowCount: rows.length,
    searchKeys,
    searchPlaceholder: "Search department, agency, type, category, or item",
    tableColumns: [
      ...buildDimensionColumns(dataset, ["dept", "agency", "appropriationType", "category", "itemName"]),
      ...buildYearColumns(selectedYears, currencyDisplay),
      ...(yearComparisonColumn ? [yearComparisonColumn] : []),
    ],
    getRowKey: (row, index) => `${row.dimensions.dept}-${row.dimensions.agency}-${row.dimensions.itemName}-${index}`,
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
