import { useMemo, useState } from "react";
import ChartCardFrame from "../cards/ChartCardFrame";
import { C, F } from "../../theme/tokens";

function HeaderChip({ header }) {
  return (
    <div
      title={header.raw}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: "rgba(255,255,255,.86)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.navy,
          lineHeight: 1.3,
        }}
      >
        {header.label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: F.mono,
          fontSize: 10,
          color: C.muted,
          lineHeight: 1.35,
          wordBreak: "break-word",
        }}
      >
        {header.raw}
      </div>
    </div>
  );
}

function HeaderGroup({ title, headers, collapsed, onExpand }) {
  if (!headers.length) return null;

  const visibleHeaders = collapsed ? headers.slice(0, 14) : headers;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 10,
          color: C.muted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        {visibleHeaders.map((header) => (
          <HeaderChip key={header.raw} header={header} />
        ))}
      </div>
      {collapsed && headers.length > visibleHeaders.length ? (
        <button
          type="button"
          onClick={onExpand}
          aria-expanded={!collapsed}
          style={{
            justifySelf: "start",
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            background: "rgba(255,255,255,.92)",
            color: C.navy,
            padding: "7px 12px",
            cursor: "pointer",
            fontFamily: F.mono,
            fontSize: 10,
            letterSpacing: "0.05em",
          }}
        >
          Show all {headers.length} columns
        </button>
      ) : null}
    </div>
  );
}

export default function SourceSchemaCard({ auditSummary }) {
  const [expandedGroup, setExpandedGroup] = useState("");
  const groups = useMemo(() => ({
    dimensions: auditSummary.headers.filter((header) => header.kind === "dimension"),
    yearly: auditSummary.headers.filter((header) => header.kind === "yearValue" || header.kind === "yearMetric"),
    meta: auditSummary.headers.filter((header) => header.kind === "meta"),
  }), [auditSummary.headers]);

  return (
    <ChartCardFrame
      title="Source & Columns"
      action={(
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,.72)",
              fontFamily: F.mono,
              fontSize: 10,
              color: C.muted,
              letterSpacing: "0.05em",
            }}
          >
            {auditSummary.sourceFile}
          </div>
          <div
            style={{
              padding: "7px 10px",
              borderRadius: 999,
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,.72)",
              fontFamily: F.mono,
              fontSize: 10,
              color: C.muted,
              letterSpacing: "0.05em",
            }}
          >
            {auditSummary.totalHeaders} raw columns
          </div>
        </div>
      )}
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            color: C.muted,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Human-friendly labels are shown first, with raw CSV headers beneath each column so reviewers can trace the source schema directly.
        </div>

        {auditSummary.warnings.length ? (
          <div style={{ display: "grid", gap: 8 }}>
            {auditSummary.warnings.map((warning) => (
              <div
                key={warning}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(216,138,119,.35)",
                  background: "rgba(216,138,119,.1)",
                  color: "#8f4637",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {warning}
              </div>
            ))}
          </div>
        ) : null}

        <HeaderGroup
          title="Dimensions"
          headers={groups.dimensions}
          collapsed={expandedGroup !== "dimensions"}
          onExpand={() => setExpandedGroup("dimensions")}
        />
        <HeaderGroup
          title="Yearly Data Fields"
          headers={groups.yearly}
          collapsed={expandedGroup !== "yearly"}
          onExpand={() => setExpandedGroup("yearly")}
        />
        <HeaderGroup
          title="Audit Fields"
          headers={groups.meta}
          collapsed={expandedGroup !== "meta"}
          onExpand={() => setExpandedGroup("meta")}
        />
      </div>
    </ChartCardFrame>
  );
}
