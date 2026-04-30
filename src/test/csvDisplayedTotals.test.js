import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { flatPageRegistry } from "../app/pageRegistry";
import { adaptA4Dataset } from "../data/adapters/a4";
import { adaptSingleYearRegionalDataset } from "../data/adapters/singleYearRegional";
import { adaptThreeYearBudgetDataset } from "../data/adapters/threeYearBudget";
import { cascadeHierarchyFromLeft, parseCsv, toNumber } from "../data/csv";
import { formatMoneyCompact } from "../data/formatters";
import { buildA4ViewModel } from "../pages/viewModels/buildA4ViewModel";
import { buildA5ViewModel } from "../pages/viewModels/buildA5ViewModel";
import { buildB1ViewModel } from "../pages/viewModels/buildB1ViewModel";
import { buildB2ViewModel } from "../pages/viewModels/buildB2ViewModel";
import { buildMultiYearSummaryViewModel } from "../pages/viewModels/buildMultiYearSummaryViewModel";
import { buildSingleYearRegionalViewModel } from "../pages/viewModels/buildSingleYearRegionalViewModel";

const A4_HIERARCHY_COLUMNS = [
  "Dept_Name",
  "Agency_Name",
  "Appropriation_Type",
  "Category",
  "Item_Name",
];

const A4_GOCC_DEPARTMENTS = new Set(["Budgetary Support to Government Corporations"]);
const A4_LGU_DEPARTMENTS = new Set([
  "Allocations to Local Government Units",
  "Local Government Support Fund",
  "National Tax Allotment2",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)3",
]);

function readCsvFile(filename) {
  const preferredPath = `new_csv/${filename}`;
  return fs.existsSync(preferredPath)
    ? fs.readFileSync(preferredPath, "utf8")
    : fs.readFileSync(filename, "utf8");
}

function getPage(id) {
  const page = flatPageRegistry.find((entry) => entry.id === id);

  if (!page) {
    throw new Error(`Expected page ${id} to exist in the registry.`);
  }

  return page;
}

function getKpiValue(viewModel, title) {
  const match = viewModel.kpis.find((kpi) => kpi.title === title);

  if (!match) {
    throw new Error(`Expected KPI ${title} to exist.`);
  }

  return match.value;
}

function sumRawField(rows, valueField, predicate = () => true) {
  return rows.reduce((sum, row) => (
    predicate(row) ? sum + toNumber(row[valueField]) : sum
  ), 0);
}

function isNoneLabel(value) {
  return typeof value === "string" && value.trim().toLowerCase() === "none";
}

function buildRankedRawGroups(rows, labelField, valueField, predicate = () => true) {
  const totals = new Map();

  rows.forEach((row) => {
    if (!predicate(row)) return;

    const rawLabel = row[labelField];
    if (isNoneLabel(rawLabel)) return;

    const label = rawLabel || "Unspecified";
    totals.set(label, (totals.get(label) || 0) + toNumber(row[valueField]));
  });

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .filter((item) => item.total > 0)
    .sort((left, right) => {
      const totalDelta = right.total - left.total;
      if (totalDelta) return totalDelta;
      return left.name.localeCompare(right.name);
    });
}

function hasA4GoCcSignal(text) {
  return /government-owned|controlled corporations|gocc/i.test(text);
}

function hasA4LguSignal(text) {
  return /local government units?|financial assistance to local government units|internal revenue allotment|barmm/i.test(text);
}

function getA4SectorForRawRow(row) {
  const department = row.Dept_Name || "";
  const category = row.Category || "";
  const itemName = row.Item_Name || "";
  const agency = row.Agency_Name || "";
  const combined = `${department} ${category} ${itemName} ${agency}`;

  if (A4_GOCC_DEPARTMENTS.has(department) || hasA4GoCcSignal(combined)) return "GOCC";
  if (A4_LGU_DEPARTMENTS.has(department) || hasA4LguSignal(combined)) return "LGU";
  return "NGA";
}

function normalizeClimateLabel(value) {
  return String(value || "").trim().toLowerCase();
}

function isAggregateClimateOrg(value) {
  const normalized = normalizeClimateLabel(value);
  return normalized === "total" || normalized === "departments";
}

function isClimateTotalTypology(value) {
  return normalizeClimateLabel(value) === "total";
}

describe("CSV totals vs displayed totals", () => {
  it("keeps A.4 totals aligned with A4.csv", () => {
    const rawRows = parseCsv(readCsvFile("A4.csv"))
      .map((row) => cascadeHierarchyFromLeft(row, A4_HIERARCHY_COLUMNS));
    const dataset = adaptA4Dataset(readCsvFile("A4.csv"));
    const viewModel = buildA4ViewModel({
      dataset,
      selectedYears: ["2025"],
      searchQuery: "",
      currencyDisplay: "php",
    });

    expect(viewModel.totalSpendingCard.value).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_TOTAL"))
    );

    const appropriationValues = new Map(
      viewModel.appropriationBreakdown.items.map((item) => [item.label, item.value])
    );

    expect(appropriationValues.get("New General Appropriations")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_TOTAL", (row) => row.Appropriation_Type === "New General Appropriations"))
    );
    expect(appropriationValues.get("Continuing Appropriations")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_TOTAL", (row) => row.Appropriation_Type === "Continuing Appropriations"))
    );

    const sectorValues = new Map(viewModel.sectorCards.map((card) => [card.title, card.value]));

    expect(sectorValues.get("NGA Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_TOTAL", (row) => getA4SectorForRawRow(row) === "NGA"))
    );
    expect(sectorValues.get("GOCC Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_TOTAL", (row) => getA4SectorForRawRow(row) === "GOCC"))
    );
    expect(sectorValues.get("LGU Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_TOTAL", (row) => getA4SectorForRawRow(row) === "LGU"))
    );
  });

  it("keeps A.5 sector KPI totals aligned with A5.csv", () => {
    const rawRows = parseCsv(readCsvFile("A5.csv"));
    const dataset = adaptThreeYearBudgetDataset(readCsvFile("A5.csv"));
    const viewModel = buildA5ViewModel({
      dataset,
      page: getPage("A.5"),
      selectedYears: ["2025"],
      searchQuery: "",
      currencyDisplay: "php",
    });

    expect(getKpiValue(viewModel, "2025 Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_TOTAL"))
    );
    expect(getKpiValue(viewModel, "NG Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_NG"))
    );
    expect(getKpiValue(viewModel, "GOCC Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_GOCC"))
    );
    expect(getKpiValue(viewModel, "LGU Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_LGU"))
    );
    expect(getKpiValue(viewModel, "Economic Services Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_TOTAL", (row) => row.Sector_Name === "ECONOMIC SERVICES"))
    );
    expect(getKpiValue(viewModel, "Social Services Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_TOTAL", (row) => row.Sector_Name === "SOCIAL SERVICES"))
    );
  });

  it("keeps B.1 object-spending KPI totals aligned with B1.csv", () => {
    const rawRows = parseCsv(readCsvFile("B1.csv"));
    const dataset = adaptThreeYearBudgetDataset(readCsvFile("B1.csv"));
    const viewModel = buildB1ViewModel({
      dataset,
      page: getPage("B.1"),
      selectedYears: ["2025"],
      searchQuery: "",
      currencyDisplay: "php",
    });

    expect(getKpiValue(viewModel, "2025 Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program"))
    );
    expect(getKpiValue(viewModel, "Personnel Expenses")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program", (row) => row.Expense_Class === "A. PERSONNEL EXPENSES"))
    );
    expect(getKpiValue(viewModel, "Maintenance Expenses")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program", (row) => row.Expense_Class === "B. MAINTENANCE AND OTHER OPERATING EXPENSES"))
    );
    expect(getKpiValue(viewModel, "Capital Outlays")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program", (row) => row.Expense_Class === "II. CAPITAL OUTLAYS"))
    );
    expect(getKpiValue(viewModel, "Donations Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program", (row) => row.Item_Name === "Donations"))
    );
  });

  it("keeps B.2 totals and ranked KPI values aligned with B2.csv", () => {
    const rawRows = parseCsv(readCsvFile("B2.csv"));
    const dataset = adaptThreeYearBudgetDataset(readCsvFile("B2.csv"));
    const viewModel = buildB2ViewModel({
      dataset,
      page: getPage("B.2"),
      selectedYears: ["2025"],
      searchQuery: "",
      currencyDisplay: "php",
    });

    const rankedObjects = buildRankedRawGroups(rawRows, "Object_Expenditure", "2025_Program_Total");
    const rankedExpenseClasses = buildRankedRawGroups(rawRows, "Expense_Class", "2025_Program_Total");

    expect(getKpiValue(viewModel, "2025 Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_Total"))
    );
    expect(getKpiValue(viewModel, "New General")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_New_General"))
    );
    expect(getKpiValue(viewModel, "Automatic")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_Automatic"))
    );
    expect(getKpiValue(viewModel, "Current Operating Expenditures")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_Total", (row) => row.Expense_Class !== "Capital Outlays"))
    );
    expect(getKpiValue(viewModel, "Capital Outlays")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_Total", (row) => row.Expense_Class === "Capital Outlays"))
    );
    expect(viewModel.largestExpenseClassKpi.value).toBe(
      formatMoneyCompact(rankedExpenseClasses[0]?.total || 0)
    );
    expect(viewModel.largestObjectKpi.value).toBe(
      formatMoneyCompact(rankedObjects[0]?.total || 0)
    );
  });

  it("keeps the shared multi-year summary total KPIs aligned with B3.csv", () => {
    const rawRows = parseCsv(readCsvFile("B3.csv"));
    const dataset = adaptThreeYearBudgetDataset(readCsvFile("B3.csv"));
    const viewModel = buildMultiYearSummaryViewModel({
      dataset,
      page: getPage("B.3"),
      selectedYears: ["2025"],
      searchQuery: "",
      currencyDisplay: "php",
    });

    expect(getKpiValue(viewModel, "2025 Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_Total"))
    );
    expect(getKpiValue(viewModel, "Programs")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_Programs"))
    );
    expect(getKpiValue(viewModel, "LFPs")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_LFPs"))
    );
    expect(getKpiValue(viewModel, "FAPs")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_Program_FAPs"))
    );
  });

  it("keeps the shared regional total KPIs aligned with B4c.csv", () => {
    const rawRows = parseCsv(readCsvFile("B4c.csv"));
    const dataset = adaptSingleYearRegionalDataset(readCsvFile("B4c.csv"));
    const viewModel = buildSingleYearRegionalViewModel({
      dataset,
      page: getPage("B.4.c"),
      searchQuery: "",
      currencyDisplay: "php",
    });

    const rankedRegions = buildRankedRawGroups(rawRows, "Region_Name", "2026_GAA_Amount");
    const rankedCategories = buildRankedRawGroups(rawRows, "Category", "2026_GAA_Amount");

    expect(getKpiValue(viewModel, "2026 Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2026_GAA_Amount"))
    );
    expect(getKpiValue(viewModel, "Top Region Name")).toBe(
      formatMoneyCompact(rankedRegions[0]?.total || 0)
    );
    expect(getKpiValue(viewModel, "Top Category")).toBe(
      formatMoneyCompact(rankedCategories[0]?.total || 0)
    );
  });

  it("keeps the shared climate KPI totals aligned with B21.csv", () => {
    const rawRows = parseCsv(readCsvFile("B21.csv"));
    const dataset = adaptThreeYearBudgetDataset(readCsvFile("B21.csv"));
    const viewModel = buildMultiYearSummaryViewModel({
      dataset,
      page: getPage("B.21"),
      selectedYears: ["2025"],
      searchQuery: "",
      currencyDisplay: "php",
    });

    expect(getKpiValue(viewModel, "2025 Total")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_GAA_CC_Expenditure_Total"))
    );
    expect(getKpiValue(viewModel, "CC Expenditure Adaptation")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_GAA_CC_Expenditure_Adaptation"))
    );
    expect(getKpiValue(viewModel, "CC Expenditure Mitigation")).toBe(
      formatMoneyCompact(sumRawField(rawRows, "2025_GAA_CC_Expenditure_Mitigation"))
    );
  });
});
