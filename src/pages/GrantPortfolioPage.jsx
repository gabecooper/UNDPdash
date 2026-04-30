import { useEffect, useMemo, useState } from "react";
import worldBankRaw from "../../example/philippines_projects_a4_like.csv?raw";
import { parseCsv, toNumber } from "../data/csv";
import { formatMoney, getActivePhpPerUsdRate } from "../data/formatters";
import { C, F, TREEMAP_PALETTE } from "../theme/tokens";
import { cardStyle, eyebrowStyle } from "../theme/styles";

const ADB_SOVEREIGN_PH_URL = "/adb-sovereign-projects-ph.csv";
const worldBankRows = parseCsv(worldBankRaw);

const VIEW_OPTIONS = [
  { id: "world-bank", label: "World Bank View" },
  { id: "adb", label: "ADB View" },
];

function parseDateToYear(value) {
  if (!value) return "";
  const yearMatch = String(value).match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : "";
}

function parseWorldBankDataset(rows) {
  const normalizedRows = rows.map((row) => {
    const grantAmount = toNumber(row["2025_Program_NG"]);
    const totalAmount = toNumber(row["2026_GAA_NG"]);
    const loanAmount = toNumber(row["2024_Actual_NG"]);
    const leadAgency = row.Dept_Name || "Unspecified";
    return {
      id: row.project_id || "N/A",
      title: row.Item_Name || "Untitled project",
      agency: leadAgency,
      status: row.Appropriation_Type || "Unspecified",
      stage: row.Category || "Unspecified",
      year: row.Page_No || parseDateToYear(row.Board_Approval_Date),
      boardDate: row.Board_Approval_Date || "",
      grantAmount,
      loanAmount,
      totalAmount,
    };
  });

  const totalGrants = normalizedRows.reduce((sum, row) => sum + row.grantAmount, 0);
  const totalLoans = normalizedRows.reduce((sum, row) => sum + row.loanAmount, 0);
  const totalPortfolio = normalizedRows.reduce((sum, row) => sum + row.totalAmount, 0);
  const currentGrantPortfolio = normalizedRows
    .filter((row) => row.status === "Active" || row.status === "Pipeline")
    .reduce((sum, row) => sum + row.grantAmount, 0);
  const currentPortfolio = normalizedRows
    .filter((row) => row.status === "Active" || row.status === "Pipeline")
    .reduce((sum, row) => sum + row.totalAmount, 0);
  const activeCount = normalizedRows.filter((row) => row.status.toLowerCase() === "active").length;
  const pipelineCount = normalizedRows.filter((row) => row.status.toLowerCase() === "pipeline").length;
  const topGrantAgencies = Object.entries(
    normalizedRows.reduce((accumulator, row) => {
      accumulator[row.agency] = (accumulator[row.agency] || 0) + row.grantAmount;
      return accumulator;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .filter((entry) => entry.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 8);
  const statusBreakdown = Object.entries(
    normalizedRows.reduce((accumulator, row) => {
      const status = String(row.status || "Unspecified").trim() || "Unspecified";
      accumulator[status] = (accumulator[status] || 0) + 1;
      return accumulator;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value);

  return {
    rows: normalizedRows,
    summary: {
      count: normalizedRows.length,
      totalGrants,
      totalLoans,
      totalPortfolio,
      currentGrantPortfolio,
      currentPortfolio,
      activeCount,
      pipelineCount,
      topGrantAgencies,
      statusBreakdown,
    },
  };
}

function parseAdbSovereignCsv(csvText) {
  const rows = parseCsv(csvText).map((row) => ({
    id: row["Project Number"] || "N/A",
    title: row["Project Name"] || "Untitled project",
    agency: row["Executing Agency"] || "Unspecified",
    status: row.Status || "Unspecified",
    financeType: row.Financing || "Unspecified",
    approvalDate: row["Approval Date"] || "",
    year: parseDateToYear(row["Approval Date"]),
    amount: toNumber(row["ADB Financing (US$)"]),
  }));

  const financeBreakdown = Object.entries(
    rows.reduce((accumulator, row) => {
      const financeTypes = String(row.financeType || "Unspecified")
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean);
      const types = financeTypes.length ? financeTypes : ["Unspecified"];
      types.forEach((type) => {
        accumulator[type] = (accumulator[type] || 0) + 1;
      });
      return accumulator;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value);

  const topAgencies = Object.entries(
    rows.reduce((accumulator, row) => {
      accumulator[row.agency] = (accumulator[row.agency] || 0) + row.amount;
      return accumulator;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8);

  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  const activeAmount = rows.filter((row) => row.status === "Active").reduce((sum, row) => sum + row.amount, 0);
  const statusBreakdown = [
    { name: "Active", value: rows.filter((row) => row.status === "Active").length },
    { name: "Approved", value: rows.filter((row) => row.status === "Proposed").length },
    { name: "Closed", value: rows.filter((row) => row.status === "Closed").length },
  ].filter((row) => row.value > 0);

  return {
    rows,
    summary: {
      count: rows.length,
      totalAmount,
      activeAmount,
      activeCount: rows.filter((row) => row.status === "Active").length,
      closedCount: rows.filter((row) => row.status === "Closed").length,
      proposedCount: rows.filter((row) => row.status === "Proposed").length,
      financeBreakdown,
      statusBreakdown,
      topAgencies,
    },
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatAmountFromUsd(amount, currencyDisplay) {
  const phpValue = (amount || 0) * getActivePhpPerUsdRate();
  return formatMoney(phpValue, { currencyDisplay });
}

function getKpiValueFontSize(value) {
  const text = String(value ?? "");
  if (text.length <= 10) return "clamp(20px, 1.9vw, 26px)";
  if (text.length <= 14) return "clamp(17px, 1.6vw, 22px)";
  if (text.length <= 18) return "clamp(14px, 1.35vw, 18px)";
  if (text.length <= 24) return "clamp(12px, 1.15vw, 15px)";
  if (text.length <= 32) return "clamp(10px, 1vw, 13px)";
  return "clamp(8px, 0.85vw, 11px)";
}

function KpiCard({ label, value, sub }) {
  return (
    <article style={{ ...cardStyle, padding: 14, minHeight: 132, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8 }}>
      <div style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: 2 }}>{label}</div>
      <div
        style={{
          fontFamily: F.serif,
          fontSize: getKpiValueFontSize(value),
          lineHeight: 1.02,
          color: C.navy,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      <div style={{ color: C.muted, fontSize: 11.5, lineHeight: 1.35 }}>{sub}</div>
    </article>
  );
}

function RankedBars({ rows, formatter }) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((row, index) => (
        <div key={`${row.name}-${index}`}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4, fontSize: 13 }}>
            <span style={{ color: C.navy }}>{row.name}</span>
            <strong style={{ color: C.navy }}>{formatter(row.value)}</strong>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: C.grid, overflow: "hidden" }}>
            <div style={{ width: `${(row.value / maxValue) * 100}%`, height: "100%", background: TREEMAP_PALETTE[index % TREEMAP_PALETTE.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function describeArcPath(cx, cy, radius, startAngle, endAngle) {
  const toPoint = (angle) => {
    const radians = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
  };
  const start = toPoint(startAngle);
  const end = toPoint(endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function StatusPie({ rows }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!total) return <div style={{ color: C.muted, fontSize: 13 }}>No status data</div>;

  let startAngle = 0;
  const slices = rows.map((row, index) => {
    const sweepAngle = (row.value / total) * 360;
    const endAngle = startAngle + sweepAngle;
    const next = {
      ...row,
      path: describeArcPath(88, 88, 66, startAngle, endAngle),
      color: TREEMAP_PALETTE[index % TREEMAP_PALETTE.length],
    };
    startAngle = endAngle;
    return next;
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, alignItems: "center" }}>
      <div style={{ display: "grid", placeItems: "center" }}>
        <svg viewBox="0 0 176 176" width="168" height="168" aria-label="ADB status mix pie chart">
          {slices.map((slice) => <path key={slice.name} d={slice.path} fill={slice.color} />)}
          <circle cx="88" cy="88" r="40" fill={C.white} />
          <text x="88" y="84" textAnchor="middle" style={{ fill: C.navy, fontFamily: F.serif, fontSize: 18 }}>{formatNumber(total)}</text>
          <text x="88" y="100" textAnchor="middle" style={{ fill: C.muted, fontFamily: F.mono, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase" }}>Projects</text>
        </svg>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {slices.map((slice) => (
          <div key={slice.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: slice.color }} />
              <span style={{ color: C.navy, fontSize: 13 }}>{slice.name}</span>
            </div>
            <strong style={{ color: C.navy, fontSize: 13 }}>{formatNumber(slice.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GrantPortfolioPage({ currencyDisplay = "php" }) {
  const [view, setView] = useState("world-bank");
  const [adbState, setAdbState] = useState({ loading: true, error: "", data: { rows: [], summary: { count: 0, topAgencies: [], financeBreakdown: [] } } });
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const worldBankState = useMemo(() => parseWorldBankDataset(worldBankRows), []);

  useEffect(() => {
    let cancelled = false;
    async function loadAdb() {
      try {
        const response = await fetch(ADB_SOVEREIGN_PH_URL);
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const csvText = await response.text();
        const parsed = parseAdbSovereignCsv(csvText);
        if (!parsed.rows.length) throw new Error("No ADB sovereign rows in local CSV");
        if (!cancelled) {
          setAdbState({ loading: false, error: "", data: parsed });
        }
      } catch (error) {
        if (!cancelled) {
          setAdbState((current) => ({ ...current, loading: false, error: "Unable to load ADB feed right now." }));
        }
      }
    }
    loadAdb();
    return () => {
      cancelled = true;
    };
  }, []);

  const isWorldBank = view === "world-bank";
  const currentRows = isWorldBank ? worldBankState.rows : adbState.data.rows;
  const worldBankSummary = worldBankState.summary;
  const adbSummary = adbState.data.summary;
  const statusOptions = useMemo(
    () => ["all", ...new Set(currentRows.map((row) => row.status).filter(Boolean)).values()],
    [currentRows]
  );
  const typeOptions = useMemo(
    () => ["all", ...new Set((isWorldBank ? currentRows.map((row) => row.stage) : currentRows.map((row) => row.financeType)).filter(Boolean)).values()],
    [currentRows, isWorldBank]
  );
  const filteredRows = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    return currentRows.filter((row) => {
      const haystack = isWorldBank
        ? [row.id, row.title, row.agency, row.status, row.stage, row.year, row.boardDate].join(" ").toLowerCase()
        : [row.id, row.title, row.agency, row.status, row.financeType, row.approvalDate, row.year].join(" ").toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (isWorldBank && typeFilter !== "all" && row.stage !== typeFilter) return false;
      if (!isWorldBank && typeFilter !== "all" && row.financeType !== typeFilter) return false;
      return true;
    });
  }, [currentRows, isWorldBank, statusFilter, tableSearch, typeFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={eyebrowStyle}>Development Finance Dashboard</div>
            <h1 style={{ margin: 0, fontFamily: F.serif, fontWeight: 400, fontSize: "clamp(24px, 3vw, 34px)", color: C.navy }}>Philippines Grants Portfolio</h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {VIEW_OPTIONS.map((option) => {
              const active = option.id === view;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setView(option.id)}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${active ? C.teal : C.border}`,
                    background: active ? "rgba(118,194,201,.18)" : C.white,
                    color: active ? C.navy : C.muted,
                    padding: "9px 14px",
                    fontFamily: F.mono,
                    fontSize: 10.5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isWorldBank ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
            <KpiCard label="World Bank Projects" value={formatNumber(worldBankSummary.count)} sub="Attached World Bank source" />
            <KpiCard label="Total Grants" value={formatAmountFromUsd(worldBankSummary.totalGrants, currencyDisplay)} sub="Grant column in source data" />
            <KpiCard label="Total Loans" value={formatAmountFromUsd(worldBankSummary.totalLoans, currencyDisplay)} sub="Loan column in source data" />
            <KpiCard label="Current Grant Financing" value={formatAmountFromUsd(worldBankSummary.currentGrantPortfolio, currencyDisplay)} sub="Active + Pipeline grants only" />
            <KpiCard label="Pipeline" value={formatNumber(worldBankSummary.pipelineCount)} sub="Status: Pipeline" />
            <KpiCard label="Active" value={formatNumber(worldBankSummary.activeCount)} sub="Status: Active" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(260px, 1fr)", gap: 12 }}>
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={eyebrowStyle}>World Bank Ranked View</div>
              <h2 style={{ margin: "0 0 10px", fontFamily: F.serif, fontWeight: 400, color: C.navy }}>Top Lead Agencies by Grant Amount</h2>
              <RankedBars rows={worldBankSummary.topGrantAgencies} formatter={(value) => formatAmountFromUsd(value, currencyDisplay)} />
            </div>
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={eyebrowStyle}>World Bank Status Mix</div>
              <h2 style={{ margin: "0 0 10px", fontFamily: F.serif, fontWeight: 400, color: C.navy }}>Project Status Distribution</h2>
              <StatusPie rows={worldBankSummary.statusBreakdown || []} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
            <KpiCard label="ADB Projects (PH)" value={formatNumber(adbSummary.count)} sub="Philippines-only sovereign dataset" />
            <KpiCard label="Active Financing" value={formatAmountFromUsd(adbSummary.activeAmount, currencyDisplay)} sub="Active projects only" />
            <KpiCard label="Active" value={formatNumber(adbSummary.activeCount)} sub="Project status" />
            <KpiCard label="Closed" value={formatNumber(adbSummary.closedCount)} sub="Project status" />
            <KpiCard label="Approved" value={formatNumber(adbSummary.proposedCount)} sub="Proposed in source status" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(260px, 1fr)", gap: 12 }}>
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={eyebrowStyle}>ADB Ranked View</div>
              <h2 style={{ margin: "0 0 10px", fontFamily: F.serif, fontWeight: 400, color: C.navy }}>Top Executing Agencies by Financing</h2>
              <RankedBars rows={adbSummary.topAgencies} formatter={(value) => formatAmountFromUsd(value, currencyDisplay)} />
            </div>
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={eyebrowStyle}>ADB Status Mix</div>
              <h2 style={{ margin: "0 0 10px", fontFamily: F.serif, fontWeight: 400, color: C.navy }}>Active / Approved / Closed</h2>
              <StatusPie rows={adbSummary.statusBreakdown || []} />
            </div>
          </div>
          {adbState.loading && <div style={{ color: C.muted, fontSize: 13 }}>Loading ADB data...</div>}
          {adbState.error && <div style={{ color: "#B03030", fontSize: 13 }}>{adbState.error}</div>}
        </>
      )}

      <div style={{ ...cardStyle, padding: 18 }}>
        <div style={eyebrowStyle}>{isWorldBank ? "World Bank Table" : "ADB Table"}</div>
        <h2 style={{ margin: "0 0 10px", fontFamily: F.serif, fontWeight: 400, color: C.navy }}>
          {isWorldBank ? "World Bank Projects" : "ADB Activities"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr .85fr .85fr", gap: 10, marginBottom: 10 }}>
          <input
            type="search"
            value={tableSearch}
            onChange={(event) => setTableSearch(event.target.value)}
            placeholder={isWorldBank ? "Search project, agency, status, stage, or ID..." : "Search project, agency, status, financing type, or ID..."}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.navy, fontFamily: F.sans, fontSize: 13 }}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.navy, fontFamily: F.sans, fontSize: 13 }}
          >
            <option value="all">All statuses</option>
            {statusOptions.filter((option) => option !== "all").map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.navy, fontFamily: F.sans, fontSize: 13 }}
          >
            <option value="all">{isWorldBank ? "All stages" : "All finance types"}</option>
            {typeOptions.filter((option) => option !== "all").map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ background: "rgba(241,245,248,.95)" }}>
                {(isWorldBank
                  ? ["Project", "Lead Agency", "Status", "Stage", "Year", "Grant", "Loan", "Total"]
                  : ["Project", "Executing Agency", "Status", "Financing", "Approval Date", "ADB Financing", "Project Number"]
                ).map((header) => (
                  <th key={header} style={{ textAlign: "left", padding: "12px 10px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontFamily: F.mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 100).map((row) => (
                <tr key={row.id}>
                  {isWorldBank ? (
                    <>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}`, color: C.navy }}>{row.title}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{row.agency}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{row.status}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{row.stage}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{row.year || row.boardDate}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{formatAmountFromUsd(row.grantAmount, currencyDisplay)}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{formatAmountFromUsd(row.loanAmount, currencyDisplay)}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{formatAmountFromUsd(row.totalAmount, currencyDisplay)}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}`, color: C.navy }}>{row.title}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{row.agency}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{row.status}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{row.financeType}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{row.approvalDate}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}` }}>{formatAmountFromUsd(row.amount, currencyDisplay)}</td>
                      <td style={{ padding: "10px", borderBottom: `1px solid ${C.border}`, fontFamily: F.mono, fontSize: 11 }}>{row.id}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
