
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Treemap, ReferenceLine
} from "recharts";
import a4Raw from "./A4.csv?raw";
import logoImg from "./Logos.png";

/* ─── TOKENS ─────────────────────────────────────── */
const C = {
  navy:  "#00163A",
  sidebar: "#082149",
  sidebarInk: "#E7F0F5",
  sidebarAccent: "#8BB8C3",
  teal:  "#76C2C9",
  dark:  "#2C2C2C",
  light: "#F6F6F6",
  mist:  "#F1F5F8",
  teal2: "#5AADBA",
  border:"#E4E8EE",
  muted: "#8A9BB5",
  white: "#ffffff",
};

const F = {
  sans: "\"Avenir Next\", \"Segoe UI\", sans-serif",
  serif: "\"Iowan Old Style\", \"Palatino Linotype\", serif",
  mono: "\"SF Mono\", \"Menlo\", \"Consolas\", monospace",
};

const navSections = [
  {
    pages: [
      { id: "A.4", label: "Public Sector Infrastructure Budget" },
      { id: "A.5", label: "Sectoral Distribution of Public Expenditures" },
    ],
  },
  {
    pages: [
      { id: "B.1", label: "Expenditure Program by Object" },
      { id: "B.2", label: "Obligations by Object of Expenditures by Department/Special Purpose Fund" },
      { id: "B.3", label: "Infrastructure Outlays" },
      { id: "B.4.c", label: "Infrastructure Outlays, Regional Breakdown" },
      { id: "B.5", label: "Expenditure Program by Sector" },
      { id: "B.5.a", label: "Details of Sectoral Allocation of National Government Expenditures" },
      { id: "B.5.b", label: "Classification of the Functions of Government" },
      { id: "B.5.c", label: "Details of the Classification of the Functions of Government" },
      { id: "B.6.c", label: "Regional Allocation of the Expenditure Program by Department/Special Purpose Fund" },
      { id: "B.7", label: "National Government Expenditures by Recipient Unit" },
      { id: "B.8", label: "Expenditure Program by Department/Special Purpose Fund, by General Expense Class" },
      { id: "B.9", label: "Expenditure Program by Agency, General Expense Class" },
      { id: "B.11", label: "Expenditure Program (Net of Debt Burden) by Department/Special Purpose Fund, by Program Category" },
      { id: "B.21", label: "Climate Change Expenditures by Department and Special Purpose Fund" },
      { id: "B.22", label: "Climate Change Expenditures by NCCAP Strategic Priorities" },
    ],
  },
  {
    pages: [
      { id: "H", label: "Reconciliation of the Obligational Program and Proposed General Appropriations" },
    ],
  },
];

const navItems = navSections.flatMap((section) => ([
  ...(section.title ? [{ type: "section", title: section.title }] : []),
  ...section.pages.map((page) => ({
    ...page,
    type: "page",
    navLabel: `${page.label} (${page.id})`,
  })),
]));
const treemapPalette = [
  "#76C2C9",
  "#5AADBA",
  "#4B86A6",
  "#3B6A94",
  "#1B4977",
  "#0E2F5A",
  "#8BB8C3",
  "#4F9DB8",
];
const yearOptions = ["2024", "2025", "2026"];
const yearFieldMap = {
  "2024": "actual2024",
  "2025": "program2025",
  "2026": "gaa2026",
};
const yearPalette = {
  "2024": "#8BB8C3",
  "2025": "#5AADBA",
  "2026": "#1B4977",
};
const negativeBar = "#D88A77";
const publicWorksDepartment = "Department of Public Works and Highways";
const csvRawModules = import.meta.glob("./*.csv", { query: "?raw", import: "default", eager: true });
const pageCsvRawMap = Object.fromEntries(
  Object.entries(csvRawModules).map(([path, raw]) => [path.replace("./", ""), raw])
);

function parseCsv(raw) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value !== "" || row.length) {
    row.push(value);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  const [headers = [], ...dataRows] = rows;
  return dataRows.map((dataRow) =>
    headers.reduce((acc, header, index) => {
      acc[header] = dataRow[index] ?? "";
      return acc;
    }, {})
  );
}

function toNumber(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

const a4HierarchyColumns = [
  "Dept_Name",
  "Agency_Name",
  "Appropriation_Type",
  "Category",
  "Item_Name",
];

function isMissingHierarchyValue(value) {
  if (value == null) return true;
  const normalized = String(value).trim();
  return normalized === "" || normalized.toLowerCase() === "none";
}

function cascadeHierarchyFromLeft(row, columns) {
  let closestLeftValue = "";

  return columns.reduce((nextRow, column) => {
    const rawValue = row[column];
    const normalizedValue = isMissingHierarchyValue(rawValue) ? "" : String(rawValue).trim();

    if (normalizedValue) {
      closestLeftValue = normalizedValue;
    }

    nextRow[column] = normalizedValue || closestLeftValue || "";
    return nextRow;
  }, { ...row });
}

const a4Data = parseCsv(a4Raw).map((rawRow) => {
  const row = cascadeHierarchyFromLeft(rawRow, a4HierarchyColumns);

  return {
    dept: row.Dept_Name || "Unspecified",
    agency: row.Agency_Name || "Unspecified",
    appropriationType: row.Appropriation_Type || "Unspecified",
    category: row.Category || "Unspecified",
    itemName: row.Item_Name || "Unspecified",
    actual2024: toNumber(row["2024_Actual_NG"]),
    program2025: toNumber(row["2025_Program_NG"]),
    gaa2026: toNumber(row["2026_GAA_NG"]),
    pageNo: row.Page_No || "",
  };
});

const pesoCompactFormatter = new Intl.NumberFormat("en-PH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function formatPesoCompact(value) {
  return `₱${pesoCompactFormatter.format(value)}`;
}

function formatAxisPesoTick(value) {
  if (!Number.isFinite(value) || value <= 0) return "";
  const power = Math.log10(value);
  if (Number.isInteger(power) && Math.abs(power % 2) !== 1) return "";
  return `₱${pesoCompactFormatter.format(value)}`;
}

function formatPeso(value) {
  return pesoFormatter.format(value);
}

function formatPercentChange(current, previous) {
  if (!previous) return "No prior period";
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.05) return "Flat vs prior period";
  const arrow = change > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(change).toFixed(1)}% vs prior period`;
}

function getPageCsvFilename(pageId) {
  const filename = `${pageId.replaceAll(".", "")}.csv`;
  return Object.prototype.hasOwnProperty.call(pageCsvRawMap, filename) ? filename : null;
}

function getRowYearValue(row, year) {
  return row[yearFieldMap[year]] || 0;
}

function averageValues(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sumByYear(rows, year, predicate = () => true) {
  return rows.reduce((sum, row) => (
    predicate(row) ? sum + getRowYearValue(row, year) : sum
  ), 0);
}

function buildYearTotals(rows, predicate = () => true) {
  return yearOptions.reduce((acc, year) => {
    acc[year] = sumByYear(rows, year, predicate);
    return acc;
  }, {});
}

function buildLogTicks(minValue, maxValue) {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue <= 0 || maxValue <= 0) {
    return [1, 10];
  }

  const ticks = [];
  const startPower = Math.floor(Math.log10(minValue));
  const endPower = Math.ceil(Math.log10(maxValue));

  for (let power = startPower; power <= endPower; power += 1) {
    if (Math.abs(power % 2) === 1) {
      ticks.push(10 ** power);
    }
  }

  return ticks.length ? ticks : [10 ** startPower, 10 ** endPower];
}

function aggregateAllYears(rows, labelKey, predicate = () => true) {
  const totals = new Map();

  rows.forEach((row) => {
    if (!predicate(row)) return;
    const label = row[labelKey] || "Unspecified";
    if (!totals.has(label)) {
      totals.set(label, {
        name: label,
        ...yearOptions.reduce((acc, year) => {
          acc[year] = 0;
          return acc;
        }, {}),
      });
    }

    const next = totals.get(label);
    yearOptions.forEach((year) => {
      next[year] += getRowYearValue(row, year);
    });
  });

  return [...totals.values()];
}

function selectedWindowAverage(yearTotals, selectedYears) {
  return averageValues(selectedYears.map((year) => yearTotals[year] || 0));
}

function formatSignedPeso(value) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatPeso(Math.abs(value))}`;
}

function ScientificExponentTick({ x, y, payload }) {
  const value = payload?.value ?? 0;

  if (value === 0) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="middle"
          fill={C.muted}
          fontSize={10}
          fontFamily={F.mono}
        >
          0
        </text>
      </g>
    );
  }

  const exponent = Math.round(Math.abs(value));
  if (Math.abs(exponent % 2) !== 1) return null;
  const sign = value > 0 ? "+" : "-";

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="middle"
        fill={C.muted}
        fontSize={10}
        fontFamily={F.mono}
      >
        <tspan>{`${sign}10`}</tspan>
        <tspan fontSize={7} dy={-4}>
          {exponent}
        </tspan>
      </text>
    </g>
  );
}

function WrappedCategoryTick({ x, y, payload, maxCharsPerLine = 22, maxLines = 3 }) {
  const lines = wrapTreemapLabel(String(payload?.value || ""), maxCharsPerLine, maxLines);
  const firstLineDy = lines.length > 1 ? -((lines.length - 1) * 5) : 4;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-8}
        y={0}
        textAnchor="end"
        fill={C.muted}
        fontSize={10}
        fontFamily={F.mono}
      >
        {lines.map((line, index) => (
          <tspan
            key={`${payload?.value}-${index}`}
            x={-8}
            dy={index === 0 ? firstLineDy : 10}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function getComparisonMeta(currentValue, comparisonValue, hasComparison) {
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

function toSignedLog(value) {
  if (!value) return 0;
  return Math.sign(value) * Math.log10(Math.abs(value) + 1);
}

function fromSignedLog(value) {
  if (!value) return 0;
  return Math.sign(value) * (10 ** Math.abs(value) - 1);
}

function buildSignedLogTicks(maxAbsLog) {
  const maxExponent = Math.max(1, Math.ceil(maxAbsLog));
  const ticks = [0];

  for (let exponent = 1; exponent <= maxExponent; exponent += 1) {
    if (Math.abs(exponent % 2) === 1) {
      ticks.push(exponent, -exponent);
    }
  }

  return ticks.sort((a, b) => a - b);
}

function wrapTreemapLabel(text, maxCharsPerLine, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      return;
    }

    if (currentLine) lines.push(currentLine);

    if (word.length <= maxCharsPerLine) {
      currentLine = word;
      return;
    }

    let remaining = word;
    while (remaining.length > maxCharsPerLine && lines.length < maxLines - 1) {
      lines.push(`${remaining.slice(0, maxCharsPerLine - 1)}-`);
      remaining = remaining.slice(maxCharsPerLine - 1);
    }
    currentLine = remaining;
  });

  if (currentLine) lines.push(currentLine);

  if (lines.length <= maxLines) return lines;

  const trimmed = lines.slice(0, maxLines);
  const lastLine = trimmed[maxLines - 1];
  trimmed[maxLines - 1] = lastLine.length > 3 ? `${lastLine.slice(0, -3)}...` : lastLine;
  return trimmed;
}

function aggregateMetric(rows, labelKey, valueKey) {
  const totals = new Map();

  rows.forEach((row) => {
    const label = row[labelKey] || "Unspecified";
    const nextValue = (totals.get(label) || 0) + (row[valueKey] || 0);
    totals.set(label, nextValue);
  });

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

/* ─── CUSTOM TOOLTIP ──────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.navy, borderRadius: 7, padding: "8px 13px",
      fontSize: 11, color: "#fff", fontFamily: F.mono,
      boxShadow:"0 4px 16px rgba(0,22,58,.25)"
    }}>
      <div style={{ color: C.teal, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i}>{p.name}: {p.value}{p.value < 200 ? "%" : "M"}</div>
      ))}
    </div>
  );
};

/* ─── SHARED STYLES ───────────────────────────────── */
const card = {
  background: C.white, border: `1px solid ${C.border}`,
  borderRadius: 10, padding: 18, position:"relative", overflow:"hidden",
};
const eyebrow = {
  fontFamily: F.mono, fontSize: 8.5, letterSpacing:"0.12em",
  textTransform:"uppercase", color: C.teal, marginBottom: 3,
};
const chip = (t) => ({
  display:"inline-block", padding:"2px 7px", borderRadius: 20,
  fontSize: 9.5, fontWeight: 600, fontFamily: F.mono,
  background: t==="up" ? "#e0f4ed" : t==="dn" ? "#fde8e6" : "#f0f3f7",
  color:       t==="up" ? "#1a6a45" : t==="dn" ? "#8c2020" : C.muted,
});
const chartGridStroke = "#EEF1F6";
const chartMargin = { top:4, right:8, left:-24, bottom:0 };
const chartAxisTick = { fontSize:9.5, fill:C.muted, fontFamily: F.mono };

/* ─── SUB-COMPONENTS ──────────────────────────────── */

function SidebarYearChip({ label, selected, onClick, shake }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={selected}
      style={{
        padding:"8px 11px",
        borderRadius:999,
        border:`1px solid ${
          selected ? "rgba(139,184,195,.42)" : hovered ? "rgba(139,184,195,.28)" : "rgba(139,184,195,.16)"
        }`,
        background:
          selected
            ? "linear-gradient(135deg, rgba(139,184,195,.2), rgba(139,184,195,.1))"
            : hovered
              ? "rgba(255,255,255,.045)"
              : "transparent",
        color: selected ? "rgba(245,250,252,.96)" : hovered ? "rgba(231,240,245,.9)" : "rgba(231,240,245,.72)",
        fontFamily: F.mono,
        fontSize:10,
        letterSpacing:"0.05em",
        cursor:"pointer",
        transition:"background-color .2s ease, border-color .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered || selected ? "0 10px 22px rgba(0,0,0,.12)" : "none",
        animation: shake ? "sidebarShake .35s ease-in-out" : "none",
      }}
    >
      {label}
    </button>
  );
}

function SidebarActionButton({ children }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:"100%",
        padding:"10px 14px",
        border:`1.8px solid ${hovered ? "rgba(139,184,195,.42)" : "rgba(139,184,195,.24)"}`,
        background: hovered ? "rgba(255,255,255,.05)" : "transparent",
        color:hovered ? "rgba(245,250,252,.96)" : "#BDE7EB",
        fontFamily: F.mono,
        fontSize:11,
        fontWeight:500,
        borderRadius:10,
        cursor:"pointer",
        letterSpacing:"0.04em",
        transition:"background-color .2s ease, border-color .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered ? "0 10px 22px rgba(0,0,0,.12)" : "none",
      }}
    >
      {children}
    </button>
  );
}

/* Logo */
function LogoBox() {
  return (
    <img
      src={logoImg}
      alt="UNDP dashboard logo"
      style={{
        display:"block",
        width:182,
        maxWidth:"100%",
        height:"auto",
        objectFit:"contain",
      }}
    />
  );
}

/* Sidebar */
function Sidebar({
  activeNav,
  setActiveNav,
  hoveredNav,
  setHoveredNav,
  years,
  toggleYear,
  rejectedYear,
}) {
  return (
    <aside style={{
      width:242,
      flexShrink:0,
      height:"100vh",
      minHeight:0,
      background:C.sidebar,
      display:"flex", flexDirection:"column",
      overflow:"hidden",
      position:"relative",
      boxShadow:"18px 0 36px rgba(0,22,58,.08)",
      borderTopRightRadius:16,
      borderBottomRightRadius:16,
    }}>
      <div
        aria-hidden="true"
        style={{
          position:"absolute",
          top:0,
          right:-28,
          width:28,
          height:"100%",
          background:"linear-gradient(90deg, rgba(8,33,73,.12), rgba(8,33,73,0))",
          pointerEvents:"none",
        }}
      />
      {/* Logo */}
      <div style={{ padding:"22px 20px 18px", display:"flex", justifyContent:"center" }}>
        <LogoBox />
      </div>

      <div style={{
        fontFamily: F.mono, fontSize:8.5, letterSpacing:"0.12em",
        textTransform:"uppercase", color:"rgba(231,240,245,.42)", padding:"22px 20px 6px",
        flexShrink:0,
      }}>
        General Appropriations Act
      </div>

      {/* Nav */}
      <nav style={{
        padding:"10px 0 16px",
        flex:1,
        minHeight:0,
        overflowY:"auto",
        overflowX:"hidden",
      }}>
        {navItems.map((item) => (
          item.type === "section" ? (
            <div
              key={`section-${item.title}`}
              style={{
                padding:"14px 20px 6px",
                fontFamily:F.mono,
                fontSize:8.5,
                letterSpacing:"0.12em",
                textTransform:"uppercase",
                color:"rgba(231,240,245,.42)",
              }}
            >
              {item.title}
            </div>
          ) : (
            <div
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              onMouseEnter={() => setHoveredNav(item.id)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                padding:"8px 20px", fontSize:11, cursor:"pointer", lineHeight:1.45,
                borderLeft:
                  activeNav===item.id
                    ? `2px solid ${C.teal}`
                    : hoveredNav===item.id
                      ? "2px solid rgba(118,194,201,.38)"
                      : "2px solid transparent",
                color:
                  activeNav===item.id
                    ? "#BDE7EB"
                    : hoveredNav===item.id
                      ? "rgba(231,240,245,.92)"
                      : "rgba(231,240,245,.68)",
                background:
                  activeNav===item.id
                    ? "rgba(118,194,201,.11)"
                    : hoveredNav===item.id
                      ? "rgba(118,194,201,.07)"
                      : "transparent",
                fontWeight: activeNav===item.id || hoveredNav===item.id ? 500 : 400,
                textShadow: activeNav===item.id ? "0 0 12px rgba(118,194,201,.32)" : "none",
                transform: hoveredNav===item.id && activeNav!==item.id ? "translateX(4px)" : "translateX(0)",
                transition:"background-color .2s ease, color .2s ease, border-color .2s ease, transform .2s ease, font-weight .2s ease",
              }}
            >
              {item.navLabel}
            </div>
          )
        ))}
      </nav>

      {/* Filters */}
      <div style={{ padding:"16px 20px 4px", borderTop:`1px solid rgba(231,240,245,.08)`, flexShrink:0 }}>
        <div style={{ fontFamily: F.mono, fontSize:8.5, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(231,240,245,.42)", marginBottom:8 }}>
          Select Years
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
          {["2024","2025","2026"].map(y => (
            <SidebarYearChip
              key={y}
              label={y}
              selected={years.includes(y)}
              onClick={() => toggleYear(y)}
              shake={rejectedYear === y}
            />
          ))}
        </div>
      </div>

      {/* Footer btn */}
      <div style={{ padding:"4px 20px 24px", flexShrink:0 }}>
        <SidebarActionButton>
          View Dataset
        </SidebarActionButton>
      </div>
    </aside>
  );
}

/* Top Bar */
function TopBar({ title, meta, onDownload, downloadDisabled }) {
  const IconBtn = ({ children, title, onClick, disabled }) => (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
      width:36, height:36, borderRadius:8,
      border:`1.5px solid ${disabled ? "rgba(0,22,58,.08)" : "rgba(0,22,58,.12)"}`, background:"transparent",
      display:"flex", alignItems:"center", justifyContent:"center",
      cursor:disabled ? "not-allowed" : "pointer",
      color:disabled ? "rgba(0,22,58,.28)" : C.navy,
      opacity:disabled ? 0.7 : 1,
    }}
    >
      {children}
    </button>
  );
  return (
    <div style={{
      display:"flex", alignItems:"flex-start",
      justifyContent:"space-between", gap:18, padding:"14px 14px 18px",
    }}>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{
          fontFamily: F.serif, fontSize:34, fontWeight:400,
          color:C.navy, lineHeight:1, letterSpacing:"-0.01em",
        }}>
          {title}
        </div>
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
        {meta ? (
          <div style={{
            padding:"8px 12px",
            borderRadius:999,
            border:`1px solid ${C.border}`,
            background:"rgba(255,255,255,.72)",
            fontFamily:F.mono,
            fontSize:10,
            letterSpacing:"0.05em",
            color:C.muted,
          }}>
            {meta}
          </div>
        ) : null}
        <IconBtn
          title={downloadDisabled ? "CSV unavailable for this page" : "Download CSV"}
          onClick={onDownload}
          disabled={downloadDisabled}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1={12} y1={15} x2={12} y2={3}/>
          </svg>
        </IconBtn>
      </div>
    </div>
  );
}

function A4KpiCard({ title, value, change, tone = "neutral", style, featured = false }) {
  const deltaColor = tone==="pos" ? "#1a8c5a" : tone==="neg" ? "#b03030" : C.muted;

  return (
    <div style={{ ...card, paddingTop:14, height:"100%", display:"flex", flexDirection:"column", ...style }}>
      <div style={{
        ...eyebrow,
        display:"-webkit-box",
        WebkitLineClamp:2,
        WebkitBoxOrient:"vertical",
        overflow:"hidden",
        minHeight:18,
      }}>{title}</div>
      <div style={{
        fontFamily: F.serif,
        fontSize: featured ? 34 : 26,
        fontWeight: 600,
        color: C.navy,
        lineHeight: featured ? 0.95 : 1,
        marginTop: 11,
        marginBottom: 8,
      }}>
        {value}
      </div>
      <div style={{ marginTop:"auto", minHeight:28 }}>
        {change ? (
          <div style={{
            fontSize:10.5,
            fontWeight:500,
            color:deltaColor,
            lineHeight:1.4,
            display:"-webkit-box",
            WebkitLineClamp:2,
            WebkitBoxOrient:"vertical",
            overflow:"hidden",
          }}>
            {change}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChartCardFrame({ title, action, style, bodyStyle, children }) {
  return (
    <div style={{ ...card, display:"flex", flexDirection:"column", minHeight:0, ...style }}>
      <div style={{ marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <div style={eyebrow}>{title}</div>
        {action}
      </div>
      <div style={{ flex:1, minHeight:0, ...bodyStyle }}>
        {children}
      </div>
    </div>
  );
}

function EmptyChartState({ label }) {
  return (
    <div style={{
      height:"100%",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      color:C.muted,
      fontSize:12,
      textAlign:"center",
      padding:"20px 24px",
      border:`1px dashed ${C.border}`,
      borderRadius:10,
      background:"rgba(255,255,255,.45)",
    }}>
      {label}
    </div>
  );
}

function PlaceholderPage({ page }) {
  return (
    <div style={{ ...card, padding:24 }}>
      <div style={eyebrow}>Page Placeholder</div>
      <div style={{
        fontFamily: F.serif,
        fontSize: 26,
        color: C.navy,
        lineHeight: 1.15,
        marginTop: 12,
        marginBottom: 12,
      }}>
        {page.navLabel}
      </div>
      <div style={{
        color: C.muted,
        fontSize: 13,
        lineHeight: 1.6,
        maxWidth: 640,
      }}>
        This page is now available in the sidebar, but its charts and data views have not been implemented yet.
      </div>
    </div>
  );
}

const MoneyChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const tooltipLabel = label || payload[0]?.payload?.name || payload[0]?.name || "Value";

  return (
    <div style={{
      background: C.navy,
      borderRadius: 8,
      padding: "9px 12px",
      fontSize: 11,
      color: "#fff",
      fontFamily: F.mono,
      boxShadow:"0 8px 20px rgba(0,22,58,.25)",
    }}>
      <div style={{ color: C.teal, marginBottom: 6 }}>{tooltipLabel}</div>
      {payload.map((entry, index) => {
        const value =
          (typeof entry.payload?.[entry.name] === "number" ? entry.payload[entry.name] : null)
          ?? entry.value
          ?? entry.payload?.value
          ?? 0;
        return (
          <div key={index}>
            {(entry.name || "Amount")}: {formatPeso(value)}
          </div>
        );
      })}
    </div>
  );
};

function ChartLegend({ years }) {
  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
      {years.map((year) => (
        <div
          key={year}
          style={{
            display:"inline-flex",
            alignItems:"center",
            gap:6,
            fontFamily:F.mono,
            fontSize:10,
            color:C.muted,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width:8,
              height:8,
              borderRadius:999,
              background:yearPalette[year],
              boxShadow:"0 0 0 3px rgba(139,184,195,.14)",
            }}
          />
          {year}
        </div>
      ))}
    </div>
  );
}

const DeltaChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div style={{
      background: C.navy,
      borderRadius: 8,
      padding: "9px 12px",
      fontSize: 11,
      color: "#fff",
      fontFamily: F.mono,
      boxShadow:"0 8px 20px rgba(0,22,58,.25)",
    }}>
      <div style={{ color: C.teal, marginBottom: 6 }}>{label}</div>
      <div>Change: {formatSignedPeso(point.delta)}</div>
      <div>{point.startYear}: {formatPeso(point.startValue)}</div>
      <div>{point.endYear}: {formatPeso(point.endValue)}</div>
    </div>
  );
};

function DepartmentTreemapNode(props) {
  const { x, y, width, height, index, name, value } = props;
  if (!name || width <= 0 || height <= 0) return null;

  const fill = treemapPalette[index % treemapPalette.length];
  const showValue = width > 126 && height > 60;
  const showLabel = width > 84 && height > 40;
  const maxCharsPerLine = Math.max(8, Math.floor((width - 20) / 6.8));
  const maxLines = showValue ? Math.max(2, Math.floor((height - 34) / 12)) : Math.max(2, Math.floor((height - 16) / 12));
  const labelLines = showLabel ? wrapTreemapLabel(name, maxCharsPerLine, Math.min(maxLines, 5)) : [];

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill={fill}
        stroke="rgba(255,255,255,.9)"
        strokeWidth={2}
      />
      {showLabel ? (
        <text x={x + 10} y={y + 18} fill="#fff" fontSize={10} fontFamily={F.mono}>
          {labelLines.map((line, lineIndex) => (
            <tspan key={`${name}-${lineIndex}`} x={x + 10} dy={lineIndex === 0 ? 0 : 12}>
              {line}
            </tspan>
          ))}
        </text>
      ) : null}
      {showValue ? (
        <text
          x={x + 10}
          y={y + 18 + (labelLines.length * 12) + 4}
          fill="rgba(255,255,255,.9)"
          fontSize={11}
          fontFamily={F.mono}
        >
          {formatPesoCompact(value)}
        </text>
      ) : null}
    </g>
  );
}

function TreemapChartCard({ title, data, style }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerHeight = style?.height ?? 360;

  useEffect(() => {
    if (!isExpanded) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isExpanded]);

  const expandButton = (
    <button
      type="button"
      onClick={() => setIsExpanded(true)}
      aria-label="Expand treemap"
      title="Expand"
      style={{
        width:28,
        height:28,
        borderRadius:8,
        border:`1px solid ${C.border}`,
        background:"rgba(255,255,255,.92)",
        color:C.navy,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        cursor:"pointer",
        boxShadow:"0 8px 16px rgba(0,22,58,.08)",
        flexShrink:0,
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1={21} y1={3} x2={14} y2={10} />
        <line x1={3} y1={21} x2={10} y2={14} />
        <polyline points="21 15 21 21 15 21" />
        <polyline points="3 9 3 3 9 3" />
        <line x1={21} y1={21} x2={14} y2={14} />
        <line x1={3} y1={3} x2={10} y2={10} />
      </svg>
    </button>
  );

  const renderTreemap = () => (
    data.length ? (
      <ResponsiveContainer width="100%" height="100%" style={{ userSelect:"none", WebkitUserSelect:"none" }}>
        <Treemap
          accessibilityLayer={false}
          data={data}
          dataKey="value"
          stroke="rgba(255,255,255,.92)"
          content={<DepartmentTreemapNode />}
          aspectRatio={1.55}
          isAnimationActive={false}
        >
          <Tooltip content={<MoneyChartTip />} />
        </Treemap>
      </ResponsiveContainer>
    ) : (
      <EmptyChartState label="No department expenditure available for the current filters." />
    )
  );

  return (
    <>
      <div style={{ minHeight:0, height:containerHeight }}>
        <ChartCardFrame title={title} action={expandButton} style={{ ...style, height:"100%" }}>
          {renderTreemap()}
        </ChartCardFrame>
      </div>
      {isExpanded ? (
        <div
          onClick={() => setIsExpanded(false)}
          onWheel={(event) => event.preventDefault()}
          onTouchMove={(event) => event.preventDefault()}
          style={{
            position:"fixed",
            inset:0,
            zIndex:80,
            background:"rgba(8,33,73,.24)",
            display:"flex",
            alignItems:"flex-start",
            justifyContent:"center",
            padding:"22px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width:"min(1120px, 100%)",
              height:"min(100%, 760px)",
              boxShadow:"0 28px 80px rgba(0,22,58,.22)",
            }}
          >
            <ChartCardFrame
              title={title}
              action={
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close expanded treemap"
                  title="Close"
                  style={{
                    width:30,
                    height:30,
                    borderRadius:8,
                    border:`1px solid ${C.border}`,
                    background:"rgba(255,255,255,.94)",
                    color:C.navy,
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    cursor:"pointer",
                    boxShadow:"0 8px 16px rgba(0,22,58,.08)",
                    flexShrink:0,
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <line x1={18} y1={6} x2={6} y2={18} />
                    <line x1={6} y1={6} x2={18} y2={18} />
                  </svg>
                </button>
              }
              style={{
                height:"100%",
                borderRadius:16,
                overflow:"hidden",
              }}
            >
              {renderTreemap()}
            </ChartCardFrame>
          </div>
        </div>
      ) : null}
    </>
  );
}

function GroupedAgencyChart({ title, data, selectedYears, height }) {
  const cardMinHeight = height + 84;
  const chartData = useMemo(
    () => data.map((row) => {
      const nextRow = { ...row };
      selectedYears.forEach((year) => {
        const value = row[year] || 0;
        nextRow[`${year}Display`] = value > 0 ? value : null;
      });
      return nextRow;
    }),
    [data, selectedYears]
  );

  const positiveValues = useMemo(
    () => chartData.flatMap((row) =>
      selectedYears
        .map((year) => row[`${year}Display`])
        .filter((value) => typeof value === "number" && value > 0)
    ),
    [chartData, selectedYears]
  );

  const domainMin = useMemo(() => {
    if (!positiveValues.length) return 1;
    const minPositive = Math.min(...positiveValues);
    return Math.max(1, 10 ** Math.floor(Math.log10(minPositive)));
  }, [positiveValues]);

  const domainMax = useMemo(() => {
    if (!positiveValues.length) return 10;
    const maxPositive = Math.max(...positiveValues);
    return Math.max(domainMin * 10, 10 ** Math.ceil(Math.log10(maxPositive)));
  }, [domainMin, positiveValues]);

  const logTicks = useMemo(
    () => buildLogTicks(domainMin, domainMax),
    [domainMax, domainMin]
  );

  return (
    <ChartCardFrame
      title={title}
      action={<ChartLegend years={selectedYears} />}
      style={{ overflow:"hidden", minHeight:cardMinHeight }}
      bodyStyle={{ overflow:"hidden", minHeight:height, paddingBottom:8 }}
    >
      {chartData.length ? (
        <ResponsiveContainer width="100%" height={height} style={{ userSelect:"none", WebkitUserSelect:"none" }}>
          <BarChart
            accessibilityLayer={false}
            data={chartData}
            layout="vertical"
            margin={{ top: 6, right: 18, left: 18, bottom: 8 }}
            barCategoryGap="22%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
            <XAxis
              type="number"
              scale="log"
              domain={[domainMin, domainMax]}
              ticks={logTicks}
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxisPesoTick}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={<WrappedCategoryTick maxCharsPerLine={24} maxLines={3} />}
              axisLine={false}
              tickLine={false}
              width={210}
              interval={0}
            />
            <Tooltip content={<MoneyChartTip />} />
            {selectedYears.map((year) => (
              <Bar
                key={year}
                dataKey={`${year}Display`}
                name={year}
                fill={yearPalette[year]}
                radius={[0, 6, 6, 0]}
                maxBarSize={22}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState label="No agency totals are available for the current filters." />
      )}
    </ChartCardFrame>
  );
}

function BiggestMovesChart({ title, data, height, comparisonLabel }) {
  const cardMinHeight = height + 84;
  const chartData = useMemo(
    () => data.map((item) => ({ ...item, scaledDelta: toSignedLog(item.delta) })),
    [data]
  );
  const maxAbsLog = useMemo(
    () => chartData.reduce((max, item) => Math.max(max, Math.abs(item.scaledDelta)), 0),
    [chartData]
  );
  const tickValues = useMemo(
    () => buildSignedLogTicks(maxAbsLog),
    [maxAbsLog]
  );
  const xDomain = useMemo(() => {
    const paddedMax = Math.max(1, Math.ceil(maxAbsLog + 0.15));
    return [-paddedMax, paddedMax];
  }, [maxAbsLog]);

  return (
    <ChartCardFrame
      title={title}
      action={(
        <div style={{
          padding:"7px 10px",
          borderRadius:999,
          border:`1px solid ${C.border}`,
          background:"rgba(255,255,255,.72)",
          fontFamily:F.mono,
          fontSize:10,
          color:C.muted,
          letterSpacing:"0.05em",
        }}>
          {comparisonLabel}
        </div>
      )}
      style={{ overflow:"hidden", minHeight:cardMinHeight }}
      bodyStyle={{ overflow:"hidden", minHeight:height, paddingBottom:8 }}
    >
      {chartData.length ? (
        <ResponsiveContainer width="100%" height={height} style={{ userSelect:"none", WebkitUserSelect:"none" }}>
          <BarChart
            accessibilityLayer={false}
            data={chartData}
            layout="vertical"
            margin={{ top: 6, right: 18, left: 12, bottom: 8 }}
            barCategoryGap="24%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
            <XAxis
              type="number"
              tick={<ScientificExponentTick />}
              axisLine={false}
              tickLine={false}
              domain={xDomain}
              ticks={tickValues}
              height={32}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={<WrappedCategoryTick maxCharsPerLine={20} maxLines={3} />}
              axisLine={false}
              tickLine={false}
              width={170}
              interval={0}
            />
            <Tooltip content={<DeltaChartTip />} />
            <ReferenceLine x={0} stroke="#C9D4E3" />
            <Bar dataKey="scaledDelta" name="Change" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.delta >= 0 ? C.teal : negativeBar} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState label="No movers are available for the selected years." />
      )}
    </ChartCardFrame>
  );
}

function DataTableCard({ rows, selectedYears, searchQuery, onSearchChange, totalRowCount }) {
  const showAverage = selectedYears.length > 1;
  const [pageTooltip, setPageTooltip] = useState(null);

  return (
    <ChartCardFrame
      title="A.4 Data Table"
      action={(
        <div style={{
          padding:"7px 10px",
          borderRadius:999,
          border:`1px solid ${C.border}`,
          background:"rgba(255,255,255,.72)",
          fontFamily:F.mono,
          fontSize:10,
          color:C.muted,
          letterSpacing:"0.05em",
        }}>
          {numberFormatter.format(rows.length)} of {numberFormatter.format(totalRowCount)} line items
        </div>
      )}
      style={{ overflow:"hidden" }}
      bodyStyle={{ overflow:"hidden" }}
    >
      {pageTooltip ? (
        <div
          style={{
            position:"fixed",
            left:pageTooltip.x,
            top:pageTooltip.y,
            padding:"6px 10px",
            borderRadius:8,
            background:"rgba(8,33,73,.94)",
            color:"#F4FCFD",
            fontFamily:F.mono,
            fontSize:10,
            letterSpacing:"0.04em",
            whiteSpace:"nowrap",
            boxShadow:"0 8px 18px rgba(0,22,58,.18)",
            pointerEvents:"none",
            zIndex:90,
          }}
        >
          Page {pageTooltip.pageNo}
        </div>
      ) : null}
      <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:12 }}>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search item, department, agency..."
          aria-label="Search A.4 data table"
          style={{
            width:"min(360px, 100%)",
            padding:"11px 14px",
            borderRadius:10,
            border:`1px solid ${C.border}`,
            background:"rgba(255,255,255,.88)",
            color:C.navy,
            fontFamily:F.sans,
            fontSize:13,
            outline:"none",
            boxShadow:"0 8px 18px rgba(0,22,58,.05)",
          }}
        />
      </div>
      <div style={{
        border:`1px solid ${C.border}`,
        borderRadius:10,
        overflow:"auto",
        maxHeight:420,
        background:"rgba(255,255,255,.72)",
      }}>
        <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:0, minWidth:1040 }}>
          <thead>
            <tr>
              {["Department", "Agency", "Type", "Category", "Item", ...selectedYears.map((year) => `${year}`), ...(showAverage ? ["Selected Avg"] : [])].map((header) => (
                <th
                  key={header}
                  style={{
                    position:"sticky",
                    top:0,
                    zIndex:1,
                    padding:"12px 14px",
                    textAlign: header.includes("202") || header === "Selected Avg" ? "right" : "left",
                    fontFamily:F.mono,
                    fontSize:10,
                    letterSpacing:"0.08em",
                    textTransform:"uppercase",
                    color:C.muted,
                    background:"#F8FBFD",
                    borderBottom:`1px solid ${C.border}`,
                    whiteSpace:"nowrap",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => {
              const rowKey = `${row.dept}-${row.agency}-${row.itemName}-${index}`;

              return (
              <tr
                key={rowKey}
                onMouseMove={(event) => {
                  if (!row.pageNo) return;
                  setPageTooltip({
                    pageNo: row.pageNo,
                    x: event.clientX + 14,
                    y: event.clientY + 14,
                  });
                }}
                onMouseLeave={() => setPageTooltip((current) => current?.pageNo === row.pageNo ? null : current)}
                style={{
                  background:index % 2 === 0 ? "rgba(255,255,255,.92)" : "rgba(241,245,248,.72)",
                }}
              >
                <td style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.dark, verticalAlign:"top" }}>{row.dept}</td>
                <td style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.dark, verticalAlign:"top" }}>{row.agency}</td>
                <td style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.dark, verticalAlign:"top" }}>{row.appropriationType}</td>
                <td style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.dark, verticalAlign:"top" }}>{row.category}</td>
                <td style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.dark, verticalAlign:"top", minWidth:220 }}>
                  {row.itemName}
                </td>
                {selectedYears.map((year) => (
                  <td
                    key={`${row.itemName}-${year}`}
                    style={{
                      padding:"12px 14px",
                      borderBottom:`1px solid ${C.border}`,
                      fontSize:12,
                      color:C.navy,
                      textAlign:"right",
                      fontFamily:F.mono,
                      whiteSpace:"nowrap",
                    }}
                  >
                    {formatPeso(row[year])}
                  </td>
                ))}
                {showAverage ? (
                  <td style={{
                    padding:"12px 14px",
                    borderBottom:`1px solid ${C.border}`,
                    fontSize:12,
                    color:C.navy,
                    textAlign:"right",
                    fontFamily:F.mono,
                    whiteSpace:"nowrap",
                    fontWeight:600,
                  }}>
                    {formatPeso(row.selectedAverage)}
                  </td>
                ) : null}
              </tr>
            )}) : (
              <tr>
                <td
                  colSpan={6 + selectedYears.length + (showAverage ? 1 : 0)}
                  style={{
                    padding:"22px 24px",
                    textAlign:"center",
                    color:C.muted,
                    fontSize:12,
                  }}
                >
                  No rows match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ChartCardFrame>
  );
}

/* ─── MAIN DASHBOARD ──────────────────────────────── */
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("A.4");
  const [hoveredNav, setHoveredNav] = useState(null);
  const [years, setYears] = useState(["2025"]);
  const [tableSearch, setTableSearch] = useState("");
  const [rejectedYear, setRejectedYear] = useState(null);
  const [kpiGridHeight, setKpiGridHeight] = useState(0);
  const rejectedYearTimeoutRef = useRef(null);
  const kpiGridRef = useRef(null);

  const toggleYear = (year) => {
    setYears((current) => {
      if (current.includes(year)) {
        if (current.length === 1) {
          setRejectedYear(year);
          if (rejectedYearTimeoutRef.current) {
            clearTimeout(rejectedYearTimeoutRef.current);
          }
          rejectedYearTimeoutRef.current = setTimeout(() => {
            setRejectedYear(null);
            rejectedYearTimeoutRef.current = null;
          }, 360);
          return current;
        }

        return current.filter((item) => item !== year);
      }

      return [...current, year];
    });
  };

  const filteredRows = useMemo(() => a4Data, []);
  const selectedYears = useMemo(
    () => [...years].sort((a, b) => Number(a) - Number(b)),
    [years]
  );
  const activePage = useMemo(
    () => navItems.find((item) => item.type === "page" && item.id === activeNav) ?? navItems.find((item) => item.type === "page"),
    [activeNav]
  );
  const activePageCsvFilename = useMemo(
    () => (activePage ? getPageCsvFilename(activePage.id) : null),
    [activePage]
  );
  const isA4Page = activeNav === "A.4";
  const isMultiYearSelection = selectedYears.length > 1;
  const oldestSelectedYear = selectedYears[0];
  const mostRecentSelectedYear = selectedYears[selectedYears.length - 1];
  const comparisonYear = useMemo(() => {
    if (selectedYears.length === yearOptions.length) return null;
    const oldestIndex = yearOptions.indexOf(oldestSelectedYear);
    if (oldestIndex <= 0) return null;
    const priorYear = yearOptions[oldestIndex - 1];
    return selectedYears.includes(priorYear) ? null : priorYear;
  }, [oldestSelectedYear, selectedYears]);
  const selectionSummary = selectedYears.length === 1
    ? `${selectedYears[0]} selected`
    : `Average across ${selectedYears.length} selected years`;
  const comparisonLabel = `${oldestSelectedYear} to ${mostRecentSelectedYear}`;

  useEffect(() => {
    const node = kpiGridRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    const syncHeight = () => {
      setKpiGridHeight(node.getBoundingClientRect().height);
    };

    syncHeight();

    const observer = new ResizeObserver(() => {
      syncHeight();
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const overallTotalsByYear = useMemo(
    () => buildYearTotals(filteredRows),
    [filteredRows]
  );
  const continuingTotalsByYear = useMemo(
    () => buildYearTotals(filteredRows, (row) => row.appropriationType === "Continuing"),
    [filteredRows]
  );
  const totalsExcludingPublicWorksByYear = useMemo(
    () => buildYearTotals(filteredRows, (row) => row.dept !== publicWorksDepartment),
    [filteredRows]
  );
  const newGeneralTotalsByYear = useMemo(
    () => buildYearTotals(filteredRows, (row) => row.appropriationType === "New General"),
    [filteredRows]
  );
  const automaticTotalsByYear = useMemo(
    () => buildYearTotals(filteredRows, (row) => row.appropriationType === "Automatic"),
    [filteredRows]
  );

  const selectedYearTotal = useMemo(
    () => selectedWindowAverage(overallTotalsByYear, selectedYears),
    [overallTotalsByYear, selectedYears]
  );
  const continuingSelectedTotal = useMemo(
    () => selectedWindowAverage(continuingTotalsByYear, selectedYears),
    [continuingTotalsByYear, selectedYears]
  );
  const selectedTotalExcludingPublicWorks = useMemo(
    () => selectedWindowAverage(totalsExcludingPublicWorksByYear, selectedYears),
    [selectedYears, totalsExcludingPublicWorksByYear]
  );
  const newGeneralSelectedTotal = useMemo(
    () => selectedWindowAverage(newGeneralTotalsByYear, selectedYears),
    [newGeneralTotalsByYear, selectedYears]
  );
  const automaticSelectedTotal = useMemo(
    () => selectedWindowAverage(automaticTotalsByYear, selectedYears),
    [automaticTotalsByYear, selectedYears]
  );

  const yearTotalComparisonValue = comparisonYear ? overallTotalsByYear[comparisonYear] || 0 : null;
  const { change: yearTotalChange, tone: yearTotalTone } = getComparisonMeta(
    selectedYearTotal,
    yearTotalComparisonValue || 0,
    Boolean(comparisonYear)
  );
  const publicWorksExcludedComparisonValue = comparisonYear ? totalsExcludingPublicWorksByYear[comparisonYear] || 0 : null;
  const { change: publicWorksExcludedChange, tone: publicWorksExcludedTone } = getComparisonMeta(
    selectedTotalExcludingPublicWorks,
    publicWorksExcludedComparisonValue || 0,
    Boolean(comparisonYear)
  );
  const continuingComparisonValue = comparisonYear ? continuingTotalsByYear[comparisonYear] || 0 : null;
  const { change: continuingChange, tone: continuingTone } = getComparisonMeta(
    continuingSelectedTotal,
    continuingComparisonValue || 0,
    Boolean(comparisonYear)
  );
  const newGeneralComparisonValue = comparisonYear ? newGeneralTotalsByYear[comparisonYear] || 0 : null;
  const { change: newGeneralChange, tone: newGeneralTone } = getComparisonMeta(
    newGeneralSelectedTotal,
    newGeneralComparisonValue || 0,
    Boolean(comparisonYear)
  );
  const automaticComparisonValue = comparisonYear ? automaticTotalsByYear[comparisonYear] || 0 : null;
  const { change: automaticChange, tone: automaticTone } = getComparisonMeta(
    automaticSelectedTotal,
    automaticComparisonValue || 0,
    Boolean(comparisonYear)
  );

  const fundedAgencyCount = useMemo(() => {
    const fundedAgencies = new Set();
    filteredRows.forEach((row) => {
      if (selectedYears.some((year) => getRowYearValue(row, year) > 0)) {
        fundedAgencies.add(row.agency);
      }
    });
    return fundedAgencies.size;
  }, [filteredRows, selectedYears]);

  const departmentTreemapData = useMemo(() => (
    aggregateAllYears(filteredRows, "dept")
      .map((item) => ({
        name: item.name,
        value: selectedWindowAverage(item, selectedYears),
        orderValue: item[mostRecentSelectedYear] || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => {
        const delta = b.orderValue - a.orderValue;
        if (delta) return delta;
        const valueDelta = b.value - a.value;
        if (valueDelta) return valueDelta;
        return a.name.localeCompare(b.name);
      })
  ), [filteredRows, mostRecentSelectedYear, selectedYears]);

  const topAgencyData = useMemo(() => (
    aggregateAllYears(filteredRows, "agency")
      .filter((item) => selectedYears.some((year) => item[year] > 0))
      .sort((a, b) => {
        const delta = (b[mostRecentSelectedYear] || 0) - (a[mostRecentSelectedYear] || 0);
        return delta || a.name.localeCompare(b.name);
      })
      .slice(0, 10)
  ), [filteredRows, mostRecentSelectedYear, selectedYears]);

  const buildMovers = (labelKey) => (
    aggregateAllYears(filteredRows, labelKey)
      .map((item) => ({
        name: item.name,
        delta: (item[mostRecentSelectedYear] || 0) - (item[oldestSelectedYear] || 0),
        startYear: oldestSelectedYear,
        endYear: mostRecentSelectedYear,
        startValue: item[oldestSelectedYear] || 0,
        endValue: item[mostRecentSelectedYear] || 0,
      }))
      .filter((item) => item.delta !== 0)
      .sort((a, b) => {
        const deltaMagnitude = Math.abs(b.delta) - Math.abs(a.delta);
        if (deltaMagnitude) return deltaMagnitude;
        const latestYearDelta = b.endValue - a.endValue;
        if (latestYearDelta) return latestYearDelta;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8)
  );

  const biggestDepartmentMoves = useMemo(
    () => (isMultiYearSelection ? buildMovers("dept") : []),
    [filteredRows, isMultiYearSelection, mostRecentSelectedYear, oldestSelectedYear]
  );
  const biggestAgencyMoves = useMemo(
    () => (isMultiYearSelection ? buildMovers("agency") : []),
    [filteredRows, isMultiYearSelection, mostRecentSelectedYear, oldestSelectedYear]
  );

  const tableRows = useMemo(() => (
    filteredRows
      .map((row) => {
        const yearValues = yearOptions.reduce((acc, year) => {
          acc[year] = getRowYearValue(row, year);
          return acc;
        }, {});

        return {
          ...row,
          ...yearValues,
          selectedAverage: selectedWindowAverage(yearValues, selectedYears),
          latestSelectedValue: yearValues[mostRecentSelectedYear] || 0,
        };
      })
      .sort((a, b) => {
        const delta = b.latestSelectedValue - a.latestSelectedValue;
        if (delta) return delta;
        return b.selectedAverage - a.selectedAverage;
      })
  ), [filteredRows, mostRecentSelectedYear, selectedYears]);

  const visibleTableRows = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    if (!query) return tableRows;

    return tableRows.filter((row) => (
      [
        row.dept,
        row.agency,
        row.appropriationType,
        row.category,
        row.itemName,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    ));
  }, [tableRows, tableSearch]);

  const handleDownloadCsv = () => {
    if (!activePageCsvFilename) return;

    const csvRaw = pageCsvRawMap[activePageCsvFilename];
    if (!csvRaw) return;

    const blob = new Blob([csvRaw], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = activePageCsvFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const kpiCards = useMemo(() => ([
    {
      title: selectedYears.length > 1 ? "Year Average" : "Year Total",
      value: formatPesoCompact(selectedYearTotal),
      change: yearTotalChange,
      tone: yearTotalTone,
    },
    {
      title: "New General Total",
      value: formatPesoCompact(newGeneralSelectedTotal),
      change: newGeneralChange,
      tone: newGeneralTone,
    },
    {
      title: "Spending Minus Public Works",
      value: formatPesoCompact(selectedTotalExcludingPublicWorks),
      change: publicWorksExcludedChange,
      tone: publicWorksExcludedTone,
    },
    {
      title: "Automatic Total",
      value: formatPesoCompact(automaticSelectedTotal),
      change: automaticChange,
      tone: automaticTone,
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
      change: continuingChange,
      tone: continuingTone,
    },
  ]), [
    automaticChange,
    automaticSelectedTotal,
    automaticTone,
    continuingChange,
    continuingSelectedTotal,
    continuingTone,
    fundedAgencyCount,
    newGeneralChange,
    newGeneralSelectedTotal,
    newGeneralTone,
    publicWorksExcludedChange,
    publicWorksExcludedTone,
    selectedYearTotal,
    selectedTotalExcludingPublicWorks,
    selectedYears,
    yearTotalChange,
    yearTotalTone,
  ]);

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:C.mist, fontFamily: F.sans }}>
      <style>{`
        @keyframes sidebarShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
        }
      `}</style>
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        hoveredNav={hoveredNav}
        setHoveredNav={setHoveredNav}
        years={years}
        toggleYear={toggleYear}
        rejectedYear={rejectedYear}
      />

      <main style={{ flex:1, overflowY:"auto", overscrollBehavior:"contain", minWidth:0, background:"linear-gradient(180deg, #F5F8FB 0%, #EEF3F6 100%)" }}>
        <div style={{ padding:"22px 22px 32px", display:"flex", flexDirection:"column", gap:20, position:"relative", minHeight:"100%" }}>
          <TopBar
            title={activePage?.navLabel || "Dashboard"}
            meta={isA4Page ? `${selectedYears.join(", ")} selected • ${numberFormatter.format(filteredRows.length)} line items` : "Not implemented yet"}
            onDownload={handleDownloadCsv}
            downloadDisabled={!activePageCsvFilename}
          />

          {isA4Page ? (
            <>
              <div style={{
                display:"grid",
                gridTemplateColumns:"minmax(0, 1.55fr) minmax(0, 2.45fr)",
                gap:13,
                alignItems:"start",
              }}>
                <div style={{
                  minWidth:0,
                  display:"grid",
                  gridTemplateColumns:"repeat(2, minmax(0, 1fr))",
                  gridTemplateRows:"repeat(3, 112px)",
                  gap:13,
                  alignContent:"start",
                }}
                ref={kpiGridRef}
                >
                  {kpiCards.map((item) => (
                    <A4KpiCard
                      key={item.title}
                      title={item.title}
                      value={item.value}
                      change={item.change}
                      tone={item.tone}
                      featured={item.featured}
                      style={item.style}
                    />
                  ))}
                </div>

                <TreemapChartCard
                  title="Expenditure by Department"
                  data={departmentTreemapData}
                  style={{ height: `${Math.max(kpiGridHeight, 360)}px` }}
                />
              </div>

              <GroupedAgencyChart
                title="Top 10 Agencies"
                data={topAgencyData}
                selectedYears={selectedYears}
                height={Math.max(420, topAgencyData.length * 38)}
              />

              {isMultiYearSelection ? (
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"repeat(2, minmax(0, 1fr))",
                  gap:13,
                }}>
                  <BiggestMovesChart
                    title="Biggest Moves by Department"
                    data={biggestDepartmentMoves}
                    height={Math.max(340, biggestDepartmentMoves.length * 34)}
                    comparisonLabel={comparisonLabel}
                  />
                  <BiggestMovesChart
                    title="Biggest Moves by Agency"
                    data={biggestAgencyMoves}
                    height={Math.max(340, biggestAgencyMoves.length * 34)}
                    comparisonLabel={comparisonLabel}
                  />
                </div>
              ) : null}

              <DataTableCard
                rows={visibleTableRows}
                selectedYears={selectedYears}
                searchQuery={tableSearch}
                onSearchChange={setTableSearch}
                totalRowCount={tableRows.length}
              />
            </>
          ) : (
            <PlaceholderPage page={activePage} />
          )}
        </div>
      </main>
    </div>
  );
}
