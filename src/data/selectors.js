import { formatPercentChange } from "./formatters";
import { YEAR_OPTIONS } from "./yearFields";

function isNoneDimensionValue(value) {
  return typeof value === "string" && value.trim().toLowerCase() === "none";
}

export function collectPageNumbers(rows) {
  const pages = new Set();

  rows.forEach((row) => {
    const pageNo = row.meta?.pageNo;
    if (pageNo) {
      pages.add(String(pageNo));
    }
  });

  return [...pages].sort((left, right) => Number(left) - Number(right));
}

export function getRowYearValue(row, year) {
  return row.valuesByYear?.[year] || 0;
}

export function averageValues(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getLatestSelectedYear(selectedYears) {
  return selectedYears[selectedYears.length - 1] || YEAR_OPTIONS[YEAR_OPTIONS.length - 1];
}

export function getPreviousSelectedYear(selectedYears) {
  return selectedYears.length > 1 ? selectedYears[selectedYears.length - 2] : null;
}

export function getSelectedYearValue(valuesByYear, selectedYears) {
  return valuesByYear?.[getLatestSelectedYear(selectedYears)] || 0;
}

export function selectedWindowAverage(valuesByYear, selectedYears) {
  return averageValues(selectedYears.map((year) => valuesByYear?.[year] || 0));
}

export function sumByYear(rows, year, predicate = () => true) {
  return rows.reduce((sum, row) => (
    predicate(row) ? sum + getRowYearValue(row, year) : sum
  ), 0);
}

export function buildYearTotals(rows, predicate = () => true) {
  return YEAR_OPTIONS.reduce((accumulator, year) => {
    accumulator[year] = sumByYear(rows, year, predicate);
    return accumulator;
  }, {});
}

export function buildComparisonMeta(currentValue, comparisonValue, hasComparison) {
  if (!hasComparison) {
    return { change: "", tone: "neutral" };
  }

  return {
    change: formatPercentChange(currentValue, comparisonValue),
    tone:
      currentValue > comparisonValue
        ? "pos"
        : currentValue < comparisonValue
          ? "neg"
          : "neutral",
  };
}

export function distinctCount(rows, key, selectedYears) {
  const values = new Set();

  rows.forEach((row) => {
    if (selectedYears.some((year) => getRowYearValue(row, year) > 0)) {
      const value = row.dimensions?.[key];
      if (value) {
        values.add(value);
      }
    }
  });

  return values.size;
}

export function aggregateAllYears(rows, key, selectedYears) {
  const totals = new Map();

  rows.forEach((row) => {
    const rawLabel = row.dimensions?.[key];
    if (isNoneDimensionValue(rawLabel)) return;

    const label = rawLabel || "Unspecified";
    if (!totals.has(label)) {
      totals.set(label, {
        name: label,
        sourceRows: [],
        rowCount: 0,
        ...YEAR_OPTIONS.reduce((accumulator, year) => {
          accumulator[year] = 0;
          return accumulator;
        }, {}),
      });
    }

    const next = totals.get(label);
    next.sourceRows.push(row);
    next.rowCount += 1;
    YEAR_OPTIONS.forEach((year) => {
      next[year] += getRowYearValue(row, year);
    });
  });

  return [...totals.values()]
    .map((item) => ({
      ...item,
      selectedValue: getSelectedYearValue(item, selectedYears),
      pages: collectPageNumbers(item.sourceRows),
    }))
    .filter((item) => item.selectedValue > 0);
}

export function buildTreemapData(rows, dimensionKey, selectedYears, orderYear) {
  return aggregateAllYears(rows, dimensionKey, selectedYears)
    .map((item) => ({
      name: item.name,
      value: item.selectedValue,
      orderValue: item[orderYear] || 0,
    }))
    .sort((left, right) => {
      const orderDelta = right.orderValue - left.orderValue;
      if (orderDelta) return orderDelta;
      return right.value - left.value;
    });
}

export function buildGroupedSeries(rows, dimensionKey, selectedYears, limit = 10) {
  const totals = aggregateAllYears(rows, dimensionKey, selectedYears);
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];

  return totals
    .sort((left, right) => {
      const currentDelta = (right[mostRecentSelectedYear] || 0) - (left[mostRecentSelectedYear] || 0);
      if (currentDelta) return currentDelta;
      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}

export function buildMovers(rows, dimensionKey, startYear, endYear, limit = 8) {
  return aggregateAllYears(rows, dimensionKey, [startYear, endYear])
    .map((item) => ({
      name: item.name,
      delta: (item[endYear] || 0) - (item[startYear] || 0),
      startYear,
      endYear,
      startValue: item[startYear] || 0,
      endValue: item[endYear] || 0,
      pages: item.pages,
      rowCount: item.rowCount,
    }))
    .filter((item) => item.delta !== 0)
    .sort((left, right) => {
      const deltaMagnitude = Math.abs(right.delta) - Math.abs(left.delta);
      if (deltaMagnitude) return deltaMagnitude;
      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}

export function filterRowsByQuery(rows, query, keys) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return rows;

  return rows.filter((row) =>
    keys.some((key) =>
      String(row.dimensions?.[key] || "").toLowerCase().includes(normalizedQuery)
    )
  );
}

export function buildTableRows(rows, selectedYears, sortYear, query, searchKeys) {
  const previousSelectedYear = getPreviousSelectedYear(selectedYears);
  const decoratedRows = rows
    .map((row) => ({
      ...row,
      selectedAverage: selectedWindowAverage(row.valuesByYear, selectedYears),
      selectedValue: getSelectedYearValue(row.valuesByYear, selectedYears),
      latestSelectedValue: row.valuesByYear?.[sortYear] || 0,
      previousSelectedValue: previousSelectedYear ? row.valuesByYear?.[previousSelectedYear] || 0 : 0,
      selectedDelta: previousSelectedYear
        ? (row.valuesByYear?.[sortYear] || 0) - (row.valuesByYear?.[previousSelectedYear] || 0)
        : null,
    }))
    .sort((left, right) => {
      const latestDelta = right.latestSelectedValue - left.latestSelectedValue;
      if (latestDelta) return latestDelta;
      return right.selectedValue - left.selectedValue;
    });

  return filterRowsByQuery(decoratedRows, query, searchKeys);
}

export function buildYearComparisonSeries(totalsByYear, selectedYears, rows = []) {
  const pages = collectPageNumbers(rows);

  return selectedYears.map((year, index) => {
    const total = totalsByYear?.[year] || 0;
    const previousYear = index > 0 ? selectedYears[index - 1] : null;
    const previousTotal = previousYear ? totalsByYear?.[previousYear] || 0 : null;

    return {
      year,
      total,
      previousYear,
      previousTotal,
      delta: previousYear ? total - previousTotal : null,
      changeLabel: previousYear ? formatPercentChange(total, previousTotal) : "Baseline year",
      pages,
    };
  });
}
