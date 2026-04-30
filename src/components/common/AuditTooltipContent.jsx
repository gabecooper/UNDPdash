import { C, F } from "../../theme/tokens";

function TooltipLine({ label, value }) {
  if (!value) return null;

  return (
    <div style={{ lineHeight: 1.5 }}>
      <span style={{ color: "rgba(244,252,253,.7)" }}>{label}:</span>{" "}
      <span>{value}</span>
    </div>
  );
}

export default function AuditTooltipContent({ title, audit }) {
  if (!audit) return null;

  const headerLabel = audit.headers?.length ? audit.headers.join(", ") : "";
  const pagesLabel = audit.pages?.length
    ? audit.pages.length === 1
      ? `Page ${audit.pages[0]}`
      : `Pages ${audit.pages.join(", ")}`
    : "";

  return (
    <div
      style={{
        background: C.navy,
        borderRadius: 8,
        padding: "9px 12px",
        fontSize: 11,
        color: "#fff",
        fontFamily: F.mono,
        boxShadow: "0 8px 20px rgba(0,22,58,.25)",
        maxWidth: 360,
      }}
    >
      {title ? (
        <div style={{ color: C.teal, marginBottom: 6 }}>
          {title}
        </div>
      ) : null}
      <TooltipLine label="CSV" value={audit.sourceFile} />
      <TooltipLine label="Source" value={pagesLabel} />
      <TooltipLine label="Raw Header" value={headerLabel} />
      <TooltipLine label="Note" value={audit.note} />
    </div>
  );
}
