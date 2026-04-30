import { C, F } from "../theme/tokens";
import { cardStyle, eyebrowStyle } from "../theme/styles";
import worldBankRaw from "../../example/philippines_projects_a4_like.csv?raw";
import { parseCsv, toNumber } from "../data/csv";

// ---------- Building blocks ----------

function Card({ style, children }) {
  return <div style={{ ...cardStyle, ...style }}>{children}</div>;
}

function Eyebrow({ style, children }) {
  return <div style={{ ...eyebrowStyle, ...style }}>{children}</div>;
}

function KpiIcon({ type }) {
  const svgProps = {
    width: 14, height: 14, viewBox: "0 0 24 24",
    fill: "none", stroke: C.teal2, strokeWidth: 1.8,
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  let icon;
  if (type === "layers") {
    icon = <svg {...svgProps}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
  } else if (type === "award") {
    icon = <svg {...svgProps}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>;
  } else if (type === "barChart") {
    icon = <svg {...svgProps}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
  }
  return (
    <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(90,173,186,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon}
    </div>
  );
}

function KpiCard(p) {
  const tone = p.tone || "neutral";
  const deltaColor = tone === "pos" ? "#1a8c5a" : tone === "neg" ? "#b03030" : C.muted;
  const Tag = p.href ? "a" : "div";
  const wrapProps = p.href
    ? { href: p.href, target: "_blank", rel: "noopener noreferrer", style: { textDecoration: "none", display: "block" } }
    : {};

  return (
    <Tag
      {...wrapProps}
      style={{
        ...cardStyle,
        ...(wrapProps.style || {}),
        padding: 10,
        paddingTop: 7,
        paddingBottom: 8,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: p.href ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ ...eyebrowStyle, marginTop: 2 }}>{p.title}</div>
        {p.icon && <KpiIcon type={p.icon} />}
      </div>

      <div
        style={{
          fontFamily: F.serif,
          fontSize: 24,
          fontWeight: 600,
          color: C.navy,
          lineHeight: 1,
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {p.value}
        {p.showIcon && (
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={C.teal2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        )}
      </div>

      <div style={{ marginTop: "auto", minHeight: 18, display: "flex", alignItems: "center" }}>
        {p.change && (
          <div style={{ fontSize: 10.5, fontWeight: 500, color: deltaColor, lineHeight: 1.4 }}>
            {p.change}
          </div>
        )}
      </div>
    </Tag>
  );
}

function PanelCard({ title, style, bodyStyle, children }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", ...style }}>
      <div style={{ marginBottom: 12, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", alignItems: "center" }}>
        <div style={eyebrowStyle}>{title}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, ...bodyStyle }}>{children}</div>
    </Card>
  );
}

function TutorialPlaceholder() {
  return (
    <div
      style={{
        borderRadius: 8,
        overflow: "hidden",
        height: "100%",
        position: "relative",
        background: "linear-gradient(180deg, rgba(118,194,201,.16) 0%, rgba(118,194,201,.06) 70%, rgba(0,22,58,.04) 100%)",
        border: `1px solid ${C.border}`,
      }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: C.white, border: `1px solid ${C.border}`,
            boxShadow: "0 6px 18px rgba(0,22,58,.08)",
            display: "grid", placeItems: "center",
          }}
        >
          <div style={{ marginLeft: 4, width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: `14px solid ${C.teal2}` }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 12, bottom: 10, fontFamily: F.mono, fontSize: 10, letterSpacing: "0.06em", color: C.muted, textTransform: "uppercase" }}>
        Coming soon
      </div>
    </div>
  );
}

// ---------- Data ----------

const worldBankGrantTotal = parseCsv(worldBankRaw).reduce(
  (sum, row) => sum + toNumber(row["2025_Program_NG"]),
  0
);

const grantAmountCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
}).format(worldBankGrantTotal);

const overviewCards = [
  { title: "Total Datasets",  value: "16", change: "CSV files",       tone: "neutral", icon: "layers"   },
  { title: "Total Grants",    value: grantAmountCompact, change: "World Bank grants source", tone: "neutral", icon: "award"    },
  { title: "Analysis Pages",  value: "17", change: "Views available", tone: "neutral", icon: "barChart" },
  {
    title: "User Feedback",
    value: "Share your thoughts",
    change: "Open form →",
    tone: "neutral",
    href: "https://docs.google.com/forms/d/e/1FAIpQLScSi4S5TXr50m2bjCZxxmE6YVoN-oqxCKZHtPswyOppp7cDUQ/viewform?usp=dialog",
    showIcon: true,
  },
];

const timelineItems = [
  { year: "FY 2024", type: "Actual",  typeColor: "#1a8c5a", typeBg: "rgba(73,197,122,0.12)",  desc: "Historical expenditure — finalized disbursements and obligations across all agencies.", isCurrent: false },
  { year: "FY 2025", type: "Program", typeColor: "#5AADBA", typeBg: "rgba(90,173,186,0.12)",  desc: "Approved budget program — allocations as legislated for the fiscal year.", isCurrent: false },
  { year: "FY 2026", type: "GAA",     typeColor: C.navy,    typeBg: "rgba(0,22,58,0.07)",     desc: "General Appropriations Act — current year appropriations from the DBM BESF tables.", isCurrent: true },
];

const featureItems = [
  { label: "Filter across years",           desc: "Toggle between FY 2024, 2025 & 2026",          icon: "calendar" },
  { label: "Search across criteria",         desc: "Find departments, sectors, agencies and more", icon: "search"   },
  { label: "Easy to read graphs & displays", desc: "Bar charts, treemaps and ranked tables",        icon: "chart"    },
  { label: "Analyst data interpretations",   desc: "Contextual notes to guide your reading",       icon: "info"     },
];

function FeatureIcon({ type }) {
  const props = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "calendar") return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
  if (type === "search")   return <svg {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
  if (type === "chart")    return <svg {...props}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>;
  return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}

const sourcingLinks = [
  { org: "Department of Budget and Management (DBM)", label: "General Appropriations Act (GAA) FY 2026 — BESF Tables", url: "https://www.dbm.gov.ph/index.php/2026/general-appropriations-act-gaa-fy-2026#fy-2026-gaa-level-besf-tables" },
  { org: "Asian Development Bank (ADB)",              label: "IATI Activities — Philippines",                          url: "https://www.adb.org/iati/iati-activities-ph.xml" },
  { org: "World Bank",                                label: "Projects & Operations — Philippines",                    url: "https://projects.worldbank.org/en/projects-operations/projects-list?lang=en&countrycode_exact=PH" },
  { org: "World Bank",                                label: "Philippines Country Overview",                           url: "https://www.worldbank.org/ext/en/country/philippines" },
];

const pillStyle = {
  fontFamily: F.mono, fontSize: 10, letterSpacing: "0.06em",
  padding: "4px 10px", borderRadius: 999,
  border: `1px solid ${C.border}`, background: "rgba(255,255,255,.72)", color: C.muted,
};

// ---------- Page ----------

export default function HomePage() {
  return (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Title — pills pinned to top-right */}
          <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, paddingTop: 2 }}>
            <div
              style={{
                fontFamily: F.serif,
                fontSize: "clamp(22px, 2.2vw, 34px)",
                fontWeight: 400,
                color: C.navy,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
                minWidth: 0,
              }}
            >
              UNDP National Budget and Expenditure Explorer
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0, marginLeft: 24, paddingTop: 4 }}>
              <span style={pillStyle}>Data: FY 2024 – 2026</span>
              <span style={pillStyle}>Last updated: April 2026</span>
            </div>
          </div>

          {/* Dashboard Overview */}
          <Card style={{ padding: "14px 16px 14px", flexShrink: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {overviewCards.map((card) => <KpiCard key={card.title} {...card} />)}
            </div>
          </Card>

          {/* Three panels */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) minmax(240px, 1fr) minmax(220px, .95fr)", gap: 12, flex: 1, minHeight: 0 }}>

            {/* Data Timeline */}
            <PanelCard title="Data Timeline">
              <div style={{ display: "flex", flexDirection: "column" }}>
                {timelineItems.map((item, i, arr) => (
                  <div key={item.year} style={{ display: "flex", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, marginTop: 3, background: item.isCurrent ? C.navy : C.teal, boxShadow: item.isCurrent ? "0 0 0 3px rgba(0,22,58,0.15)" : "0 0 0 3px rgba(118,194,201,0.2)" }} />
                      {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: C.border, minHeight: 28, margin: "4px 0" }} />}
                    </div>
                    <div style={{ paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: C.navy }}>{item.year}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 999, background: item.typeBg, color: item.typeColor, fontWeight: 600 }}>{item.type}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </PanelCard>

            {/* Key Features */}
            <PanelCard title="Key Features">
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                {featureItems.map((item) => (
                  <li key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: "rgba(118,194,201,.13)", color: C.teal2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FeatureIcon type={item.icon} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.navy, lineHeight: 1.3 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginTop: 1 }}>{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </PanelCard>

            {/* Video Tutorial */}
            <PanelCard title="Video Tutorial: How to Use and Navigate">
              <TutorialPlaceholder />
            </PanelCard>

          </div>

          {/* Sourcing Information */}
          <Card style={{ padding: "14px 16px 16px", flexShrink: 0 }}>
            <Eyebrow style={{ marginBottom: 9 }}>Sourcing Information</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 9 }}>
              {sourcingLinks.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", minHeight: 64, borderRadius: 8, border: `1px solid ${C.border}`, background: C.mist, textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(118,194,201,.10)"; e.currentTarget.style.borderColor = C.teal; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.mist; e.currentTarget.style.borderColor = C.border; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: "rgba(118,194,201,.18)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.teal2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 1 }}>{s.org}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.navy, lineHeight: 1.3 }}>{s.label}</div>
                  </div>
                  <svg style={{ marginLeft: "auto", flexShrink: 0 }} width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              ))}
            </div>
          </Card>

      </div>

      {/* Disclaimer */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", paddingBottom: 8 }}>
        <div style={{ padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(90,173,186,.35)", background: "rgba(90,173,186,.07)", fontFamily: F.mono, fontSize: 10, letterSpacing: "0.04em", color: C.teal2, textAlign: "center" }}>
          Disclaimer: This tool is meant for easier data navigation. Please check with original spreadsheets for data accuracy.
        </div>
      </div>
    </div>
  );
}
