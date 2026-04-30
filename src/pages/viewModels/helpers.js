import { formatMoney, formatMoneyCompact, formatSignedMoney } from "../../data/formatters";
import { YEAR_OPTIONS } from "../../data/yearFields";
import { getLatestSelectedYear, getPreviousSelectedYear, getSelectedYearValue } from "../../data/selectors";

export function getComparisonYear(selectedYears) {
  if (selectedYears.length > 1) {
    return selectedYears[selectedYears.length - 2];
  }

  const selectedYear = selectedYears[0];
  const selectedIndex = YEAR_OPTIONS.indexOf(selectedYear);

  if (selectedIndex <= 0) return null;

  return YEAR_OPTIONS[selectedIndex - 1];
}

export function getDimensionLabel(dataset, key) {
  return dataset.dimensionFields.find((field) => field.key === key)?.label || key;
}

export function buildDimensionColumns(dataset, keys) {
  return keys.map((key) => ({
    key,
    label: getDimensionLabel(dataset, key),
    minWidth: key.toLowerCase().includes("item") ? 220 : undefined,
    render: (row) => row.dimensions[key],
  }));
}

export function buildYearColumns(selectedYears, currencyDisplay) {
  return selectedYears.map((year) => ({
    key: year,
    label: year,
    align: "right",
    render: (row) => formatMoney(row.valuesByYear[year] || 0, { currencyDisplay }),
  }));
}

export function buildYearComparisonColumn(selectedYears, currencyDisplay) {
  const latestSelectedYear = getLatestSelectedYear(selectedYears);
  const previousSelectedYear = getPreviousSelectedYear(selectedYears);

  if (!previousSelectedYear) return null;

  return {
    key: "selectedDelta",
    label: `${previousSelectedYear} -> ${latestSelectedYear}`,
    align: "right",
    emphasis: true,
    render: (row) => formatSignedMoney(row.selectedDelta || 0, { currencyDisplay }),
  };
}

export function buildSelectedAverageColumn(currencyDisplay) {
  return {
    key: "selectedAverage",
    label: "Selected Average",
    align: "right",
    render: (row) => formatMoney(row.selectedAverage ?? row.selectedValue ?? 0, { currencyDisplay }),
  };
}

export function buildSummaryMeta(selectedYears, count, noun = "rows") {
  return `${selectedYears.join(", ")} selected • ${count.toLocaleString("en-US")} ${noun}`;
}

export function buildLargestGroupLabel(label, value, currencyDisplay) {
  if (!label) return "No data available";
  return `${label} • ${formatMoneyCompact(value, { currencyDisplay })}`;
}

export function placeKpiFirst(kpis, title) {
  const index = kpis.findIndex((kpi) => kpi.title === title);
  if (index <= 0) return kpis;

  const next = [...kpis];
  const [match] = next.splice(index, 1);
  next.unshift(match);
  return next;
}

export function applyRowTransform(rows, rowTransform) {
  if (typeof rowTransform !== "function") {
    return rows;
  }

  return rows.map((row) => rowTransform(row));
}

function isMeaningfulDimensionValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized !== "" && normalized !== "none" && normalized !== "unspecified";
}

export function buildDrilldownOptions(rows, selectedYears, primaryKey, secondaryKey = "") {
  const primaryOptionsByValue = new Map();
  const secondaryOptionsByPrimary = {};
  let hasMeaningfulSecondary = false;

  rows.forEach((row) => {
    const primaryValue = row.dimensions?.[primaryKey] || "Unspecified";
    const secondaryValue = row.dimensions?.[secondaryKey] || "Unspecified";

    if (!primaryOptionsByValue.has(primaryValue)) {
      primaryOptionsByValue.set(primaryValue, {
        value: primaryValue,
        label: primaryValue,
        rowCount: 0,
        selectedValue: 0,
      });
    }

    const primaryOption = primaryOptionsByValue.get(primaryValue);
    primaryOption.rowCount += 1;
    primaryOption.selectedValue += getSelectedYearValue(row.valuesByYear, selectedYears);

    if (!secondaryKey || !isMeaningfulDimensionValue(secondaryValue)) {
      return;
    }

    hasMeaningfulSecondary = true;
    if (!secondaryOptionsByPrimary[primaryValue]) {
      secondaryOptionsByPrimary[primaryValue] = new Map();
    }

    if (!secondaryOptionsByPrimary[primaryValue].has(secondaryValue)) {
      secondaryOptionsByPrimary[primaryValue].set(secondaryValue, {
        value: secondaryValue,
        label: secondaryValue,
        rowCount: 0,
        selectedValue: 0,
      });
    }

    const secondaryOption = secondaryOptionsByPrimary[primaryValue].get(secondaryValue);
    secondaryOption.rowCount += 1;
    secondaryOption.selectedValue += getSelectedYearValue(row.valuesByYear, selectedYears);
  });

  const sortOptions = (left, right) => {
    const valueDelta = right.selectedValue - left.selectedValue;
    if (valueDelta) return valueDelta;
    return left.label.localeCompare(right.label);
  };

  return {
    primaryOptions: [...primaryOptionsByValue.values()].sort(sortOptions),
    secondaryOptionsByPrimary: Object.fromEntries(
      Object.entries(secondaryOptionsByPrimary).map(([primaryValue, optionsMap]) => [
        primaryValue,
        [...optionsMap.values()].sort(sortOptions),
      ])
    ),
    hasMeaningfulSecondary,
  };
}
