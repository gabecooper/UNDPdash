import React, { useState, useEffect, useCallback, useMemo } from "react";
import { C, F } from "../theme/tokens";
import { cardStyle, eyebrowStyle } from "../theme/styles";
import { loadCsvRaw } from "../data/csvLoaders";
import { parseCsv, toNumber } from "../data/csv";
import { formatAxisMoneyTick, formatMoney, formatMoneyCompact } from "../data/formatters";
import GroupedBarChartCard from "../components/charts/GroupedBarChartCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const DEPARTMENT_EXPENSE_CLASS_FIELDS = [
  {
    label: "Personnel Services",
    yearFields: {
      "2024": "2024_Actual_Personnel_Services",
      "2025": "2025_Program_Personnel_Services",
      "2026": "2026_GAA_Personnel_Services",
    },
  },
  {
    label: "Maintenance and Other Operating Expenses",
    yearFields: {
      "2024": "2024_Actual_Maintenance_and_Other_Operating_Expenses",
      "2025": "2025_Program_Maintenance_and_Other_Operating_Expenses",
      "2026": "2026_GAA_Maintenance_and_Other_Operating_Expenses",
    },
  },
  {
    label: "Capital Outlays and Net Lending",
    yearFields: {
      "2024": "2024_Actual_Capital_Outlays_and_Net_Lending",
      "2025": "2025_Program_Capital_Outlays_and_Net_Lending",
      "2026": "2026_GAA_Capital_Outlays_and_Net_Lending",
    },
  },
  {
    label: "Financial Expenses",
    yearFields: {
      "2024": "2024_Actual_Financial_Expenses",
      "2025": "2025_Program_Financial_Expenses",
      "2026": "2026_GAA_Financial_Expenses",
    },
  },
];

const CLIMATE_BREAKDOWN_FIELDS = [
  {
    label: "Adaptation",
    yearFields: {
      "2024": "2024_Actual_CC_Expenditure_Adaptation",
      "2025": "2025_GAA_CC_Expenditure_Adaptation",
      "2026": "2026_GAA_CC_Expenditure_Adaptation",
    },
  },
  {
    label: "Mitigation",
    yearFields: {
      "2024": "2024_Actual_CC_Expenditure_Mitigation",
      "2025": "2025_GAA_CC_Expenditure_Mitigation",
      "2026": "2026_GAA_CC_Expenditure_Mitigation",
    },
  },
];

function hasAnyYearValue(row, yearFields) {
  return Object.values(yearFields).some((field) => toNumber(row[field]) > 0);
}

function isAggregateClimateOrganizationLabel(label) {
  const normalized = String(label || "").trim().toLowerCase();
  return normalized === "total"
    || normalized === "departments"
    || normalized === "departments (total)";
}

export function normalizeDepartmentComparisonRows(rows) {
  return rows.flatMap((row) => {
    const deptName = String(row["Dept_Name"] || "").trim();
    if (!deptName) return [];

    return DEPARTMENT_EXPENSE_CLASS_FIELDS.map(({ label, yearFields }) => ({
      Dept_Name: deptName,
      Expense_Class: label,
      "2024_Actual": row[yearFields["2024"]] || "0",
      "2025_Program": row[yearFields["2025"]] || "0",
      "2026_GAA": row[yearFields["2026"]] || "0",
      Page_No: row.Page_No || "",
    }));
  });
}

export function normalizeClimateComparisonRows(rows) {
  return rows.flatMap((row) => {
    const organizationName = String(row["Department_Special_Purpose_Fund_Name"] || "").trim();
    if (!organizationName || isAggregateClimateOrganizationLabel(organizationName)) return [];

    return CLIMATE_BREAKDOWN_FIELDS
      .filter(({ yearFields }) => hasAnyYearValue(row, yearFields))
      .map(({ label, yearFields }) => ({
        Department_Special_Purpose_Fund_Name: organizationName,
        Climate_Typology: label,
        "2024_Actual_CC": row[yearFields["2024"]] || "0",
        "2025_GAA_CC": row[yearFields["2025"]] || "0",
        "2026_GAA_CC": row[yearFields["2026"]] || "0",
        Page_No: row.Page_No || "",
        Notes: row.Notes || "",
      }));
  });
}

export function normalizeComparisonRows(rows, config) {
  return config.rowAdapter ? config.rowAdapter(rows) : rows;
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPARISON TYPE CONFIG
   Each entry defines: which CSV to load, what dimension to use for items
   (the two things being compared), what dimension to group by in the chart,
   year field mappings, and optional row filters.
───────────────────────────────────────────────────────────────────────── */

const COMPARISON_TYPES = [
  {
    key: "region-infra",
    label: "Regional Infrastructure Outlay Comparison",
    description: "B.4.c · 2026 GAA Infrastructure",
    csvFile: "B4c.csv",
    itemKey: "Region_Name",
    groupKey: "Category",
    yearFields: { "2026": "2026_GAA_Amount" },
    availableYears: ["2026"],
    groupLimit: 17,
    rowFilter: null,
    csvSource: { rows: "All rows where Region_Name matches", cols: "Category, 2026_GAA_Amount" },
    singleYearXMetric: "hhi",
    singleYearXLabel: "Spending Concentration (HHI)",
    singleYearXDesc: "How concentrated a region's infra budget is across categories. Higher = more focused on fewer types.",
    itemSort: (a, b) => {
      const regionOrder = ["NCR", "CAR", "Region I", "Region II", "Region III",
        "Region IV-A", "Region IV-B", "Region V", "Region VI", "Region VII",
        "Region VIII", "Region IX", "Region X", "Region XI", "Region XII",
        "Region XIII", "NIR", "BARMM", "Nationwide", "Central Office"];
      const ai = regionOrder.indexOf(a);
      const bi = regionOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    },
  },
  {
    key: "region-dept",
    label: "Regional Expenditure by Department Comparison",
    description: "B.6.c · 2026 GAA Departmental",
    csvFile: "B6c.csv",
    itemKey: "Region_Name",
    groupKey: "Dept_Name",
    yearFields: { "2026": "2026_GAA_Amount" },
    availableYears: ["2026"],
    groupLimit: 12,
    rowFilter: null,
    csvSource: { rows: "All rows where Region_Name matches", cols: "Dept_Name, 2026_GAA_Amount" },
    singleYearXMetric: null, // Department allocation is near-uniform across regions (HHI std=0.030) — matrix not meaningful
    itemSort: (a, b) => {
      const regionOrder = ["NCR", "CAR", "Region I", "Region II", "Region III",
        "Region IV-A", "Region IV-B", "Region V", "Region VI", "Region VII",
        "Region VIII", "Region IX", "Region X", "Region XI", "Region XII",
        "Region XIII", "NIR", "BARMM", "Nationwide", "Central Office", "CARAGA"];
      const ai = regionOrder.indexOf(a);
      const bi = regionOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    },
  },
  {
    key: "dept-dept",
    label: "Department Comparison",
    description: "B.8 · Budget by Expense Class",
    csvFile: "B8.csv",
    itemKey: "Dept_Name",
    groupKey: "Expense_Class",
    yearFields: { "2024": "2024_Actual", "2025": "2025_Program", "2026": "2026_GAA" },
    availableYears: ["2024", "2025", "2026"],
    groupLimit: 4,
    rowFilter: null,
    rowAdapter: normalizeDepartmentComparisonRows,
    csvSource: {
      rows: "Each department row is expanded into expense-class comparison rows",
      cols: "Personnel Services, MOOE, Capital Outlays and Net Lending, Financial Expenses",
    },
    itemSort: (a, b) => a.localeCompare(b),
  },
  {
    key: "sector-sector",
    label: "Expenditure Sector Comparison",
    description: "B.5.a · Budget by Sub-Sector",
    csvFile: "B5a.csv",
    itemKey: "Sector_Name",
    groupKey: "SubSector_Name",
    yearFields: { "2024": "2024_Actual", "2025": "2025_Program", "2026": "2026_GAA" },
    availableYears: ["2024", "2025", "2026"],
    groupLimit: 12,
    rowFilter: (row) => {
      const sub = String(row["SubSector_Name"] || "").trim();
      const dept = String(row["Dept_Agency"] || "").trim();
      return sub && sub.toLowerCase() !== "none" && dept && dept.toLowerCase() !== "none";
    },
    csvSource: { rows: "Rows where Sector_Name matches & SubSector_Name/Dept_Agency not 'None'", cols: "SubSector_Name, 2024_Actual, 2025_Program, 2026_GAA" },
    itemSort: (a, b) => a.localeCompare(b),
  },
  {
    key: "climate",
    label: "Climate Expenditure Comparison",
    description: "B.21 · Adaptation vs Mitigation by Department / SPF",
    csvFile: "B21.csv",
    itemKey: "Department_Special_Purpose_Fund_Name",
    groupKey: "Climate_Typology",
    yearFields: { "2024": "2024_Actual_CC", "2025": "2025_GAA_CC", "2026": "2026_GAA_CC" },
    availableYears: ["2024", "2025", "2026"],
    groupLimit: 2,
    rowAdapter: normalizeClimateComparisonRows,
    rowFilter: (row) => {
      const organizationName = String(row["Department_Special_Purpose_Fund_Name"] || "").trim();
      return organizationName && !isAggregateClimateOrganizationLabel(organizationName);
    },
    csvSource: {
      rows: "Each organization row is expanded into adaptation and mitigation comparison rows",
      cols: "2024/2025/2026 adaptation and mitigation expenditure fields",
    },
    itemSort: (a, b) => a.localeCompare(b),
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   TOTAL LABEL FILTER — never show aggregate rows in KPI / chart breakdowns
───────────────────────────────────────────────────────────────────────── */

const TOTAL_PATTERNS = [/^total$/i, /^grand\s*total$/i, /^subtotal$/i, /^all\s+/i];

function isAggregateLabel(label) {
  const s = String(label || "").trim();
  return TOTAL_PATTERNS.some((re) => re.test(s));
}

/* ─────────────────────────────────────────────────────────────────────────
   DATA HELPERS
───────────────────────────────────────────────────────────────────────── */

function extractItems(rows, config) {
  const items = new Set();
  const filtered = config.rowFilter ? rows.filter(config.rowFilter) : rows;
  filtered.forEach((row) => {
    const val = String(row[config.itemKey] || "").trim();
    if (val && val.toLowerCase() !== "none") items.add(val);
  });
  return [...items].sort(config.itemSort || ((a, b) => a.localeCompare(b)));
}

function buildChartDataForItem(rows, itemValue, config, selectedYears) {
  const filtered = (config.rowFilter ? rows.filter(config.rowFilter) : rows).filter(
    (row) => String(row[config.itemKey] || "").trim() === itemValue,
  );

  const totals = new Map();
  filtered.forEach((row) => {
    const label = String(row[config.groupKey] || "").trim();
    if (!label || label.toLowerCase() === "none" || isAggregateLabel(label)) return;

    if (!totals.has(label)) {
      totals.set(label, { name: label });
    }
    const entry = totals.get(label);
    selectedYears.forEach((year) => {
      const field = config.yearFields[year];
      if (field) {
        entry[year] = (entry[year] || 0) + toNumber(row[field]);
      }
    });
  });

  const sortYear = selectedYears[selectedYears.length - 1];
  return [...totals.values()]
    .filter((item) => selectedYears.some((y) => item[y] > 0))
    .sort((a, b) => (b[sortYear] || 0) - (a[sortYear] || 0))
    .slice(0, config.groupLimit);
}

function getColumnTotal(data, selectedYears) {
  const sortYear = selectedYears[selectedYears.length - 1];
  return data.reduce((sum, row) => sum + (row[sortYear] || 0), 0);
}

function getColumnTotal2024(data) {
  return data.reduce((sum, row) => sum + (row["2024"] || 0), 0);
}

function getActiveComparisonYears(config, selectedYears = []) {
  const matched = config.availableYears.filter((year) => selectedYears.includes(year)).sort();
  // If no sidebar selections match, fall back to this comparison's own available years
  // so single-year comparisons (e.g. 2026-only regional data) are always accessible.
  return matched.length > 0 ? matched : [...config.availableYears];
}

function getInitialComparisonType(selectedYears = []) {
  return COMPARISON_TYPES.find((config) => getActiveComparisonYears(config, selectedYears).length > 0)?.key
    || COMPARISON_TYPES[0].key;
}

/* ─────────────────────────────────────────────────────────────────────────
   AI SUMMARY
───────────────────────────────────────────────────────────────────────── */

async function fetchAISummary({ config, itemA, itemB, dataA, dataB, selectedYears, currencyDisplay }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const sortYear = selectedYears[selectedYears.length - 1];
  const totalA = getColumnTotal(dataA, selectedYears);
  const totalB = getColumnTotal(dataB, selectedYears);
  const topA = dataA[0]?.name ?? "N/A";
  const topB = dataB[0]?.name ?? "N/A";

  const snippetA = dataA
    .slice(0, 4)
    .map((d) => `${d.name}: ₱${(d[sortYear] || 0).toLocaleString()}`)
    .join("; ");
  const snippetB = dataB
    .slice(0, 4)
    .map((d) => `${d.name}: ₱${(d[sortYear] || 0).toLocaleString()}`)
    .join("; ");

  const prompt = [
    `You are a fiscal analyst summarizing Philippine national budget data.`,
    `Write exactly 3 sentences comparing "${itemA}" vs "${itemB}" for ${config.label} (${sortYear}).`,
    ``,
    `${itemA} total: ₱${totalA.toLocaleString()} | Top category: ${topA} | Data: ${snippetA}`,
    `${itemB} total: ₱${totalB.toLocaleString()} | Top category: ${topB} | Data: ${snippetB}`,
    ``,
    `Rules: Sentence 1: state both totals and which is higher. Sentence 2: compare their largest categories.`,
    `Sentence 3: one meaningful analytical insight. Use compact peso notation (₱1.2B, ₱450M).`,
    `Output only the 3 sentences, no preamble, no bullet points, no markdown.`,
  ].join("\n");

  if (apiKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 220,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.content?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch {
      // fall through to template
    }
  }

  // Template fallback
  const larger = totalA >= totalB ? itemA : itemB;
  const smaller = totalA >= totalB ? itemB : itemA;
  const largerTotal = Math.max(totalA, totalB);
  const smallerTotal = Math.min(totalA, totalB);
  const pct =
    smallerTotal > 0 ? ((largerTotal / smallerTotal - 1) * 100).toFixed(0) : "N/A";

  return [
    `${itemA} recorded a ${sortYear} allocation of ${formatMoneyCompact(totalA, { currencyDisplay })}, compared to ${formatMoneyCompact(totalB, { currencyDisplay })} for ${itemB}, making ${larger} the larger spender by ${pct}%.`,
    `The primary expenditure category for ${itemA} is ${topA}, while ${itemB} prioritizes ${topB}.`,
    `${larger} allocates ${pct}% more than ${smaller}, reflecting a significant difference in ${config.label.toLowerCase()} priorities between these two entities.`,
  ].join(" ");
}

/* ─────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────── */

function SelectDropdown({ value, onChange, options }) {
  return (
    <div style={{ position: "relative", display: "inline-block", minWidth: 0, flex: 1 }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          appearance: "none",
          WebkitAppearance: "none",
          padding: "10px 40px 10px 14px",
          borderRadius: 10,
          border: `1.5px solid ${C.border}`,
          background: C.white,
          fontFamily: F.mono,
          fontSize: 11,
          letterSpacing: "0.04em",
          color: C.navy,
          cursor: "pointer",
          outline: "none",
        }}
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke={C.muted}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: "absolute",
          right: 13,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

function SelectedYearsNotice({ availableYears, selectedYears }) {
  const activeYears = availableYears.filter((year) => selectedYears.includes(year));
  const isFallback = activeYears.length === 0;
  const displayYears = isFallback ? availableYears : activeYears;
  return (
    <div
      style={{
        display: "grid",
        gap: 3,
        padding: "8px 12px",
        borderRadius: 12,
        border: `1px solid ${isFallback ? "rgba(180,140,80,.35)" : C.border}`,
        background: isFallback ? "rgba(255,248,230,.7)" : "rgba(255,255,255,.72)",
      }}
    >
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 9,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: C.muted,
        }}
      >
        Years
      </div>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 10,
          lineHeight: 1.45,
          color: isFallback ? "#7A5C1E" : C.navy,
          maxWidth: 420,
        }}
      >
        {isFallback
          ? `Showing ${displayYears.join(", ")} — only ${displayYears.length === 1 ? "year" : "years"} available for this comparison.`
          : `Using the left sidebar selection: ${displayYears.join(", ")}.`}
      </div>
    </div>
  );
}

function ItemChip({ label, selectionState, onClickA, onClickB, isCompact }) {
  // selectionState: null | "A" | "B"
  const [hovered, setHovered] = useState(false);
  const isSelected = selectionState !== null;
  const bgColor = selectionState === "A" ? C.navy : selectionState === "B" ? C.teal2 : C.white;
  const borderColor =
    selectionState === "A"
      ? C.navy
      : selectionState === "B"
        ? C.teal2
        : hovered
          ? C.teal
          : C.border;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        borderRadius: 999,
        border: `1.5px solid ${borderColor}`,
        background: isSelected ? bgColor : hovered ? C.mist : C.white,
        overflow: "hidden",
        flexShrink: 0,
        transition: "border-color .15s ease, background .15s ease",
        cursor: "pointer",
      }}
    >
      <button
        type="button"
        onClick={onClickA}
        title={`Select as A: ${label}`}
        style={{
          padding: isCompact ? "4px 8px" : "5px 10px",
          background: "transparent",
          border: "none",
          fontFamily: F.mono,
          fontSize: isCompact ? 9.5 : 10.5,
          letterSpacing: "0.04em",
          color: isSelected ? C.white : hovered ? C.navy : C.dark,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
      {isSelected && (
        <button
          type="button"
          onClick={onClickA}
          title="Deselect"
          style={{
            padding: "4px 8px 4px 0",
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,.7)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            lineHeight: 1,
          }}
        >
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1={18} y1={6} x2={6} y2={18} />
            <line x1={6} y1={6} x2={18} y2={18} />
          </svg>
        </button>
      )}
    </div>
  );
}

function ColumnHeader({ label, color, total, selectedYears, currencyDisplay = "php" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px 10px",
        borderRadius: "10px 10px 0 0",
        background: color,
        marginBottom: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.65)",
            marginBottom: 3,
          }}
        >
          {selectedYears[selectedYears.length - 1]} Total
        </div>
        <div
          style={{
            fontFamily: F.serif,
            fontSize: 22,
            fontWeight: 600,
            color: C.white,
            lineHeight: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {formatMoneyCompact(total, { currencyDisplay })}
        </div>
      </div>
      <div
        style={{
          fontFamily: F.serif,
          fontSize: 13,
          fontWeight: 400,
          color: "rgba(255,255,255,.85)",
          textAlign: "right",
          lineHeight: 1.35,
          maxWidth: "55%",
          minWidth: 0,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function EmptyColumn({ side, label, loading }) {
  const color = side === "A" ? C.navy : C.teal2;
  return (
    <div
      style={{
        ...cardStyle,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 360,
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          background: color,
          opacity: 0.35,
          height: 56,
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: 32,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.35,
          }}
        >
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 16,
              fontWeight: 700,
              color,
            }}
          >
            {side}
          </span>
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 10,
            color: C.muted,
            letterSpacing: "0.06em",
            textAlign: "center",
          }}
        >
          {loading ? "Loading data…" : `Select ${label} above to compare`}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ text, loading }) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: 0,
        overflow: "hidden",
        background: C.navy,
        border: `1px solid ${C.navy}`,
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: C.teal,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.teal,
          }}
        >
          AI-Generated Comparison Summary
        </span>
      </div>
      <div style={{ padding: "16px 20px 18px" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                border: `2px solid ${C.teal}`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: "0.04em" }}>
              Generating summary…
            </span>
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontFamily: F.serif,
              fontSize: 14.5,
              fontWeight: 400,
              color: "rgba(255,255,255,.88)",
              lineHeight: 1.65,
              letterSpacing: "0.01em",
            }}
          >
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MINI KPI STRIP  (2 cards above each chart)
───────────────────────────────────────────────────────────────────────── */

function MiniKpiStrip({ data, selectedYears, itemLabel, color, currencyDisplay }) {
  const sortYear = selectedYears[selectedYears.length - 1];
  const total = getColumnTotal(data, selectedYears);
  const top = data.find((d) => !isAggregateLabel(d.name)) ?? data[0];
  const topPct = top && total > 0 ? ((top[sortYear] / total) * 100).toFixed(1) : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          ...cardStyle,
          padding: "10px 13px",
          borderTop: `3px solid ${color}`,
        }}
      >
        <div style={eyebrowStyle}>{data.length} Categories</div>
        <div
          style={{
            fontFamily: F.serif,
            fontSize: 20,
            fontWeight: 600,
            color: C.navy,
            marginTop: 4,
            lineHeight: 1,
          }}
        >
          {formatMoneyCompact(total, { currencyDisplay })}
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 9.5,
            color: C.muted,
            marginTop: 6,
            lineHeight: 1.3,
          }}
        >
          {sortYear} total for {itemLabel}
        </div>
      </div>
      <div
        style={{
          ...cardStyle,
          padding: "10px 13px",
          borderTop: `3px solid ${color}`,
        }}
      >
        <div style={eyebrowStyle}>Top Category</div>
        <div
          style={{
            fontFamily: F.serif,
            fontSize: 14,
            fontWeight: 600,
            color: C.navy,
            marginTop: 4,
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {top?.name ?? "—"}
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 9.5,
            color: C.muted,
            marginTop: 4,
          }}
        >
          {topPct ? `${topPct}% of total` : "No data"}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CSV SOURCE BADGE — bottom-right of each chart card
───────────────────────────────────────────────────────────────────────── */

function CsvSourceBadge({ csvFile, csvSource }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 6,
        right: 8,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 4,
      }}
    >
      {hovered && (
        <div
          style={{
            background: C.navy,
            borderRadius: 8,
            padding: "8px 11px",
            maxWidth: 280,
            animation: "fadeIn .15s ease",
          }}
        >
          <div style={{ fontFamily: F.mono, fontSize: 9, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>
            CSV Source · {csvFile}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>
            <span style={{ color: "rgba(255,255,255,.35)" }}>Rows: </span>
            <span style={{ color: "rgba(255,255,255,.75)" }}>{csvSource.rows}</span>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,.55)", lineHeight: 1.5, marginTop: 2 }}>
            <span style={{ color: "rgba(255,255,255,.35)" }}>Cols: </span>
            <span style={{ color: "rgba(255,255,255,.75)" }}>{csvSource.cols}</span>
          </div>
        </div>
      )}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 8px",
          borderRadius: 999,
          background: hovered ? C.navy : "rgba(228,232,238,.7)",
          border: `1px solid ${hovered ? C.navy : C.border}`,
          cursor: "default",
          transition: "all .15s ease",
        }}
      >
        <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={hovered ? C.teal : C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: "0.06em", color: hovered ? C.teal : C.muted }}>
          {csvFile}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPARISON MATRIX — scatter/bubble quadrant chart
   X-axis: growth (% change from earliest → latest year)
   Y-axis: funding magnitude (latest year total)
   One dot per "item" (all selectable entities in the comparison type)
───────────────────────────────────────────────────────────────────────── */

function ComparisonMatrix({ config, rawRows, selectedItemA, selectedItemB, currencyDisplay }) {
  // ── ALL HOOKS FIRST — no early returns before this block ──
  const [tooltip, setTooltip] = useState(null);

  // Clear tooltip whenever the category changes so stale coords never crash render
  useEffect(() => { setTooltip(null); }, [config.key]);

  // Matrix always uses the full available year range as a strategic overview —
  // independent of what the sidebar year selector has active.
  const hasMultiYear = config.availableYears.length > 1;
  const useHhi = config.availableYears.length === 1 && config.singleYearXMetric === "hhi";

  // Build matrix points: one per unique item
  const matrixData = useMemo(() => {
    if (!rawRows.length) return [];
    const allItems = extractItems(rawRows, config);
    const years = config.availableYears;
    const firstYear = years[0];
    const lastYear = years[years.length - 1];
    const filtered = config.rowFilter ? rawRows.filter(config.rowFilter) : rawRows;

    return allItems.map((item) => {
      const data = buildChartDataForItem(rawRows, item, config, years);
      const latestTotal = data.reduce((s, r) => s + (r[lastYear] || 0), 0);

      let xVal = null;

      if (hasMultiYear) {
        // X = % growth from first to last year
        const earliestTotal = data.reduce((s, r) => s + (r[firstYear] || 0), 0);
        if (earliestTotal > 0) {
          xVal = ((latestTotal - earliestTotal) / earliestTotal) * 100;
        } else if (latestTotal > 0) {
          xVal = 100;
        } else {
          xVal = 0;
        }
      } else if (useHhi) {
        // X = HHI (Herfindahl-Hirschman Index) of spending concentration
        // Uses raw rows for this item to get per-category amounts
        const itemRows = filtered.filter(r => String(r[config.itemKey] || "").trim() === item);
        const groupTotals = new Map();
        itemRows.forEach(r => {
          const grp = String(r[config.groupKey] || "").trim();
          if (!grp || grp.toLowerCase() === "none" || isAggregateLabel(grp)) return;
          const field = config.yearFields[lastYear];
          groupTotals.set(grp, (groupTotals.get(grp) || 0) + toNumber(r[field]));
        });
        const vals = [...groupTotals.values()].filter(v => v > 0);
        const total = vals.reduce((s, v) => s + v, 0);
        if (total > 0 && vals.length > 0) {
          xVal = vals.reduce((s, v) => s + (v / total) ** 2, 0);
        } else {
          xVal = 0;
        }
      }

      return { name: item, latestTotal, xVal };
    }).filter(d => d.latestTotal > 0 && d.xVal !== null);
  }, [rawRows, config, useHhi]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Layout constants (stable, not derived from data) ──
  const PAD = { top: 38, right: 28, bottom: 52, left: 80 };
  const W = 700, H = 340;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // ── Percentile-rank scaling to prevent clustering ──
  const { plotPoints, xTickData, yTickData, midXSvg, midYSvg } = useMemo(() => {
    if (matrixData.length < 2) return { plotPoints: [], xTickData: [], yTickData: [], midXSvg: PAD.left + plotW / 2, midYSvg: PAD.top + plotH / 2 };

    const sortedY = [...matrixData].sort((a, b) => a.latestTotal - b.latestTotal);
    const sortedX = [...matrixData].sort((a, b) => (a.xVal ?? 0) - (b.xVal ?? 0));

    const rankY = new Map(sortedY.map((d, i) => [d.name, i / (sortedY.length - 1)]));
    const rankX = new Map(sortedX.map((d, i) => [d.name, i / (sortedX.length - 1)]));

    const midXSvgC = PAD.left + 0.5 * plotW;
    const midYSvgC = PAD.top + 0.5 * plotH;

    const points = matrixData.map(d => ({
      ...d,
      cx: PAD.left + rankX.get(d.name) * plotW,
      cy: PAD.top + (1 - rankY.get(d.name)) * plotH,
    }));

    const yTickRanks = [0, 0.25, 0.5, 0.75, 1];
    const yTickDataC = yTickRanks.map(r => {
      const idx = Math.round(r * (sortedY.length - 1));
      return { val: sortedY[idx].latestTotal, y: PAD.top + (1 - r) * plotH };
    });

    const xTickRanks = [0, 0.25, 0.5, 0.75, 1];
    const xTickDataC = xTickRanks.map(r => {
      const idx = Math.round(r * (sortedX.length - 1));
      return { val: sortedX[idx].xVal ?? 0, x: PAD.left + r * plotW };
    });

    return { plotPoints: points, xTickData: xTickDataC, yTickData: yTickDataC, midXSvg: midXSvgC, midYSvg: midYSvgC };
  }, [matrixData, PAD.left, PAD.top, plotW, plotH]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Early returns AFTER all hooks ──
  // Skip entirely if this single-year category has no meaningful second dimension
  if (!hasMultiYear && !useHhi) return null;
  if (matrixData.length < 2) return null;

  const lastYear = config.availableYears[config.availableYears.length - 1];
  const firstYear = config.availableYears[0];

  // Axis labels depend on what X represents
  const xAxisLabel = hasMultiYear
    ? "DECREASING  ←  ——  →  TRENDING"
    : useHhi
      ? "DIVERSIFIED  ←  ——  →  CONCENTRATED"
      : "LOWER  ←  ——  →  HIGHER";

  const xAxisSubLabel = hasMultiYear
    ? `X-axis: % growth ${firstYear} → ${lastYear} (percentile rank)`
    : useHhi
      ? `X-axis: ${config.singleYearXLabel} (percentile rank)`
      : `X-axis: ${lastYear} budget rank`;

  const quadrantLabels = hasMultiYear
    ? [
        { x: PAD.left + 8, y: PAD.top + 16, text: "High funding · Declining", anchor: "start", color: "#8A9BB5" },
        { x: W - PAD.right - 8, y: PAD.top + 16, text: "High funding · Trending", anchor: "end", color: "#4B9B7A" },
        { x: PAD.left + 8, y: H - PAD.bottom - 10, text: "Low funding · Declining", anchor: "start", color: "#C47A6A" },
        { x: W - PAD.right - 8, y: H - PAD.bottom - 10, text: "Low funding · Trending", anchor: "end", color: "#5AADBA" },
      ]
    : useHhi
      ? [
          { x: PAD.left + 8, y: PAD.top + 16, text: "High funding · Diversified", anchor: "start", color: "#4B9B7A" },
          { x: W - PAD.right - 8, y: PAD.top + 16, text: "High funding · Concentrated", anchor: "end", color: "#8A9BB5" },
          { x: PAD.left + 8, y: H - PAD.bottom - 10, text: "Low funding · Diversified", anchor: "start", color: "#5AADBA" },
          { x: W - PAD.right - 8, y: H - PAD.bottom - 10, text: "Low funding · Concentrated", anchor: "end", color: "#C47A6A" },
        ]
      : [
          { x: PAD.left + 8, y: PAD.top + 16, text: "Higher allocation →", anchor: "start", color: "#4B9B7A" },
          { x: W - PAD.right - 8, y: H - PAD.bottom - 10, text: "← Lower allocation", anchor: "end", color: "#8A9BB5" },
        ];

  return (
    <div style={{ padding: "0 14px 28px", animation: "fadeIn .3s ease" }}>
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,22,58,.06)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px 12px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 8.5, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>
              Comparison Matrix · {config.csvFile}
            </div>
            <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: C.navy, lineHeight: 1.2 }}>
              {hasMultiYear
                ? `Funding Scale vs. Trend · ${firstYear}–${lastYear}`
                : useHhi
                  ? `Funding Scale vs. Concentration · ${lastYear}`
                  : `Funding Scale · ${lastYear}`}
            </div>
            {useHhi && (
              <div style={{ fontFamily: F.mono, fontSize: 8.5, color: C.muted, marginTop: 5, maxWidth: 320, lineHeight: 1.4 }}>
                {config.singleYearXDesc}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
            <div style={{ fontFamily: F.mono, fontSize: 9, color: C.muted, letterSpacing: "0.05em" }}>
              Y-axis: {lastYear} total budget (percentile rank)
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 9, color: C.muted, letterSpacing: "0.05em" }}>
              {xAxisSubLabel}
            </div>
          </div>
        </div>

        {/* SVG Matrix */}
        <div style={{ padding: "8px 0 0", position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>

            {/* Quadrant fills */}
            <rect x={PAD.left} y={PAD.top} width={midXSvg - PAD.left} height={midYSvg - PAD.top} fill="rgba(216,138,119,.05)" />
            <rect x={midXSvg} y={PAD.top} width={W - PAD.right - midXSvg} height={midYSvg - PAD.top} fill="rgba(75,155,122,.05)" />
            <rect x={PAD.left} y={midYSvg} width={midXSvg - PAD.left} height={H - PAD.bottom - midYSvg} fill="rgba(216,138,119,.09)" />
            <rect x={midXSvg} y={midYSvg} width={W - PAD.right - midXSvg} height={H - PAD.bottom - midYSvg} fill="rgba(90,173,186,.08)" />

            {/* Gridlines at quartiles */}
            {[0.25, 0.75].map((r, i) => (
              <line key={`gy${i}`} x1={PAD.left} y1={PAD.top + (1 - r) * plotH} x2={W - PAD.right} y2={PAD.top + (1 - r) * plotH}
                stroke={C.grid} strokeWidth={1} strokeDasharray="3 5" />
            ))}
            {[0.25, 0.75].map((r, i) => (
              <line key={`gx${i}`} x1={PAD.left + r * plotW} y1={PAD.top} x2={PAD.left + r * plotW} y2={H - PAD.bottom}
                stroke={C.grid} strokeWidth={1} strokeDasharray="3 5" />
            ))}

            {/* Quadrant dividers */}
            <line x1={midXSvg} y1={PAD.top} x2={midXSvg} y2={H - PAD.bottom}
              stroke={C.border} strokeWidth={1.5} strokeDasharray="6 4" />
            <line x1={PAD.left} y1={midYSvg} x2={W - PAD.right} y2={midYSvg}
              stroke={C.border} strokeWidth={1.5} strokeDasharray="6 4" />

            {/* Plot border */}
            <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} fill="none" stroke={C.border} strokeWidth={1} rx={2} />

            {/* Y-axis ticks */}
            {yTickData.map((t, i) => (
              <text key={i} x={PAD.left - 6} y={t.y + 3.5}
                fontFamily={F.mono} fontSize={8} fill={C.muted} textAnchor="end">
                {formatMoneyCompact(t.val, { currencyDisplay })}
              </text>
            ))}

            {/* X-axis ticks */}
            {xTickData.map((t, i) => (
              <text key={i} x={t.x} y={H - PAD.bottom + 14}
                fontFamily={F.mono} fontSize={8} fill={C.muted} textAnchor="middle">
                {hasMultiYear
                  ? `${t.val >= 0 ? "+" : ""}${t.val.toFixed(0)}%`
                  : useHhi
                    ? t.val.toFixed(2)
                    : formatMoneyCompact(t.val, { currencyDisplay })}
              </text>
            ))}

            {/* Axis direction labels */}
            <text x={W / 2} y={H - 6} fontFamily={F.mono} fontSize={9} fill={C.muted} textAnchor="middle" letterSpacing="0.07em">
              {xAxisLabel}
            </text>
            <text
              x={11}
              y={PAD.top + plotH / 2}
              fontFamily={F.mono}
              fontSize={9}
              fill={C.muted}
              textAnchor="middle"
              letterSpacing="0.07em"
              transform={`rotate(-90, 11, ${PAD.top + plotH / 2})`}
            >
              LOW FUNDING  ←  ——  →  HIGH FUNDING
            </text>

            {/* Quadrant labels */}
            {quadrantLabels.map((ql, i) => (
              <text key={i} x={ql.x} y={ql.y} fontFamily={F.mono} fontSize={8.5}
                fill={ql.color} textAnchor={ql.anchor} opacity={0.8}>
                {ql.text}
              </text>
            ))}

            {/* Data points — background (non-selected) first, then selected on top */}
            {plotPoints.filter(d => d.name !== selectedItemA && d.name !== selectedItemB).map((d) => (
              <g key={d.name}
                onMouseEnter={() => setTooltip(d)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: "pointer" }}
              >
                <circle cx={d.cx} cy={d.cy} r={8} fill="transparent" />
                <circle cx={d.cx} cy={d.cy} r={4.5}
                  fill="rgba(138,155,181,.3)" stroke="rgba(138,155,181,.65)" strokeWidth={1} />
              </g>
            ))}
            {plotPoints.filter(d => d.name === selectedItemA || d.name === selectedItemB).map((d) => {
              const isA = d.name === selectedItemA;
              const dotColor = isA ? C.navy : C.teal2;
              return (
                <g key={d.name}
                  onMouseEnter={() => setTooltip(d)}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: "pointer" }}
                >
                  <circle cx={d.cx} cy={d.cy} r={16} fill={dotColor} opacity={0.12} />
                  <circle cx={d.cx} cy={d.cy} r={7} fill={dotColor} />
                  <text x={d.cx} y={d.cy - 13}
                    fontFamily={F.mono} fontSize={8.5} fill={dotColor} textAnchor="middle" fontWeight={700}>
                    {d.name.length > 20 ? d.name.slice(0, 19) + "…" : d.name}
                  </text>
                </g>
              );
            })}

            {/* Tooltip */}
            {tooltip && (() => {
              const tipW = 210, tipH = (hasMultiYear || useHhi) ? 64 : 50;
              const tipX = Math.min(Math.max(tooltip.cx - tipW / 2, PAD.left + 2), W - PAD.right - tipW - 2);
              const tipY = tooltip.cy < PAD.top + tipH + 22 ? tooltip.cy + 14 : tooltip.cy - tipH - 14;
              return (
                <g pointerEvents="none">
                  <rect x={tipX} y={tipY} width={tipW} height={tipH} rx={7} fill={C.navy} />
                  <text x={tipX + 11} y={tipY + 17} fontFamily={F.mono} fontSize={9.5} fill={C.teal} fontWeight={600}>
                    {tooltip.name.length > 27 ? tooltip.name.slice(0, 26) + "…" : tooltip.name}
                  </text>
                  <text x={tipX + 11} y={tipY + 32} fontFamily={F.mono} fontSize={9} fill="rgba(255,255,255,.72)">
                    {lastYear} total: {formatMoneyCompact(tooltip.latestTotal, { currencyDisplay })}
                  </text>
                  {(hasMultiYear || useHhi) && (
                    <text x={tipX + 11} y={tipY + 49} fontFamily={F.mono} fontSize={9}
                      fill={hasMultiYear ? (tooltip.xVal >= 0 ? "#76C2C9" : "#D88A77") : "#76C2C9"}>
                      {hasMultiYear
                        ? `${firstYear}→${lastYear}: ${tooltip.xVal !== null ? (tooltip.xVal >= 0 ? "+" : "") + tooltip.xVal.toFixed(1) + "% growth" : "N/A"}`
                        : `HHI: ${tooltip.xVal !== null ? tooltip.xVal.toFixed(3) : "N/A"} (${tooltip.xVal > 0.45 ? "concentrated" : tooltip.xVal > 0.3 ? "moderate" : "diversified"})`}
                    </text>
                  )}
                </g>
              );
            })()}
          </svg>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, padding: "4px 18px 14px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { color: C.navy, label: selectedItemA ? `A: ${selectedItemA}` : "Selection A (not chosen)" },
              { color: C.teal2, label: selectedItemB ? `B: ${selectedItemB}` : "Selection B (not chosen)" },
              { color: "rgba(138,155,181,.55)", label: "Other items — hover for details" },
            ].map(({ color, label }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: F.mono, fontSize: 9, color: C.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



export default function ComparisonPage({ selectedYears = ["2025"], currencyDisplay = "php" }) {
  // ── comparison type
  const [compTypeKey, setCompTypeKey] = useState(() => getInitialComparisonType(selectedYears));
  const config = COMPARISON_TYPES.find((t) => t.key === compTypeKey) || COMPARISON_TYPES[0];
  const activeYears = useMemo(() => getActiveComparisonYears(config, selectedYears), [config, selectedYears]);
  const hasActiveYears = activeYears.length > 0; // always true after fallback
  const emptyYearsLabel = "No data available for this selection.";

  // ── raw data
  const [rawRows, setRawRows] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // ── items
  const [items, setItems] = useState([]);
  const [itemA, setItemA] = useState(null);
  const [itemB, setItemB] = useState(null);

  // ── AI summary
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Load CSV when comparison type changes
  useEffect(() => {
    let cancelled = false;

    setDataLoading(true);
    setRawRows([]);
    setItems([]);
    setItemA(null);
    setItemB(null);
    setSummary(null);

    loadCsvRaw(config.csvFile)
      .then((raw) => {
        if (cancelled) return;
        const parsed = parseCsv(raw);
        const normalizedRows = normalizeComparisonRows(parsed, config);
        setRawRows(normalizedRows);
        setItems(extractItems(normalizedRows, config));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setDataLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [config]);

  // Derive chart data
  const dataA = useMemo(
    () =>
      itemA && rawRows.length && hasActiveYears
        ? buildChartDataForItem(rawRows, itemA, config, activeYears)
        : [],
    [itemA, rawRows, hasActiveYears, config, activeYears],
  );
  const dataB = useMemo(
    () =>
      itemB && rawRows.length && hasActiveYears
        ? buildChartDataForItem(rawRows, itemB, config, activeYears)
        : [],
    [itemB, rawRows, hasActiveYears, config, activeYears],
  );

  const totalA = itemA ? getColumnTotal(dataA, activeYears) : 0;
  const totalB = itemB ? getColumnTotal(dataB, activeYears) : 0;

  // Generate AI summary when both items are ready
  useEffect(() => {
    let cancelled = false;

    if (!hasActiveYears || !itemA || !itemB || !dataA.length || !dataB.length) {
      setSummaryLoading(false);
      setSummary(null);
      return;
    }

    setSummaryLoading(true);
    setSummary(null);

    fetchAISummary({ config, itemA, itemB, dataA, dataB, selectedYears: activeYears, currencyDisplay })
      .then((text) => {
        if (!cancelled) {
          setSummary(text);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeYears.join(","), compTypeKey, config, currencyDisplay, dataA, dataB, hasActiveYears, itemA, itemB]);

  // ── handlers
  const handleTypeChange = useCallback((key) => {
    setCompTypeKey(key);
  }, []);

  const handleChipClick = useCallback(
    (item, side) => {
      setSummary(null);
      if (side === "A") {
        setItemA((prev) => (prev === item ? null : item));
      } else {
        setItemB((prev) => (prev === item ? null : item));
      }
    },
    [],
  );

  const chartHeight = Math.max(360, Math.max(dataA.length, dataB.length, 8) * 34);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Page header */}
      <div
        style={{
          padding: "14px 14px 0",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F.serif,
              fontSize: 34,
              fontWeight: 400,
              color: C.navy,
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            Comparison
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 9.5,
              color: C.muted,
              letterSpacing: "0.06em",
              marginTop: 6,
            }}
          >
            Select a comparison type, choose two items, and compare their allocations side by side.
          </div>
        </div>
        <div
          style={{
            padding: "7px 12px",
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,.72)",
            fontFamily: F.mono,
            fontSize: 9.5,
            letterSpacing: "0.05em",
            color: C.muted,
            flexShrink: 0,
          }}
        >
          {config.description}
        </div>
      </div>

      {/* ── Controls row */}
      <div
        style={{
          padding: "14px 14px 0",
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <SelectDropdown
          value={compTypeKey}
          onChange={handleTypeChange}
          options={COMPARISON_TYPES.map((t) => ({ key: t.key, label: t.label }))}
        />
        <SelectedYearsNotice
          availableYears={config.availableYears}
          selectedYears={selectedYears}
        />
      </div>

      {/* ── Item picker */}
      <div
        style={{
          padding: "12px 14px 0",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {(["A", "B"]).map((side) => {
          const selectedItem = side === "A" ? itemA : itemB;
          const color = side === "A" ? C.navy : C.teal2;
          const label = config.itemKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <div
              key={side}
              style={{
                ...cardStyle,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Side badge */}
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: selectedItem ? color : C.mist,
                  border: `2px solid ${selectedItem ? color : C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all .2s ease",
                }}
              >
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: selectedItem ? C.white : C.muted,
                  }}
                >
                  {side}
                </span>
              </div>

              {/* Label */}
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 9.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: selectedItem ? color : C.muted,
                  flexShrink: 0,
                  minWidth: 60,
                  transition: "color .2s ease",
                }}
              >
                {selectedItem || `Pick ${label}`}
              </span>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />

              {/* Chips */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  flex: 1,
                  minWidth: 0,
                  paddingBottom: 2,
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {dataLoading ? (
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.muted }}>
                    Loading…
                  </span>
                ) : (
                  items.map((item) => {
                    const isThisSide = (side === "A" ? itemA : itemB) === item;
                    const isOtherSide = (side === "A" ? itemB : itemA) === item;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleChipClick(item, side)}
                        style={{
                          padding: "4px 11px",
                          borderRadius: 999,
                          border: `1.5px solid ${
                            isThisSide
                              ? color
                              : isOtherSide
                                ? `${color}55`
                                : C.border
                          }`,
                          background: isThisSide ? color : isOtherSide ? `${color}10` : C.white,
                          color: isThisSide ? C.white : isOtherSide ? color : C.dark,
                          fontFamily: F.mono,
                          fontSize: 10,
                          letterSpacing: "0.03em",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          transition: "all .12s ease",
                          opacity: isOtherSide ? 0.6 : 1,
                        }}
                      >
                        {item}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts grid */}
      <div
        style={{
          padding: "12px 14px 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Column A */}
        {itemA && dataA.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              animation: "fadeIn .25s ease",
            }}
          >
            <ColumnHeader
              label={itemA}
              color={C.navy}
              total={totalA}
              selectedYears={activeYears}
              currencyDisplay={currencyDisplay}
            />
            <div
              style={{
                ...cardStyle,
                borderRadius: "0 0 10px 10px",
                borderTop: "none",
                padding: 12,
                position: "relative",
              }}
            >
              <MiniKpiStrip
                data={dataA}
                selectedYears={activeYears}
                itemLabel={itemA}
                color={C.navy}
                currencyDisplay={currencyDisplay}
              />
              <GroupedBarChartCard
                title={config.groupKey.replace(/_/g, " ")}
                data={dataA}
                selectedYears={activeYears}
                height={chartHeight}
                emptyLabel={emptyYearsLabel}
                currencyDisplay={currencyDisplay}
              />
              <CsvSourceBadge csvFile={config.csvFile} csvSource={config.csvSource} />
            </div>
          </div>
        ) : (
          <EmptyColumn side="A" label={config.itemKey.replace(/_/g, " ")} loading={dataLoading && hasActiveYears} />
        )}

        {/* Column B */}
        {itemB && dataB.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              animation: "fadeIn .25s ease",
            }}
          >
            <ColumnHeader
              label={itemB}
              color={C.teal2}
              total={totalB}
              selectedYears={activeYears}
              currencyDisplay={currencyDisplay}
            />
            <div
              style={{
                ...cardStyle,
                borderRadius: "0 0 10px 10px",
                borderTop: "none",
                padding: 12,
                position: "relative",
              }}
            >
              <MiniKpiStrip
                data={dataB}
                selectedYears={activeYears}
                itemLabel={itemB}
                color={C.teal2}
                currencyDisplay={currencyDisplay}
              />
              <GroupedBarChartCard
                title={config.groupKey.replace(/_/g, " ")}
                data={dataB}
                selectedYears={activeYears}
                height={chartHeight}
                emptyLabel={emptyYearsLabel}
                currencyDisplay={currencyDisplay}
              />
              <CsvSourceBadge csvFile={config.csvFile} csvSource={config.csvSource} />
            </div>
          </div>
        ) : (
          <EmptyColumn side="B" label={config.itemKey.replace(/_/g, " ")} loading={dataLoading && hasActiveYears} />
        )}
      </div>

      {/* ── Year-over-year trend line chart (only when multi-year & both items selected) */}
      {activeYears.length >= 2 && itemA && itemB && dataA.length > 0 && dataB.length > 0 && (() => {
        // Build line chart data: one point per year, total for A and total for B
        const allYears = [...activeYears];
        const lineData = allYears.map((year) => {
          const totA = dataA.reduce((s, r) => s + (r[year] || 0), 0);
          const totB = dataB.reduce((s, r) => s + (r[year] || 0), 0);
          return { year, [itemA]: totA, [itemB]: totB };
        });

        const fmt = (value) => formatAxisMoneyTick(value, { currencyDisplay });

        return (
          <div style={{ padding: "12px 14px 0", animation: "fadeIn .3s ease" }}>
            <div
              style={{
                ...cardStyle,
                padding: 0,
                overflow: "hidden",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  padding: "12px 16px 10px",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ ...eyebrowStyle, marginBottom: 3 }}>Year-over-Year Trend</div>
                  <div
                    style={{
                      fontFamily: F.serif,
                      fontSize: 15,
                      fontWeight: 600,
                      color: C.navy,
                    }}
                  >
                    {itemA} vs {itemB} — Total Allocation
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                  }}
                >
                  {[{ label: itemA, color: C.navy }, { label: itemB, color: C.teal2 }].map(({ label, color }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: F.mono,
                        fontSize: 10,
                        color: C.muted,
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 3,
                          borderRadius: 2,
                          background: color,
                          display: "inline-block",
                        }}
                      />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              {/* Line chart */}
              <div style={{ padding: "16px 8px 8px" }}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={lineData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fontFamily: F.mono, fontSize: 10, fill: C.muted }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={fmt}
                      tick={{ fontFamily: F.mono, fontSize: 10, fill: C.muted }}
                      axisLine={false}
                      tickLine={false}
                      width={72}
                    />
                    <Tooltip
                      content={({ active, payload, label: yr }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div
                            style={{
                              background: C.navy,
                              borderRadius: 8,
                              padding: "9px 13px",
                              fontFamily: F.mono,
                              fontSize: 11,
                              color: "#fff",
                              boxShadow: "0 8px 20px rgba(0,22,58,.25)",
                            }}
                          >
                            <div style={{ color: C.teal, marginBottom: 6 }}>{yr}</div>
                            {payload.map((entry, i) => {
                              return (
                                <div key={i} style={{ marginBottom: i < payload.length - 1 ? 5 : 0 }}>
                                  <span style={{ color: entry.color }}>{entry.name}</span>:{" "}
                                  {formatMoney(entry.value, { currencyDisplay })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={itemA}
                      stroke={C.navy}
                      strokeWidth={2.5}
                      dot={{ fill: C.navy, r: 4 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey={itemB}
                      stroke={C.teal2}
                      strokeWidth={2.5}
                      dot={{ fill: C.teal2, r: 4 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── AI Summary */}
      <div style={{ padding: "12px 14px 0" }}>
        {(summaryLoading || summary) ? (
          <SummaryCard text={summary} loading={summaryLoading} />
        ) : (
          <div
            style={{
              ...cardStyle,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.border,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.muted,
                letterSpacing: "0.05em",
              }}
            >
              Select two items above to generate an AI-powered comparison summary.
            </span>
          </div>
        )}
      </div>

      {/* ── Comparison Matrix */}
      <div style={{ padding: "20px 0 0" }}>
        <div style={{ padding: "0 14px 6px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 2,
            }}
          >
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 8.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.muted,
                flexShrink: 0,
              }}
            >
              Strategic Overview
            </span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
        </div>
        {rawRows.length > 0 && (
          <ComparisonMatrix
            config={config}
            rawRows={rawRows}
            selectedItemA={itemA}
            selectedItemB={itemB}
            currencyDisplay={currencyDisplay}
          />
        )}
      </div>
    </div>
  );
}
