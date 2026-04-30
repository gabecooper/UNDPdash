import a4Raw from "../../new_csv/A4.csv?raw";
import b21Raw from "../../new_csv/B21.csv?raw";
import b5aRaw from "../../new_csv/B5a.csv?raw";
import b8Raw from "../../new_csv/B8.csv?raw";
import { parseCsv, toNumber } from "../data/csv";
import { getLatestSelectedYear } from "../data/selectors";
import { formatMoneyCompact } from "../data/formatters";
import { C, F } from "../theme/tokens";
import { cardStyle, eyebrowStyle } from "../theme/styles";

const a4Rows = parseCsv(a4Raw);
const b21Rows = parseCsv(b21Raw);
const b5aRows = parseCsv(b5aRaw);
const b8Rows = parseCsv(b8Raw);

function sumRows(rows, predicate, field) {
  return rows.reduce((total, row) => total + (predicate(row) ? toNumber(row[field]) : 0), 0);
}

const YEAR_FIELDS = {
  "2024": {
    b5aTotal: "2024_Actual",
    a4DepartmentTotal: "2024_Actual_TOTAL",
    b8DepartmentTotal: "2024_Actual_Total",
    b21ClimateTotal: "2024_Actual_CC_Expenditure_Total",
    label: "Actual",
  },
  "2025": {
    b5aTotal: "2025_Program",
    a4DepartmentTotal: "2025_Program_TOTAL",
    b8DepartmentTotal: "2025_Program_Total",
    b21ClimateTotal: "2025_GAA_CC_Expenditure_Total",
    label: "Program",
  },
  "2026": {
    b5aTotal: "2026_GAA",
    a4DepartmentTotal: "2026_GAA_TOTAL",
    b8DepartmentTotal: "2026_GAA_Total",
    b21ClimateTotal: "2026_GAA_CC_Expenditure_Total",
    label: "GAA",
  },
};

const BRIEFER_ESTIMATES = [
  { label: "Education", peopleAmount: 977_600_000, source: "B.8 (DepEd + SUCs + CHED + TESDA)" },
  { label: "Public Works", peopleAmount: 900_000_000, source: "B.8 (DPWH)" },
  { label: "Health", peopleAmount: 297_600_000, source: "B.8 (DOH)" },
  { label: "Interior and Local Government", peopleAmount: 278_400_000, source: "B.8 (DILG)" },
  { label: "Defense", peopleAmount: 256_100_000, source: "B.8 (DND)" },
  { label: "Social Welfare", peopleAmount: 230_100_000, source: "B.8 (DSWD)" },
  { label: "Agriculture", peopleAmount: 211_300_000, source: "B.8 (DA + DAR)" },
  { label: "Transportation", peopleAmount: 180_900_000, source: "B.8 (DOTr)" },
  { label: "Climate Change Expenditures", peopleAmount: 1_020_000_000, source: "B.21 (TOTAL)" },
];

const isTopLevel = (row) => row.SubSector_Name === "None" && row.Dept_Agency === "None" && row.Item_Name === "None";

function buildAlignmentDataset(activeYear) {
  const yearFields = YEAR_FIELDS[activeYear] || YEAR_FIELDS["2025"];
  const sumB8 = (departmentNames) => sumRows(
    b8Rows,
    (row) => departmentNames.includes(row.Dept_Name),
    yearFields.b8DepartmentTotal
  );
  const rows = BRIEFER_ESTIMATES.map((item) => {
    let dashboardAmount = 0;
    if (item.label === "Education") {
      dashboardAmount = sumB8([
        "Department of Education (DepEd)",
        "State Universities and Colleges (SUCs)",
        "Commission on Higher Education (CHED)",
        "Technical Education and Skills Development Authority (TESDA)",
      ]);
    } else if (item.label === "Public Works") {
      dashboardAmount = sumB8(["Department of Public Works and Highways (DPWH)"]);
    } else if (item.label === "Health") {
      dashboardAmount = sumB8(["Department of Health (DOH)"]);
    } else if (item.label === "Interior and Local Government") {
      dashboardAmount = sumB8(["Department of the Interior and Local Government (DILG)"]);
    } else if (item.label === "Defense") {
      dashboardAmount = sumB8(["Department of National Defense (DND)"]);
    } else if (item.label === "Social Welfare") {
      dashboardAmount = sumB8(["Department of Social Welfare and Development (DSWD)"]);
    } else if (item.label === "Agriculture") {
      dashboardAmount = sumB8(["Department of Agriculture (DA)", "Department of Agrarian Reform (DAR)"]);
    } else if (item.label === "Transportation") {
      dashboardAmount = sumB8(["Department of Transportation (DOTr)"]);
    } else if (item.label === "Climate Change Expenditures") {
      dashboardAmount = sumRows(b21Rows, (row) => row.Department_Special_Purpose_Fund_Name === "TOTAL", yearFields.b21ClimateTotal);
    }
    const delta = dashboardAmount - item.peopleAmount;
    const variancePercent = item.peopleAmount ? (delta / item.peopleAmount) * 100 : 0;
    return { ...item, dashboardAmount, delta, variancePercent };
  });
  return rows;
}

function StatCard({ label, value, detail }) {
  return (
    <div style={{ ...cardStyle, borderRadius: 18, padding: 18 }}>
      <div style={{ ...eyebrowStyle, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: F.serif, fontSize: 34, lineHeight: 1, color: C.navy, marginBottom: 8 }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{detail}</div>
    </div>
  );
}

function ComparisonGraphRow({ item, currencyDisplay, comparisonMax, dashboardLabel }) {
  const fmt = (val) => formatMoneyCompact(val * 1000, { currencyDisplay });
  return (
    <div style={{ padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: C.navy, fontSize: 15, fontWeight: 600 }}>{item.label}</div>
          <div style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.5 }}>CSV source: {item.source}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.05em", color: C.muted }}>Briefer proposed (trusted)</span>
            <span style={{ color: C.navy, fontSize: 12.5 }}>{fmt(item.peopleAmount)}</span>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: "rgba(0,22,58,.06)", overflow: "hidden" }}>
            <div style={{ width: `${(item.peopleAmount / comparisonMax) * 100}%`, height: "100%", background: C.navy, borderRadius: 999 }} />
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.05em", color: C.muted }}>{dashboardLabel}</span>
            <span style={{ color: C.navy, fontSize: 12.5 }}>{fmt(item.dashboardAmount)}</span>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: "rgba(118,194,201,.14)", overflow: "hidden" }}>
            <div style={{ width: `${(item.dashboardAmount / comparisonMax) * 100}%`, height: "100%", background: C.teal2, borderRadius: 999 }} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, color: C.muted, fontSize: 12.5, lineHeight: 1.55 }}>
        {item.variancePercent >= 0 ? "+" : ""}{item.variancePercent.toFixed(1)}% variance ({item.delta >= 0 ? "+" : ""}{fmt(Math.abs(item.delta))})
      </div>
    </div>
  );
}

export default function PeopleBudgetComparisonPage({ onNavigate, selectedYears = ["2025"], currencyDisplay = "php" }) {
  const activeYear = getLatestSelectedYear(selectedYears);
  const activeYearFields = YEAR_FIELDS[activeYear] || YEAR_FIELDS["2025"];
  const alignmentDataset = buildAlignmentDataset(activeYear);
  const totalSelectedYear = sumRows(b5aRows, isTopLevel, activeYearFields.b5aTotal);
  const previousYear = activeYear === "2024" ? null : String(Number(activeYear) - 1);
  const previousYearTotal = previousYear && YEAR_FIELDS[previousYear]
    ? sumRows(b5aRows, isTopLevel, YEAR_FIELDS[previousYear].b5aTotal)
    : 0;
  const yoyGrowth = previousYearTotal ? ((totalSelectedYear - previousYearTotal) / previousYearTotal) * 100 : 0;
  const climateTotal = sumRows(b21Rows, (row) => row.Department_Special_Purpose_Fund_Name === "TOTAL", activeYearFields.b21ClimateTotal);
  const comparisonMax = Math.max(...alignmentDataset.map((item) => Math.max(item.peopleAmount, item.dashboardAmount)));
  const totalBrieferEstimate = alignmentDataset.reduce((sum, row) => sum + row.peopleAmount, 0);
  const dashboardLabel = `${activeYear} ${activeYearFields.label} (${alignmentDataset[0]?.source?.startsWith("B.8") ? "B.8/B.21 mix" : "CSV source"})`;
  const fmt = (val) => formatMoneyCompact(val * 1000, { currencyDisplay });

  const summaryStats = [
    {
      label: `${activeYear} ${activeYearFields.label.toLowerCase()} total`,
      value: fmt(totalSelectedYear),
      detail: `Sum of top-level sector rows in B.5.a (${activeYear} column).`,
    },
    {
      label: "Year-on-year growth",
      value: previousYear ? `${yoyGrowth >= 0 ? "+" : ""}${yoyGrowth.toFixed(1)}%` : "N/A",
      detail: previousYear
        ? `${activeYear} vs ${previousYear} across the same B.5.a sector totals.`
        : "No prior year available in this view.",
    },
    {
      label: "Briefer proposed total",
      value: fmt(totalBrieferEstimate),
      detail: "Trusted estimate from the briefer figures used in this crosswalk.",
    },
    {
      label: "Climate expenditures",
      value: fmt(climateTotal),
      detail: `${activeYear} total from B.21 climate table.`,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ ...cardStyle, borderRadius: 24, padding: 26, background: "linear-gradient(135deg, rgba(255,255,255,.96) 0%, rgba(236,244,247,.98) 58%, rgba(225,239,242,.98) 100%)" }}>
        <div style={eyebrowStyle}>People&apos;s Budget Comparison</div>
        <div style={{ fontFamily: F.serif, fontSize: 40, lineHeight: 1.04, color: C.navy, maxWidth: 860, marginBottom: 14 }}>
          Briefer estimates vs. CSV totals
        </div>
        <div style={{ color: "rgba(0,22,58,.72)", fontSize: 15, lineHeight: 1.75, maxWidth: 920 }}>Briefer proposed values are treated as trusted FY2025 estimates. Dashboard values use the most reliable table per category for {activeYear}.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        {summaryStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div style={{ ...cardStyle, borderRadius: 18, padding: 22 }}>
        <div style={eyebrowStyle}>Priority Sectors</div>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>Department categories use B.8 totals; climate uses B.21 TOTAL; national headline uses B.5.a.</div>
        {alignmentDataset.map((item) => (
          <ComparisonGraphRow key={item.label} item={item} currencyDisplay={currencyDisplay} comparisonMax={comparisonMax} dashboardLabel={dashboardLabel} />
        ))}
      </div>

      <div style={{ ...cardStyle, borderRadius: 18, padding: 22 }}>
        <div style={eyebrowStyle}>Comparison Table</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ background: "rgba(241,245,248,.9)" }}>
                {["Sector", "Briefer proposed (trusted)", dashboardLabel, "Variance", "CSV source"].map((header) => (
                  <th key={header} style={{ textAlign: "left", padding: "12px 14px", borderBottom: `1px solid ${C.border}`, fontFamily: F.mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, fontWeight: 500 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alignmentDataset.map((row) => (
                <tr key={row.label}>
                  <td style={{ padding: "14px", borderBottom: `1px solid ${C.border}`, color: C.navy, fontWeight: 600 }}>{row.label}</td>
                  <td style={{ padding: "14px", borderBottom: `1px solid ${C.border}`, color: C.navy }}>{fmt(row.peopleAmount)}</td>
                  <td style={{ padding: "14px", borderBottom: `1px solid ${C.border}`, color: C.navy }}>{fmt(row.dashboardAmount)}</td>
                  <td style={{ padding: "14px", borderBottom: `1px solid ${C.border}`, color: C.navy }}>{row.variancePercent >= 0 ? "+" : ""}{row.variancePercent.toFixed(1)}%</td>
                  <td style={{ padding: "14px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
